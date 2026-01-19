# Docker Setup Guide
## Data-Driven Car Rental - Containerization Strategy

**Version:** 1.0
**Date:** 2026-01-19
**Docker Version:** 24.x+
**Docker Compose Version:** 2.x+

---

## 1. Docker Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │    Backend     │  │   PostgreSQL   │  │  Frontend │ │
│  │   (Node.js)    │  │      16.x      │  │  (Future) │ │
│  │   Port: 3000   │  │   Port: 5432   │  │ Port: 80  │ │
│  └────────────────┘  └────────────────┘  └───────────┘ │
│          │                   │                   │       │
│          └───────────────────┴───────────────────┘       │
│                      Network: app-network                │
│                                                          │
│  Volumes:                                                │
│  - postgres_data (persistent database)                   │
│  - Backend source code (bind mount for development)      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
data-driven-car-rental/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── .dockerignore
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── docs/
    └── backend/
        └── 04-docker-setup.md (this file)
```

---

## 3. Backend Dockerfile (Production)

**File:** `backend/Dockerfile`

```dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
```

---

## 4. Backend Dockerfile (Development)

**File:** `backend/Dockerfile.dev`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies for development
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code (in dev, this is mounted as volume)
COPY . .

# Expose port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]
```

---

## 5. Backend .dockerignore

**File:** `backend/.dockerignore`

```
# Dependencies
node_modules/
npm-debug.log
yarn-error.log

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Logs
logs/
*.log

# Testing
coverage/
.nyc_output/

# Misc
README.md
docs/
```

---

## 6. Docker Compose (Development)

**File:** `docker-compose.dev.yml`

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: car_rental_db_dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-car_rental_dev}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-car_rental_dev}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: car_rental_backend_dev
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: development
      PORT: ${PORT:-3000}
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-car_rental_dev}
      JWT_SECRET: ${JWT_SECRET:-dev-secret-change-in-production}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5173}
      LOG_LEVEL: ${LOG_LEVEL:-debug}
    ports:
      - "${PORT:-3000}:3000"
    volumes:
      # Mount source code for hot reload
      - ./backend/src:/app/src:delegated
      - ./backend/prisma:/app/prisma:delegated
      # Use named volume for node_modules to avoid platform issues
      - backend_node_modules:/app/node_modules
    networks:
      - app-network
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm run dev"

volumes:
  postgres_data_dev:
    name: car_rental_postgres_data_dev
  backend_node_modules:
    name: car_rental_backend_node_modules_dev

networks:
  app-network:
    name: car_rental_network_dev
    driver: bridge
```

---

## 7. Docker Compose (Production)

**File:** `docker-compose.yml`

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: car_rental_db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Don't expose port externally in production
    # Only accessible via Docker network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: car_rental_backend
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
      FRONTEND_URL: ${FRONTEND_URL}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    ports:
      - "3000:3000"
    networks:
      - app-network
    command: sh -c "npx prisma migrate deploy && node dist/server.js"
    # Security: Read-only root filesystem (except /tmp)
    read_only: true
    tmpfs:
      - /tmp
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  # Frontend (Future)
  # frontend:
  #   build:
  #     context: ./frontend
  #     dockerfile: Dockerfile
  #   container_name: car_rental_frontend
  #   restart: always
  #   depends_on:
  #     - backend
  #   environment:
  #     VITE_API_URL: http://backend:3000/api
  #   ports:
  #     - "80:80"
  #   networks:
  #     - app-network

volumes:
  postgres_data:
    name: car_rental_postgres_data

networks:
  app-network:
    name: car_rental_network
    driver: bridge
```

---

## 8. Environment Variables

### 8.1 .env.example

**File:** `.env.example`

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=car_rental_dev
DB_PORT=5432

# Full database URL (auto-constructed in docker-compose)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_rental_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-change-this
JWT_EXPIRES_IN=15m

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

### 8.2 Production .env Template

**File:** `.env.production.example`

```bash
# Application
NODE_ENV=production
PORT=3000

# Database (CHANGE THESE!)
DB_USER=car_rental_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=car_rental_prod
DB_PORT=5432

# JWT (CHANGE THIS!)
JWT_SECRET=CHANGE_ME_USE_STRONG_RANDOM_STRING_MIN_32_CHARS
JWT_EXPIRES_IN=15m

# CORS (Your frontend domain)
FRONTEND_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

---

## 9. Development Workflow

### 9.1 Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd data-driven-car-rental

# 2. Create environment file
cp .env.example .env
# Edit .env with your local settings

# 3. Build and start services
docker-compose -f docker-compose.dev.yml up --build

# Backend will automatically:
# - Run Prisma migrations
# - Seed database
# - Start with hot reload

# 4. Access services
# Backend API: http://localhost:3000
# Swagger Docs: http://localhost:3000/api-docs
# Prisma Studio: docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
```

### 9.2 Daily Development Commands

```bash
# Start services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build
```

### 9.3 Database Management

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# Seed database
docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

# Access PostgreSQL CLI
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d car_rental_dev

# Create database backup
docker-compose -f docker-compose.dev.yml exec db pg_dump -U postgres car_rental_dev > backup.sql

# Restore database from backup
docker-compose -f docker-compose.dev.yml exec -T db psql -U postgres car_rental_dev < backup.sql
```

### 9.4 Debugging

```bash
# Execute bash inside backend container
docker-compose -f docker-compose.dev.yml exec backend sh

# View environment variables
docker-compose -f docker-compose.dev.yml exec backend env

# Check container health
docker-compose -f docker-compose.dev.yml ps

# View resource usage
docker stats
```

---

## 10. Production Deployment

### 10.1 Pre-Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Change `DB_PASSWORD` to strong password
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_LEVEL=info` or `warn`
- [ ] Review and update `docker-compose.yml` resource limits
- [ ] Ensure SSL/TLS certificates ready (if using HTTPS)

### 10.2 Deployment Commands

```bash
# 1. Create production environment file
cp .env.production.example .env
# Edit .env with production values

# 2. Build production images
docker-compose build --no-cache

# 3. Start services
docker-compose up -d

# 4. Check health
docker-compose ps
docker-compose logs -f backend

# 5. Run migrations (first time only)
docker-compose exec backend npx prisma migrate deploy

# 6. Seed database (optional, for demo data)
docker-compose exec backend npx prisma db seed
```

### 10.3 Production Monitoring

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f db

# Check container health
docker-compose ps

# View resource usage
docker stats

# Restart services
docker-compose restart backend

# Update application (zero-downtime)
docker-compose pull
docker-compose up -d --build --no-deps backend
```

### 10.4 Backup & Recovery

```bash
# Automated daily backup (cron job)
# Add to crontab: 0 2 * * * /path/to/backup.sh

# backup.sh
#!/bin/bash
BACKUP_DIR="/backups/car_rental"
DATE=$(date +%Y%m%d_%H%M%S)

docker-compose exec -T db pg_dump -U car_rental_user car_rental_prod > \
  $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

# Restore from backup
docker-compose exec -T db psql -U car_rental_user car_rental_prod < backup_20260119_020000.sql
```

---

## 11. Optimization Tips

### 11.1 Image Size Optimization
- ✅ Multi-stage builds (builder + production)
- ✅ Alpine Linux base images (smaller footprint)
- ✅ `.dockerignore` to exclude unnecessary files
- ✅ `npm ci --only=production` for production dependencies only
- ✅ Clean npm cache after install

### 11.2 Build Performance
```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Build with cache
docker-compose build

# Build without cache (clean build)
docker-compose build --no-cache

# Parallel builds
docker-compose build --parallel
```

### 11.3 Runtime Performance
- Container resource limits (CPU, memory)
- PostgreSQL connection pooling (Prisma default: 10)
- Read-only root filesystem for security
- Health checks for automatic recovery

---

## 12. Troubleshooting

### 12.1 Common Issues

**Issue: Port already in use**
```bash
# Find process using port 3000
lsof -i :3000
# Or on Linux
netstat -tuln | grep 3000

# Kill process or change port in .env
PORT=3001
```

**Issue: Database connection refused**
```bash
# Check if db service is healthy
docker-compose -f docker-compose.dev.yml ps

# View db logs
docker-compose -f docker-compose.dev.yml logs db

# Wait for db health check, then restart backend
docker-compose -f docker-compose.dev.yml restart backend
```

**Issue: Prisma migration fails**
```bash
# Reset database (WARNING: deletes data)
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# Or manually fix migration
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate resolve --applied <migration_name>
```

**Issue: Hot reload not working**
```bash
# Ensure source code is mounted as volume
# Check docker-compose.dev.yml volumes section

# Restart with rebuild
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

**Issue: Out of disk space**
```bash
# Remove unused containers, images, volumes
docker system prune -a --volumes

# View disk usage
docker system df
```

### 12.2 Debug Mode

Add to `docker-compose.dev.yml` backend service:
```yaml
environment:
  DEBUG: 'express:*,prisma:*'
  NODE_OPTIONS: '--inspect=0.0.0.0:9229'
ports:
  - "3000:3000"
  - "9229:9229"  # Node.js debugger
```

Attach debugger from VS Code:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "remoteRoot": "/app",
  "localRoot": "${workspaceFolder}/backend",
  "port": 9229
}
```

---

## 13. CI/CD Integration (Future)

### 13.1 GitHub Actions Example

**File:** `.github/workflows/docker-build.yml`

```yaml
name: Docker Build & Push

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: |
            yourusername/car-rental-backend:latest
            yourusername/car-rental-backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 14. Security Best Practices

### 14.1 Container Security
- ✅ Run as non-root user
- ✅ Read-only root filesystem
- ✅ Drop unnecessary capabilities
- ✅ Use specific image tags (not `latest`)
- ✅ Scan images for vulnerabilities: `docker scan car-rental-backend`
- ✅ Keep base images updated

### 14.2 Secrets Management
- ❌ Never commit `.env` files to git
- ✅ Use Docker secrets for production
- ✅ Use strong random passwords
- ✅ Rotate JWT secrets regularly

### 14.3 Network Security
- Internal network for db (not exposed to host in production)
- CORS configured for specific frontend domain
- Rate limiting enabled
- Helmet.js for HTTP security headers

---

## 15. Frontend Docker Setup (Future)

**File:** `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**File:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 16. Quick Reference

### 16.1 Common Commands Cheatsheet

| Task | Command |
|------|---------|
| Start dev environment | `docker-compose -f docker-compose.dev.yml up` |
| Stop dev environment | `docker-compose -f docker-compose.dev.yml down` |
| View logs | `docker-compose -f docker-compose.dev.yml logs -f backend` |
| Rebuild | `docker-compose -f docker-compose.dev.yml up --build` |
| Fresh start | `docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up --build` |
| Run migrations | `docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev` |
| Seed database | `docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed` |
| Prisma Studio | `docker-compose -f docker-compose.dev.yml exec backend npx prisma studio` |
| Access container shell | `docker-compose -f docker-compose.dev.yml exec backend sh` |
| Access PostgreSQL | `docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d car_rental_dev` |

### 16.2 Port Reference

| Service | Development Port | Production Port |
|---------|-----------------|-----------------|
| Backend API | 3000 | 3000 |
| PostgreSQL | 5432 | (internal only) |
| Frontend | 5173 (Vite) | 80 (Nginx) |
| Node Debugger | 9229 | - |
| Prisma Studio | 5555 | - |

---

## 17. Next Steps

1. ✅ Review this Docker setup guide
2. ⏳ Create `backend/Dockerfile` and `backend/Dockerfile.dev`
3. ⏳ Create `backend/.dockerignore`
4. ⏳ Create `docker-compose.yml` and `docker-compose.dev.yml`
5. ⏳ Create `.env.example`
6. ⏳ Test development setup: `docker-compose -f docker-compose.dev.yml up --build`
7. ⏳ Verify API endpoints at `http://localhost:3000/api-docs`
8. ⏳ Test database connection with Prisma Studio

---

**Document Status:** ✅ Ready for Implementation
**Related Documents:**
- [Technical Requirements](./01-technical-requirements.md)
- [Database Schema](./02-database-schema.md)
- [API Specification](./03-api-specification.md)
- [BRD](../brd.md)
