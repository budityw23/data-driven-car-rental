# Implementation Plan - Part A: Foundation
## Data-Driven Car Rental - Backend Implementation (Phases 1-3)

**Version:** 2.0
**Date:** 2026-01-19
**Document:** Part A of 2 (Foundation)
**Phases Covered:** 1-3 (Setup, Database, Core Infrastructure)
**Estimated Duration:** 5-8 hours

---

## Document Navigation

| Document | Phases | Content |
|----------|--------|---------|
| **05a-implementation-plan-foundation.md** (This file) | 1-3 | Project Setup, Docker, Database, Core Architecture |
| [05b-implementation-plan-features.md](./05b-implementation-plan-features.md) | 4-8 | Auth, Cars, Bookings, Admin, Analytics, Polish |

---

## Overview

This document covers the **foundation phases** - things you set up ONCE at the beginning:

| Phase | Name | Description | Est. Duration |
|-------|------|-------------|---------------|
| 1 | Project Setup & Docker | Initialize project, Docker, database | 1-2 hours |
| 2 | Database & Prisma | Schema, migrations, seed data | 2-3 hours |
| 3 | Core Infrastructure | Clean architecture setup, utilities | 2-3 hours |

**After completing Part A**, your project will have:
- ✅ Working Docker environment
- ✅ Complete database schema with seed data
- ✅ Clean architecture folder structure
- ✅ Error handling, logging, utilities
- ✅ Ready for feature development (Part B)

---

# PHASE 1: Project Setup & Docker

## Goal: Working development environment with Docker

**Duration:** 1-2 hours
**Prerequisites:** Docker Desktop installed, Node.js 20+ (for local development)

---

## 1.1 Initialize Backend Project

### Task 1.1.1: Create Directory Structure

**Action:** Create the following folder structure

```bash
mkdir -p backend/src
cd backend
```

**Expected Result:**
```
data-driven car rental/
├── backend/
│   └── src/
├── docs/
│   └── backend/
├── docker-compose.dev.yml (will create)
└── docker-compose.yml (will create)
```

---

### Task 1.1.2: Initialize npm Project

**Action:** Run in `backend/` directory

```bash
cd backend
npm init -y
```

**Then modify `package.json`:**

```json
{
  "name": "car-rental-backend",
  "version": "1.0.0",
  "description": "Data-Driven Car Rental Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio"
  },
  "keywords": ["car-rental", "api", "express", "prisma"],
  "author": "",
  "license": "ISC"
}
```

---

### Task 1.1.3: Install Core Dependencies

**Action:** Run in `backend/` directory

```bash
npm install express cors helmet morgan dotenv zod jsonwebtoken bcryptjs winston
npm install @prisma/client
```

**Dependencies explanation:**

| Package | Purpose |
|---------|---------|
| express | Web framework |
| cors | Cross-Origin Resource Sharing |
| helmet | Security headers |
| morgan | HTTP request logging |
| dotenv | Environment variables |
| zod | Input validation |
| jsonwebtoken | JWT authentication |
| bcryptjs | Password hashing |
| winston | Logging |
| @prisma/client | Database ORM |

---

### Task 1.1.4: Install Dev Dependencies

**Action:** Run in `backend/` directory

```bash
npm install -D typescript tsx nodemon prisma
npm install -D @types/node @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs
```

**Dev dependencies explanation:**

| Package | Purpose |
|---------|---------|
| typescript | TypeScript compiler |
| tsx | TypeScript execution (replaces ts-node) |
| nodemon | Auto-restart on file changes |
| prisma | Database migrations and schema |
| @types/* | TypeScript type definitions |

---

### Task 1.1.5: Create tsconfig.json

**Action:** Create `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@domain/*": ["domain/*"],
      "@application/*": ["application/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@presentation/*": ["presentation/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Task 1.1.6: Create .gitignore

**Action:** Create `backend/.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment files
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/migrations/**/migration_lock.toml

# Test coverage
coverage/

# Misc
*.tsbuildinfo
```

---

### Task 1.1.7: Create nodemon.json

**Action:** Create `backend/nodemon.json`

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "tsx src/server.ts"
}
```

---

## 1.2 Create Docker Files

### Task 1.2.1: Create Dockerfile (Production)

**Action:** Create `backend/Dockerfile`

```dockerfile
# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
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

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
```

---

### Task 1.2.2: Create Dockerfile.dev (Development)

**Action:** Create `backend/Dockerfile.dev`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code (will be overwritten by volume mount in dev)
COPY . .

# Expose port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]
```

---

### Task 1.2.3: Create .dockerignore

**Action:** Create `backend/.dockerignore`

```dockerignore
# Dependencies (will be installed in container)
node_modules/

# Build outputs
dist/
*.tsbuildinfo

# Environment files (passed via docker-compose)
.env
.env.*

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Logs
logs/
*.log

# Test files
coverage/
*.spec.ts
*.test.ts

# Documentation
README.md
docs/

# Misc
.prettierrc
.eslintrc*
```

---

### Task 1.2.4: Create docker-compose.dev.yml

**Action:** Create `docker-compose.dev.yml` in **project root** (not in backend/)

```yaml
version: '3.9'

services:
  # ============================================
  # PostgreSQL Database
  # ============================================
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
      interval: 5s
      timeout: 5s
      retries: 10

  # ============================================
  # Backend API (Development with Hot Reload)
  # ============================================
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
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-car_rental_dev}?schema=public
      JWT_SECRET: ${JWT_SECRET:-dev-secret-key-change-in-production-min-32-chars}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5173}
      LOG_LEVEL: ${LOG_LEVEL:-debug}
    ports:
      - "${PORT:-3000}:3000"
    volumes:
      # Mount source code for hot reload
      - ./backend/src:/app/src:delegated
      - ./backend/prisma:/app/prisma:delegated
      # Mount package.json for dependency updates
      - ./backend/package.json:/app/package.json:ro
      # Use named volume for node_modules to avoid platform issues
      - backend_node_modules_dev:/app/node_modules
    networks:
      - app-network

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data_dev:
    name: car_rental_postgres_data_dev
  backend_node_modules_dev:
    name: car_rental_backend_node_modules_dev

# ============================================
# Networks
# ============================================
networks:
  app-network:
    name: car_rental_network_dev
    driver: bridge
```

---

### Task 1.2.5: Create docker-compose.yml (Production)

**Action:** Create `docker-compose.yml` in **project root**

```yaml
version: '3.9'

services:
  # ============================================
  # PostgreSQL Database (Production)
  # ============================================
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
    # Not exposing port externally in production for security

  # ============================================
  # Backend API (Production)
  # ============================================
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
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
      FRONTEND_URL: ${FRONTEND_URL}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    ports:
      - "3000:3000"
    networks:
      - app-network
    # Security: Read-only root filesystem
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

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
    name: car_rental_postgres_data

# ============================================
# Networks
# ============================================
networks:
  app-network:
    name: car_rental_network
    driver: bridge
```

---

### Task 1.2.6: Create .env.example

**Action:** Create `.env.example` in **project root**

```bash
# ============================================
# Application
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# Database
# ============================================
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=car_rental_dev
DB_PORT=5432

# Full database URL (auto-constructed in docker-compose)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_rental_dev?schema=public

# ============================================
# JWT Authentication
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-change-this-in-production
JWT_EXPIRES_IN=15m

# ============================================
# CORS
# ============================================
FRONTEND_URL=http://localhost:5173

# ============================================
# Logging
# ============================================
LOG_LEVEL=debug
```

---

### Task 1.2.7: Create .env

**Action:** Create `.env` in **project root** (copy from example)

```bash
cp .env.example .env
```

**Content (same as .env.example for development):**

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=car_rental_dev
DB_PORT=5432

# JWT
JWT_SECRET=dev-secret-key-change-in-production-min-32-characters-here
JWT_EXPIRES_IN=15m

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

---

## 1.3 Create Basic Server

### Task 1.3.1: Create src/server.ts

**Action:** Create `backend/src/server.ts`

```typescript
import app from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

### Task 1.3.2: Create src/app.ts

**Action:** Create `backend/src/app.ts`

```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Express = express();

// ============================================
// Security Middlewares
// ============================================
app.use(helmet());

// ============================================
// CORS Configuration
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================
// Request Parsing
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Logging
// ============================================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ============================================
// Health Check Endpoint
// ============================================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// ============================================
// API Routes (will be added in later phases)
// ============================================
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Welcome to Car Rental API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        docs: '/api-docs (coming soon)',
      },
    },
  });
});

// ============================================
// 404 Handler
// ============================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
});

export default app;
```

---

## 1.4 Verify Phase 1

### Task 1.4.1: Build and Start Docker

**Action:** Run from **project root**

```bash
# Build and start containers
docker-compose -f docker-compose.dev.yml up --build
```

**Expected Output:**
```
car_rental_db_dev      | PostgreSQL init process complete; ready for start up.
car_rental_db_dev      | LOG:  database system is ready to accept connections
car_rental_backend_dev | 🚀 Server is running on http://localhost:3000
car_rental_backend_dev | 📋 Health check: http://localhost:3000/health
car_rental_backend_dev | 🔧 Environment: development
```

---

### Task 1.4.2: Test Health Endpoint

**Action:** Open new terminal, run:

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-19T10:00:00.000Z",
    "uptime": 5.123456789,
    "environment": "development"
  }
}
```

---

### Task 1.4.3: Test API Root Endpoint

**Action:** Run:

```bash
curl http://localhost:3000/api
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Welcome to Car Rental API",
    "version": "1.0.0",
    "endpoints": {
      "health": "/health",
      "docs": "/api-docs (coming soon)"
    }
  }
}
```

---

### Task 1.4.4: Verify Hot Reload

**Action:**
1. Open `backend/src/app.ts`
2. Change the welcome message to `"Welcome to Car Rental API v2"`
3. Save the file
4. Watch the terminal for restart
5. Run curl again to verify change

**Expected:** Server should restart automatically and return new message

---

### Task 1.4.5: Verify Database Container

**Action:** Run:

```bash
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d car_rental_dev -c "\dt"
```

**Expected Output:**
```
Did not find any relations.
```
(This is correct - we haven't created tables yet)

---

## Phase 1 Completion Checklist

- [x] 1.1.1 Created backend directory structure
- [x] 1.1.2 Initialized npm project with correct package.json
- [x] 1.1.3 Installed core dependencies
- [x] 1.1.4 Installed dev dependencies
- [x] 1.1.5 Created tsconfig.json
- [x] 1.1.6 Created .gitignore
- [x] 1.1.7 Created nodemon.json
- [x] 1.2.1 Created Dockerfile (production)
- [x] 1.2.2 Created Dockerfile.dev (development)
- [x] 1.2.3 Created .dockerignore
- [x] 1.2.4 Created docker-compose.dev.yml
- [x] 1.2.5 Created docker-compose.yml
- [x] 1.2.6 Created .env.example
- [x] 1.2.7 Created .env
- [x] 1.3.1 Created src/server.ts
- [x] 1.3.2 Created src/app.ts
- [x] 1.4.1 Docker containers start successfully
- [x] 1.4.2 Health endpoint returns healthy status
- [x] 1.4.3 API root endpoint works
- [x] 1.4.4 Hot reload works (will test in Phase 2)
- [x] 1.4.5 Database container is running

## Phase 1 Deliverables

```
data-driven car rental/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   └── app.ts
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── .dockerignore
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── nodemon.json
├── docker-compose.dev.yml
├── docker-compose.yml
├── .env.example
└── .env
```

## Resume Point (Phase 1)

If you stop after Phase 1 and return later:

```bash
# Start the containers
docker-compose -f docker-compose.dev.yml up

# Verify everything works
curl http://localhost:3000/health
```

---

# PHASE 2: Database & Prisma

## Goal: Complete database schema with seed data

**Duration:** 2-3 hours
**Prerequisites:** Phase 1 completed, Docker containers running

---

## 2.1 Initialize Prisma

### Task 2.1.1: Install Prisma (already done in Phase 1)

**Verify:** Prisma should already be installed. Check with:

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma --version
```

---

### Task 2.1.2: Initialize Prisma

**Action:** Run inside container:

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma init
```

**Expected:** Creates `prisma/schema.prisma` and updates `.env`

---

### Task 2.1.3: Verify DATABASE_URL

**Action:** The DATABASE_URL is already set in docker-compose.dev.yml. Verify Prisma can connect:

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma db pull
```

**Expected:** Should complete without errors (even if no tables exist yet)

---

## 2.2 Create Complete Schema

### Task 2.2.1 - 2.2.10: Create Full Schema

**Action:** Replace contents of `backend/prisma/schema.prisma` with:

```prisma
// ============================================
// Prisma Schema for Car Rental Application
// ============================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  CUSTOMER
  ADMIN
}

enum CarType {
  SUV
  SEDAN
  HATCHBACK
  MPV
  VAN
}

enum Transmission {
  AT
  MT
}

enum FuelType {
  GAS
  DIESEL
  EV
}

enum CarStatus {
  ACTIVE
  INACTIVE
}

enum BookingStatus {
  PENDING
  CONFIRMED
  PICKED_UP
  RETURNED
  CANCELLED
}

// ============================================
// MODELS
// ============================================

/// User account for customers and admins
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String
  passwordHash String    @map("password_hash")
  role         UserRole  @default(CUSTOMER)

  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  bookings     Booking[]
  auditLogs    AuditLog[]

  @@map("users")
}

/// Car in the rental fleet
model Car {
  id           String       @id @default(uuid())
  brand        String       @db.VarChar(100)
  model        String       @db.VarChar(100)
  year         Int
  type         CarType
  seats        Int
  transmission Transmission
  fuel         FuelType
  dailyPrice   Decimal      @map("daily_price") @db.Decimal(10, 2)
  status       CarStatus    @default(ACTIVE)
  images       String[]

  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  // Relations
  bookings     Booking[]

  // Indexes for filtering
  @@index([type])
  @@index([status])
  @@index([dailyPrice])
  @@index([seats])
  @@index([transmission])
  @@index([fuel])
  @@map("cars")
}

/// Pickup/dropoff location
model Location {
  id        String   @id @default(uuid())
  name      String   @unique @db.VarChar(255)
  address   String?  @db.Text
  isActive  Boolean  @default(true) @map("is_active")

  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  bookingsPickup  Booking[] @relation("PickupLocation")
  bookingsDropoff Booking[] @relation("DropoffLocation")

  @@map("locations")
}

/// Optional service/product for bookings
model Addon {
  id              String         @id @default(uuid())
  name            String         @unique @db.VarChar(255)
  description     String?        @db.Text
  pricePerBooking Decimal        @map("price_per_booking") @db.Decimal(10, 2)
  isActive        Boolean        @default(true) @map("is_active")

  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // Relations
  bookingAddons   BookingAddon[]

  @@map("addons")
}

/// Car rental booking
model Booking {
  id                String        @id @default(uuid())
  userId            String        @map("user_id")
  carId             String        @map("car_id")
  pickupLocationId  String        @map("pickup_location_id")
  dropoffLocationId String        @map("dropoff_location_id")

  startDate         DateTime      @map("start_date") @db.Date
  endDate           DateTime      @map("end_date") @db.Date
  days              Int

  basePrice         Decimal       @map("base_price") @db.Decimal(12, 2)
  addonPrice        Decimal       @map("addon_price") @db.Decimal(12, 2) @default(0)
  totalPrice        Decimal       @map("total_price") @db.Decimal(12, 2)

  status            BookingStatus @default(PENDING)
  cancelReason      String?       @map("cancel_reason") @db.Text

  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  // Relations
  user              User          @relation(fields: [userId], references: [id])
  car               Car           @relation(fields: [carId], references: [id])
  pickupLocation    Location      @relation("PickupLocation", fields: [pickupLocationId], references: [id])
  dropoffLocation   Location      @relation("DropoffLocation", fields: [dropoffLocationId], references: [id])
  bookingAddons     BookingAddon[]

  // Indexes for queries
  @@index([userId])
  @@index([carId])
  @@index([status])
  @@index([startDate, endDate])
  @@index([carId, startDate, endDate]) // Critical for availability check
  @@index([createdAt])
  @@map("bookings")
}

/// Junction table for booking add-ons (with price snapshot)
model BookingAddon {
  id        String  @id @default(uuid())
  bookingId String  @map("booking_id")
  addonId   String  @map("addon_id")
  price     Decimal @db.Decimal(10, 2) // Snapshot of addon price at booking time

  // Relations
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  addon     Addon   @relation(fields: [addonId], references: [id])

  @@unique([bookingId, addonId])
  @@index([bookingId])
  @@map("booking_addons")
}

/// Audit log for tracking changes
model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?  @map("actor_id")
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   String   @map("entity_id")
  action     String   @db.VarChar(50)
  beforeJson Json?    @map("before_json")
  afterJson  Json?    @map("after_json")

  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  actor      User?    @relation(fields: [actorId], references: [id])

  @@index([entityType, entityId])
  @@index([actorId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 2.3 Run Migrations

### Task 2.3.1: Generate Migration

**Action:** Run inside container:

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name init
```

**Expected Output:**
```
Applying migration `20260119XXXXXX_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260119XXXXXX_init/
    └─ migration.sql

Your database is now in sync with your schema.
```

---

### Task 2.3.2: Verify Migration Files

**Action:** Check that migration was created:

```bash
ls -la backend/prisma/migrations/
```

**Expected:** Should see a timestamped folder with `migration.sql` inside

---

### Task 2.3.3: Generate Prisma Client

**Action:** Run (should happen automatically, but verify):

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

---

## 2.4 Create Seed Data

### Task 2.4.1 - 2.4.9: Create Comprehensive Seed Script

**Action:** Create `backend/prisma/seed.ts`

```typescript
import { PrismaClient, UserRole, CarType, Transmission, FuelType, CarStatus, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// Helper Functions
// ============================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// Seed Data
// ============================================

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================
  // 1. Create Users
  // ============================================
  console.log('👤 Creating users...');

  const adminPassword = await hashPassword('Admin123!');
  const customerPassword = await hashPassword('Customer123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@carrental.com' },
    update: {},
    create: {
      email: 'admin@carrental.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  const customerEmails = [
    { email: 'john.doe@example.com', name: 'John Doe' },
    { email: 'jane.smith@example.com', name: 'Jane Smith' },
    { email: 'bob.wilson@example.com', name: 'Bob Wilson' },
    { email: 'alice.johnson@example.com', name: 'Alice Johnson' },
    { email: 'charlie.brown@example.com', name: 'Charlie Brown' },
  ];

  const customers = [];
  for (const c of customerEmails) {
    const customer = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        passwordHash: customerPassword,
        role: UserRole.CUSTOMER,
      },
    });
    customers.push(customer);
    console.log(`  ✅ Customer: ${customer.email}`);
  }

  // ============================================
  // 2. Create Locations
  // ============================================
  console.log('\n📍 Creating locations...');

  const locationData = [
    { name: 'Yogyakarta Airport (YIA)', address: 'Jl. Wates KM 23, Kulon Progo, Yogyakarta' },
    { name: 'Yogyakarta City Center', address: 'Jl. Malioboro No. 52-58, Yogyakarta' },
    { name: 'Adisucipto Airport', address: 'Jl. Raya Solo KM 9, Sleman, Yogyakarta' },
    { name: 'UGM Campus', address: 'Bulaksumur, Caturtunggal, Sleman, Yogyakarta' },
    { name: 'Prambanan Temple Area', address: 'Jl. Raya Solo - Yogyakarta KM 16, Sleman' },
  ];

  const locations = [];
  for (const loc of locationData) {
    const location = await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
    locations.push(location);
    console.log(`  ✅ Location: ${location.name}`);
  }

  // ============================================
  // 3. Create Addons
  // ============================================
  console.log('\n🎁 Creating addons...');

  const addonData = [
    { name: 'GPS Navigation', description: 'Garmin GPS device with Indonesia maps and traffic updates', pricePerBooking: 50000 },
    { name: 'Child Safety Seat', description: 'Certified child safety seat for ages 1-4 years', pricePerBooking: 35000 },
    { name: 'Extra Insurance', description: 'Comprehensive coverage including collision damage waiver', pricePerBooking: 100000 },
  ];

  const addons = [];
  for (const addon of addonData) {
    const created = await prisma.addon.upsert({
      where: { name: addon.name },
      update: {},
      create: addon,
    });
    addons.push(created);
    console.log(`  ✅ Addon: ${created.name} - Rp ${created.pricePerBooking.toLocaleString()}`);
  }

  // ============================================
  // 4. Create Cars (20 cars - 4 per type)
  // ============================================
  console.log('\n🚗 Creating cars...');

  const carData = [
    // SUVs (4)
    { brand: 'Toyota', model: 'Fortuner', year: 2023, type: CarType.SUV, seats: 7, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 650000, images: ['https://images.unsplash.com/photo-1625231334168-31f04a202a62'] },
    { brand: 'Honda', model: 'CR-V', year: 2024, type: CarType.SUV, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 550000, images: ['https://images.unsplash.com/photo-1568844293986-8c8a3fd45454'] },
    { brand: 'Mitsubishi', model: 'Pajero Sport', year: 2023, type: CarType.SUV, seats: 7, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 700000, images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b'] },
    { brand: 'Hyundai', model: 'Creta', year: 2024, type: CarType.SUV, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 450000, images: ['https://images.unsplash.com/photo-1606611013016-969c19ba27a5'] },

    // SEDANs (4)
    { brand: 'Toyota', model: 'Camry', year: 2024, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 600000, images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb'] },
    { brand: 'Honda', model: 'Accord', year: 2023, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 550000, images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888'] },
    { brand: 'Honda', model: 'City', year: 2024, type: CarType.SEDAN, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 350000, images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588'] },
    { brand: 'Toyota', model: 'Vios', year: 2023, type: CarType.SEDAN, seats: 5, transmission: Transmission.MT, fuel: FuelType.GAS, dailyPrice: 300000, images: ['https://images.unsplash.com/photo-1550355291-bbee04a92027'] },

    // HATCHBACKs (4)
    { brand: 'Toyota', model: 'Yaris', year: 2024, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 300000, images: ['https://images.unsplash.com/photo-1609521263047-f8f205293f24'] },
    { brand: 'Honda', model: 'Brio', year: 2024, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.MT, fuel: FuelType.GAS, dailyPrice: 250000, images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d'] },
    { brand: 'Suzuki', model: 'Swift', year: 2023, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 280000, images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8'] },
    { brand: 'Mazda', model: '2 Hatchback', year: 2024, type: CarType.HATCHBACK, seats: 5, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 320000, images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70'] },

    // MPVs (4)
    { brand: 'Toyota', model: 'Avanza', year: 2024, type: CarType.MPV, seats: 7, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 350000, images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2'] },
    { brand: 'Toyota', model: 'Innova Zenix', year: 2024, type: CarType.MPV, seats: 7, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 550000, images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'] },
    { brand: 'Mitsubishi', model: 'Xpander', year: 2024, type: CarType.MPV, seats: 7, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 380000, images: ['https://images.unsplash.com/photo-1502877338535-766e1452684a'] },
    { brand: 'Honda', model: 'Mobilio', year: 2023, type: CarType.MPV, seats: 7, transmission: Transmission.AT, fuel: FuelType.GAS, dailyPrice: 320000, images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c'] },

    // VANs (4)
    { brand: 'Toyota', model: 'HiAce Commuter', year: 2023, type: CarType.VAN, seats: 15, transmission: Transmission.MT, fuel: FuelType.DIESEL, dailyPrice: 800000, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64'] },
    { brand: 'Mercedes', model: 'Sprinter', year: 2024, type: CarType.VAN, seats: 12, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 1200000, images: ['https://images.unsplash.com/photo-1570125909232-eb263c188f7e'] },
    { brand: 'Hyundai', model: 'Starex', year: 2023, type: CarType.VAN, seats: 11, transmission: Transmission.AT, fuel: FuelType.DIESEL, dailyPrice: 750000, images: ['https://images.unsplash.com/photo-1559416523-140ddc3d238c'] },
    { brand: 'Isuzu', model: 'Elf Microbus', year: 2023, type: CarType.VAN, seats: 16, transmission: Transmission.MT, fuel: FuelType.DIESEL, dailyPrice: 900000, images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957'] },
  ];

  const cars = [];
  for (const car of carData) {
    const created = await prisma.car.create({
      data: car,
    });
    cars.push(created);
    console.log(`  ✅ Car: ${created.brand} ${created.model} - Rp ${Number(created.dailyPrice).toLocaleString()}/day`);
  }

  // ============================================
  // 5. Create Historical Bookings (40 bookings)
  // ============================================
  console.log('\n📅 Creating historical bookings...');

  const statusDistribution = [
    ...Array(15).fill(BookingStatus.RETURNED),    // 15 completed
    ...Array(10).fill(BookingStatus.CONFIRMED),   // 10 confirmed (upcoming)
    ...Array(5).fill(BookingStatus.PENDING),      // 5 pending
    ...Array(8).fill(BookingStatus.CANCELLED),    // 8 cancelled
    ...Array(2).fill(BookingStatus.PICKED_UP),    // 2 currently active
  ];

  const today = new Date();
  const thirtyDaysAgo = addDays(today, -30);
  const thirtyDaysFromNow = addDays(today, 30);

  let bookingCount = 0;
  const statusCounts: Record<string, number> = {};

  for (const status of statusDistribution) {
    const customer = randomElement(customers);
    const car = randomElement(cars);
    const pickupLocation = randomElement(locations);
    const dropoffLocation = randomElement(locations);

    let startDate: Date;
    let endDate: Date;

    // Set dates based on status
    switch (status) {
      case BookingStatus.RETURNED:
        startDate = randomDate(thirtyDaysAgo, addDays(today, -7));
        endDate = addDays(startDate, Math.floor(Math.random() * 5) + 1);
        break;
      case BookingStatus.PICKED_UP:
        startDate = addDays(today, -Math.floor(Math.random() * 3) - 1);
        endDate = addDays(today, Math.floor(Math.random() * 3) + 1);
        break;
      case BookingStatus.CONFIRMED:
        startDate = addDays(today, Math.floor(Math.random() * 14) + 1);
        endDate = addDays(startDate, Math.floor(Math.random() * 5) + 1);
        break;
      case BookingStatus.PENDING:
        startDate = addDays(today, Math.floor(Math.random() * 7) + 1);
        endDate = addDays(startDate, Math.floor(Math.random() * 5) + 1);
        break;
      case BookingStatus.CANCELLED:
        startDate = randomDate(thirtyDaysAgo, thirtyDaysFromNow);
        endDate = addDays(startDate, Math.floor(Math.random() * 5) + 1);
        break;
      default:
        startDate = addDays(today, 1);
        endDate = addDays(startDate, 3);
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = Number(car.dailyPrice) * days;

    const selectedAddons = addons
      .filter(() => Math.random() > 0.6)
      .slice(0, 2);

    const addonPrice = selectedAddons.reduce((sum, a) => sum + Number(a.pricePerBooking), 0);
    const totalPrice = basePrice + addonPrice;

    await prisma.booking.create({
      data: {
        userId: customer.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
        startDate,
        endDate,
        days,
        basePrice,
        addonPrice,
        totalPrice,
        status,
        cancelReason: status === BookingStatus.CANCELLED
          ? randomElement(['Plans changed', 'Found better deal', 'Trip cancelled', 'Emergency'])
          : null,
        bookingAddons: {
          create: selectedAddons.map(addon => ({
            addonId: addon.id,
            price: addon.pricePerBooking,
          })),
        },
      },
    });

    statusCounts[status] = (statusCounts[status] || 0) + 1;
    bookingCount++;
  }

  console.log(`  ✅ Created ${bookingCount} bookings:`);
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`     - ${status}: ${count}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Database seeding completed successfully!');
  console.log('='.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`   - Users: ${customers.length + 1} (1 admin + ${customers.length} customers)`);
  console.log(`   - Locations: ${locations.length}`);
  console.log(`   - Addons: ${addons.length}`);
  console.log(`   - Cars: ${cars.length}`);
  console.log(`   - Bookings: ${bookingCount}`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Admin: admin@carrental.com / Admin123!`);
  console.log(`   Customer: john.doe@example.com / Customer123!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

### Task 2.4.9: Configure Seed Script in package.json

**Action:** Update `backend/package.json` to add prisma seed configuration:

```json
{
  "name": "car-rental-backend",
  "version": "1.0.0",
  "description": "Data-Driven Car Rental Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "keywords": ["car-rental", "api", "express", "prisma"],
  "author": "",
  "license": "ISC"
}
```

---

## 2.5 Verify Phase 2

### Task 2.5.1: Run Seed

**Action:** Run inside container:

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

**Expected Output:**
```
🌱 Starting database seed...

👤 Creating users...
  ✅ Admin: admin@carrental.com
  ...

📍 Creating locations...
  ✅ Location: Yogyakarta Airport (YIA)
  ...

🚗 Creating cars...
  ✅ Car: Toyota Fortuner - Rp 650,000/day
  ...

📅 Creating historical bookings...
  ✅ Created 40 bookings

==================================================
🎉 Database seeding completed successfully!
==================================================

🔑 Login credentials:
   Admin: admin@carrental.com / Admin123!
   Customer: john.doe@example.com / Customer123!
```

---

### Task 2.5.2: Open Prisma Studio

**Action:** Run:

```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
```

**Then open:** http://localhost:5555

**Verify:**

- [ ] Users table has 6 records
- [ ] Cars table has 20 records
- [ ] Locations table has 5 records
- [ ] Addons table has 3 records
- [ ] Bookings table has 40 records

---

## Phase 2 Completion Checklist

- [x] 2.1.1 Verified Prisma is installed
- [x] 2.1.2 Initialized Prisma
- [x] 2.1.3 Verified DATABASE_URL connection
- [x] 2.2.1-10 Created complete schema
- [x] 2.3.1 Generated migration
- [x] 2.3.2 Verified migration files exist
- [x] 2.3.3 Generated Prisma client
- [x] 2.4.1-9 Created comprehensive seed script
- [x] 2.5.1 Seed runs successfully
- [x] 2.5.2 Prisma Studio shows all data

## Phase 2 Deliverables

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       └── 20260119XXXXXX_init/
│           └── migration.sql
```

## Resume Point (Phase 2)

```bash
docker-compose -f docker-compose.dev.yml up
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
```

---

# PHASE 3: Core Infrastructure

## Goal: Clean architecture foundation with shared utilities

**Duration:** 2-3 hours
**Prerequisites:** Phase 2 completed

---

## 3.1 Create Directory Structure

### Task 3.1.1: Create All Directories

**Action:** Run from project root:

```bash
mkdir -p backend/src/{domain/{entities,repositories,errors},application/{use-cases,dtos,services},infrastructure/{database,repositories,auth,logger},presentation/{routes,controllers,middlewares,validators},shared/{types,utils,constants}}
```

**Expected Structure:**

```
backend/src/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── errors/
├── application/
│   ├── use-cases/
│   ├── dtos/
│   └── services/
├── infrastructure/
│   ├── database/
│   ├── repositories/
│   ├── auth/
│   └── logger/
├── presentation/
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   └── validators/
├── shared/
│   ├── types/
│   ├── utils/
│   └── constants/
├── app.ts
└── server.ts
```

---

## 3.2 Create Domain Layer

### Task 3.2.1: Create Domain Entities

**Action:** Create `backend/src/domain/entities/index.ts`

```typescript
import {
  User as PrismaUser,
  Car as PrismaCar,
  Location as PrismaLocation,
  Addon as PrismaAddon,
  Booking as PrismaBooking,
  BookingAddon as PrismaBookingAddon,
  AuditLog as PrismaAuditLog,
  UserRole,
  CarType,
  Transmission,
  FuelType,
  CarStatus,
  BookingStatus,
} from '@prisma/client';

// Re-export enums
export { UserRole, CarType, Transmission, FuelType, CarStatus, BookingStatus };

// Entity types
export type User = PrismaUser;
export type Car = PrismaCar;
export type Location = PrismaLocation;
export type Addon = PrismaAddon;
export type Booking = PrismaBooking;
export type BookingAddon = PrismaBookingAddon;
export type AuditLog = PrismaAuditLog;

// Booking with relations
export interface BookingWithRelations extends Booking {
  user?: User;
  car?: Car;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  bookingAddons?: (BookingAddon & { addon?: Addon })[];
}

// Car with availability flag
export interface CarWithAvailability extends Car {
  isAvailable?: boolean;
}

// User without password
export type UserWithoutPassword = Omit<User, 'passwordHash'>;
```

---

### Task 3.2.2: Create Repository Interfaces

**Action:** Create `backend/src/domain/repositories/index.ts`

```typescript
import {
  User,
  Car,
  Location,
  Addon,
  Booking,
  BookingWithRelations,
  CarWithAvailability,
  UserRole,
  CarStatus,
  BookingStatus,
} from '../entities/index.js';

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// User Repository
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// Car Repository
export interface CarFilters {
  type?: string;
  seats?: number;
  transmission?: string;
  fuel?: string;
  priceMin?: number;
  priceMax?: number;
  status?: CarStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface CarSortOptions {
  field: 'dailyPrice' | 'createdAt' | 'seats' | 'year';
  order: 'asc' | 'desc';
}

export interface ICarRepository {
  findAll(
    filters: CarFilters,
    pagination: PaginationParams,
    sort?: CarSortOptions
  ): Promise<PaginatedResult<CarWithAvailability>>;
  findById(id: string): Promise<Car | null>;
  create(data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car>;
  update(id: string, data: Partial<Car>): Promise<Car>;
  updateStatus(id: string, status: CarStatus): Promise<Car>;
  checkAvailability(carId: string, startDate: Date, endDate: Date, excludeBookingId?: string): Promise<boolean>;
  hasActiveBookings(carId: string): Promise<boolean>;
}

// Location Repository
export interface ILocationRepository {
  findAll(activeOnly?: boolean): Promise<Location[]>;
  findById(id: string): Promise<Location | null>;
  create(data: { name: string; address?: string }): Promise<Location>;
}

// Addon Repository
export interface IAddonRepository {
  findAll(activeOnly?: boolean): Promise<Addon[]>;
  findById(id: string): Promise<Addon | null>;
  findByIds(ids: string[]): Promise<Addon[]>;
  create(data: { name: string; description?: string; pricePerBooking: number }): Promise<Addon>;
}

// Booking Repository
export interface BookingFilters {
  userId?: string;
  carId?: string;
  status?: BookingStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
}

export interface BookingSortOptions {
  field: 'createdAt' | 'startDate' | 'totalPrice';
  order: 'asc' | 'desc';
}

export interface CreateBookingData {
  userId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  startDate: Date;
  endDate: Date;
  days: number;
  basePrice: number;
  addonPrice: number;
  totalPrice: number;
  addonIds: string[];
  addonPrices: Map<string, number>;
}

export interface IBookingRepository {
  findById(id: string, includeRelations?: boolean): Promise<BookingWithRelations | null>;
  findByUserId(
    userId: string,
    filters: Omit<BookingFilters, 'userId'>,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>>;
  findAll(
    filters: BookingFilters,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>>;
  create(data: CreateBookingData): Promise<BookingWithRelations>;
  updateStatus(id: string, status: BookingStatus, cancelReason?: string): Promise<Booking>;
  checkOverlap(carId: string, startDate: Date, endDate: Date, excludeBookingId?: string): Promise<boolean>;
}

// Audit Log Repository
export interface IAuditLogRepository {
  create(data: {
    actorId?: string;
    entityType: string;
    entityId: string;
    action: string;
    beforeJson?: object;
    afterJson?: object;
  }): Promise<void>;
}
```

---

### Task 3.2.3: Create AppError

**Action:** Create `backend/src/domain/errors/AppError.ts`

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

---

### Task 3.2.4: Create NotFoundError

**Action:** Create `backend/src/domain/errors/NotFoundError.ts`

```typescript
import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string, details?: Record<string, unknown>) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`, true, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
```

---

### Task 3.2.5: Create ValidationError

**Action:** Create `backend/src/domain/errors/ValidationError.ts`

```typescript
import { AppError } from './AppError.js';

export interface ValidationFieldError {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  public readonly fields?: ValidationFieldError[];

  constructor(message: string = 'Validation failed', fields?: ValidationFieldError[], details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, {
      ...details,
      fields: fields?.reduce((acc, f) => {
        acc[f.field] = acc[f.field] || [];
        acc[f.field].push(f.message);
        return acc;
      }, {} as Record<string, string[]>),
    });
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

---

### Task 3.2.6: Create UnauthorizedError

**Action:** Create `backend/src/domain/errors/UnauthorizedError.ts`

```typescript
import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', code: string = 'UNAUTHORIZED', details?: Record<string, unknown>) {
    super(message, 401, code, true, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
```

---

### Task 3.2.7: Create ForbiddenError

**Action:** Create `backend/src/domain/errors/ForbiddenError.ts`

```typescript
import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', true, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
```

---

### Task 3.2.8: Create ConflictError

**Action:** Create `backend/src/domain/errors/ConflictError.ts`

```typescript
import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT', details?: Record<string, unknown>) {
    super(message, 409, code, true, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
```

---

### Task 3.2.9: Create Error Index

**Action:** Create `backend/src/domain/errors/index.ts`

```typescript
export { AppError } from './AppError.js';
export { NotFoundError } from './NotFoundError.js';
export { ValidationError, ValidationFieldError } from './ValidationError.js';
export { UnauthorizedError } from './UnauthorizedError.js';
export { ForbiddenError } from './ForbiddenError.js';
export { ConflictError } from './ConflictError.js';
```

---

## 3.3 Create Infrastructure Layer

### Task 3.3.1: Create Prisma Client Singleton

**Action:** Create `backend/src/infrastructure/database/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

---

### Task 3.3.2: Create Logger Utility

**Action:** Create `backend/src/infrastructure/logger/index.ts`

```typescript
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = winston.createLogger({
  level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'car-rental-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
```

---

## 3.4 Create Shared Utilities

### Task 3.4.1: Create Response Helper

**Action:** Create `backend/src/shared/utils/response.ts`

```typescript
import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta?: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: ApiResponse['meta']): Response {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, statusCode: number, code: string, message: string, details?: Record<string, unknown>): Response {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
}

export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
```

---

### Task 3.4.2: Create Pagination Helper

**Action:** Create `backend/src/shared/utils/pagination.ts`

```typescript
export interface PaginationInput {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(input: PaginationInput): PaginationConfig {
  let page = typeof input.page === 'string' ? parseInt(input.page, 10) : input.page;
  let limit = typeof input.limit === 'string' ? parseInt(input.limit, 10) : input.limit;
  page = page && page > 0 ? page : DEFAULT_PAGE;
  limit = limit && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
}
```

---

### Task 3.4.3: Create Date Utilities

**Action:** Create `backend/src/shared/utils/date.ts`

```typescript
export function calculateDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

export function isFutureOrToday(date: Date): boolean {
  return !isPastDate(date);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

---

### Task 3.4.4: Create Constants

**Action:** Create `backend/src/shared/constants/index.ts`

```typescript
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
};

export const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'PICKED_UP'] as const;

export const USER_ROLES = { ADMIN: 'ADMIN', CUSTOMER: 'CUSTOMER' } as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CAR_NOT_AVAILABLE: 'CAR_NOT_AVAILABLE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  CANCELLATION_NOT_ALLOWED: 'CANCELLATION_NOT_ALLOWED',
} as const;
```

---

### Task 3.4.5: Create Shared Types

**Action:** Create `backend/src/shared/types/index.ts`

```typescript
import { Request } from 'express';
import { UserRole } from '../../domain/entities/index.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
```

---

## 3.5 Create Presentation Layer Base

### Task 3.5.1: Create Error Handler

**Action:** Create `backend/src/presentation/middlewares/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/index.js';
import logger from '../../infrastructure/logger/index.js';
import { sendError } from '../../shared/utils/response.js';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response {
  logger.error('Error occurred', { error: err.message, stack: err.stack, path: req.path, method: req.method });

  if (err instanceof ZodError) {
    const details = {
      fields: err.errors.reduce((acc, e) => {
        const field = e.path.join('.');
        acc[field] = acc[field] || [];
        acc[field].push(e.message);
        return acc;
      }, {} as Record<string, string[]>),
    };
    return sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired');
  }

  const message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
}
```

---

### Task 3.5.2: Create Async Handler

**Action:** Create `backend/src/presentation/middlewares/asyncHandler.ts`

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
```

---

### Task 3.5.3: Create Validation Middleware

**Action:** Create `backend/src/presentation/middlewares/validateRequest.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../../shared/utils/response.js';

interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = await schema.body.parseAsync(req.body);
      if (schema.query) req.query = await schema.query.parseAsync(req.query);
      if (schema.params) req.params = await schema.params.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = {
          fields: error.errors.reduce((acc, e) => {
            const field = e.path.join('.');
            acc[field] = acc[field] || [];
            acc[field].push(e.message);
            return acc;
          }, {} as Record<string, string[]>),
        };
        return sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
      }
      next(error);
    }
  };
}

export const validateBody = (schema: AnyZodObject) => validateRequest({ body: schema });
export const validateQuery = (schema: AnyZodObject) => validateRequest({ query: schema });
export const validateParams = (schema: AnyZodObject) => validateRequest({ params: schema });
```

---

### Task 3.5.4: Create Middleware Index

**Action:** Create `backend/src/presentation/middlewares/index.ts`

```typescript
export { errorHandler } from './errorHandler.js';
export { asyncHandler } from './asyncHandler.js';
export { validateRequest, validateBody, validateQuery, validateParams } from './validateRequest.js';
```

---

### Task 3.5.5: Create Base Routes

**Action:** Create `backend/src/presentation/routes/index.ts`

```typescript
import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Routes will be added in Phase 4+
// router.use('/auth', authRoutes);
// router.use('/cars', carRoutes);
// router.use('/bookings', bookingRoutes);

export default router;
```

---

### Task 3.5.6: Update app.ts

**Action:** Update `backend/src/app.ts` to use new infrastructure:

```typescript
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import logger from './infrastructure/logger/index.js';
import { prisma } from './infrastructure/database/prisma.js';
import { errorHandler } from './presentation/middlewares/index.js';
import apiRoutes from './presentation/routes/index.js';

dotenv.config();

const app: Express = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    logger.error('Database health check failed', { error });
  }

  res.status(200).json({
    success: true,
    data: {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: { status: dbStatus },
    },
  });
});

app.use('/api', apiRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use(errorHandler);

export default app;
```

---

## 3.6 Verify Phase 3

### Task 3.6.1: Restart and Verify

**Action:**

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

**Verify:** No TypeScript errors in logs

---

### Task 3.6.2: Test Health with DB Check

**Action:**

```bash
curl http://localhost:3000/health
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": { "status": "connected" }
  }
}
```

---

## Phase 3 Completion Checklist

- [x] 3.1.1 Created directory structure
- [x] 3.2.1-9 Created domain layer (entities, repositories, errors)
- [x] 3.3.1-2 Created infrastructure (Prisma, Logger)
- [x] 3.4.1-5 Created shared utilities
- [x] 3.5.1-6 Created presentation layer base
- [x] 3.6.1-2 Verified compilation and health endpoint

## Phase 3 Deliverables

```
backend/src/
├── domain/
│   ├── entities/index.ts
│   ├── repositories/index.ts
│   └── errors/*.ts
├── infrastructure/
│   ├── database/prisma.ts
│   └── logger/index.ts
├── presentation/
│   ├── middlewares/*.ts
│   └── routes/index.ts
├── shared/
│   ├── utils/*.ts
│   ├── types/index.ts
│   └── constants/index.ts
└── app.ts (updated)
```

## Resume Point (Phase 3)

```bash
docker-compose -f docker-compose.dev.yml up
curl http://localhost:3000/health
# Should show database: connected
```

---

## Foundation Complete!

After completing Phases 1-3, you have:

- ✅ Docker environment with PostgreSQL
- ✅ Complete database schema with 7 tables
- ✅ 40+ seed data records for testing
- ✅ Clean architecture folder structure
- ✅ Error handling system
- ✅ Logging infrastructure
- ✅ Utility functions

**Next:** Continue with [05b-implementation-plan-features.md](./05b-implementation-plan-features.md) for Phases 4-8 (Authentication, Cars, Bookings, Admin, Analytics)

---

**Document Status:** ✅ Ready for Implementation
