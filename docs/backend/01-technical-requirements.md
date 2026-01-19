# Technical Requirements Document (TRD)
## Data-Driven Car Rental - Backend System

**Version:** 1.0
**Date:** 2026-01-19
**Project Duration:** 1 Week MVP

---

## 1. Technology Stack

### 1.1 Core Technologies
| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Runtime | Node.js | 20.x LTS | Stable, long-term support, excellent ecosystem |
| Language | TypeScript | 5.x | Type safety, better DX, industry standard |
| Framework | Express.js | 4.x | Minimal, flexible, well-documented, fast setup |
| Database | PostgreSQL | 16.x | ACID compliant, excellent for relational data, JSON support |
| ORM | Prisma | 5.x | Type-safe queries, excellent migrations, great DX |
| Authentication | JWT | - | Stateless, scalable, works well with SPA frontend |
| Containerization | Docker | 24.x | Consistent environments, easy deployment |
| API Documentation | Swagger UI | 5.x | Interactive docs, OpenAPI 3.0 standard |

### 1.2 Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "nodemon": "^3.0.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  }
}
```

---

## 2. Architecture Pattern

### 2.1 Clean Architecture (Layered)
We'll implement a **4-layer clean architecture** to ensure:
- Separation of concerns
- Testability
- Maintainability
- Business logic independence from frameworks

```
src/
├── domain/              # Business entities & interfaces (innermost)
│   ├── entities/        # Core business models
│   ├── repositories/    # Repository interfaces (contracts)
│   └── errors/          # Domain-specific errors
│
├── application/         # Use cases & business logic
│   ├── use-cases/       # Business operations
│   ├── dtos/            # Data Transfer Objects
│   └── services/        # Application services
│
├── infrastructure/      # External concerns (frameworks, DB, etc.)
│   ├── database/        # Prisma client, migrations
│   ├── repositories/    # Repository implementations
│   ├── auth/            # JWT implementation
│   └── logger/          # Winston logger setup
│
├── presentation/        # HTTP/API layer (outermost)
│   ├── routes/          # Express routes
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── validators/      # Zod schemas for validation
│   └── swagger/         # API documentation
│
├── shared/              # Cross-cutting concerns
│   ├── types/           # Shared TypeScript types
│   ├── utils/           # Utility functions
│   └── constants/       # App-wide constants
│
└── server.ts            # Application entry point
```

### 2.2 Dependency Flow
```
Presentation → Application → Domain
       ↓            ↓
Infrastructure (implements interfaces from Domain)
```

**Key Principles:**
- **Domain layer** has NO dependencies (pure business logic)
- **Application layer** depends only on Domain
- **Infrastructure** implements Domain interfaces
- **Presentation** orchestrates and depends on Application

---

## 3. Database Strategy

### 3.1 PostgreSQL Configuration
- **Connection Pool:** Max 20 connections
- **SSL Mode:** Required in production, disabled in dev
- **Timezone:** UTC (all timestamps stored in UTC)
- **Migrations:** Prisma Migrate (declarative schema)

### 3.2 Schema Management
- **ORM:** Prisma (schema-first approach)
- **Migrations:** Versioned SQL migrations via Prisma
- **Seeding:** TypeScript seed scripts (`prisma/seed.ts`)
- **Soft Deletes:** Use `status: INACTIVE` or `deletedAt` timestamp

### 3.3 Data Integrity
- **Foreign Keys:** Enforced at DB level
- **Unique Constraints:** Email (users), composite keys where needed
- **Check Constraints:**
  - `startDate < endDate` for bookings
  - `days >= 1`
  - `price > 0`
- **Indexes:**
  - B-tree on frequently queried fields (userId, carId, status, dates)
  - Composite index on `(carId, startDate, endDate)` for availability checks

---

## 4. Authentication & Authorization

### 4.1 JWT Strategy
```typescript
{
  "accessToken": {
    "payload": { "userId", "email", "role" },
    "expiresIn": "15m",
    "algorithm": "HS256"
  }
}
```

### 4.2 Password Security
- **Hashing:** bcrypt with salt rounds = 10
- **Storage:** Never store plaintext passwords
- **Validation:** Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number

### 4.3 Role-Based Access Control (RBAC)
| Role | Access |
|------|--------|
| `CUSTOMER` | Own bookings, car browsing |
| `ADMIN` | All resources, analytics, fleet management |

**Middleware:** `requireAuth`, `requireRole(['ADMIN'])`

---

## 5. Validation Strategy

### 5.1 Input Validation (Zod)
- **Request body:** Validate using Zod schemas in middleware
- **Query params:** Validate pagination, filters, sort
- **Path params:** Validate UUID format for IDs

### 5.2 Business Rule Validation
- **Availability check:** Before booking creation
- **Cancel policy:** Only before `startDate`
- **Booking overlap:** Transaction-level check with DB lock

---

## 6. Error Handling Strategy

### 6.1 Error Types
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Custom errors
class NotFoundError extends AppError          // 404
class ValidationError extends AppError        // 400
class UnauthorizedError extends AppError      // 401
class ForbiddenError extends AppError         // 403
class ConflictError extends AppError          // 409
```

### 6.2 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "CAR_NOT_AVAILABLE",
    "message": "Car is already booked for selected dates",
    "details": {
      "carId": "uuid",
      "conflictingBooking": "uuid"
    }
  }
}
```

### 6.3 Global Error Handler
- Catch all errors in Express middleware
- Log errors with Winston
- Return sanitized error responses (hide stack traces in production)

---

## 7. Logging & Monitoring

### 7.1 Logging (Winston)
```typescript
{
  "levels": {
    "error": 0,    // System errors, unhandled exceptions
    "warn": 1,     // Business rule violations, deprecated usage
    "info": 2,     // Booking created, status updated
    "http": 3,     // HTTP requests (Morgan)
    "debug": 4     // Development only
  },
  "transports": [
    "console",              // Dev
    "file (error.log)",     // Production errors
    "file (combined.log)"   // Production all logs
  ]
}
```

### 7.2 Request Logging (Morgan)
- **Dev:** `:method :url :status :response-time ms`
- **Production:** Combined format with timestamps

### 7.3 Audit Log
- Log critical actions in `AuditLog` table:
  - Booking status changes
  - Car price updates
  - Admin actions
- Include: `actorUserId`, `action`, `entityType`, `entityId`, `beforeJson`, `afterJson`

---

## 8. Security Requirements

### 8.1 HTTP Security (Helmet.js)
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### 8.2 Rate Limiting (express-rate-limit)
```typescript
{
  "/api/auth/login": "5 requests per 15 minutes per IP",
  "/api/auth/register": "3 requests per 15 minutes per IP",
  "/api/*": "100 requests per 15 minutes per IP"
}
```

### 8.3 CORS Policy
- **Allowed Origins:** Frontend URL (env variable)
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **Credentials:** true

### 8.4 Input Sanitization
- Zod validation strips unknown fields
- No SQL injection (Prisma parameterized queries)
- XSS prevention (Helmet CSP)

---

## 9. API Design Principles

### 9.1 REST Conventions
- **Resource naming:** Plural nouns (`/cars`, `/bookings`)
- **HTTP methods:** GET (read), POST (create), PUT (full update), PATCH (partial), DELETE
- **Status codes:**
  - 200 OK
  - 201 Created
  - 204 No Content
  - 400 Bad Request
  - 401 Unauthorized
  - 403 Forbidden
  - 404 Not Found
  - 409 Conflict
  - 500 Internal Server Error

### 9.2 Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 9.3 Pagination
- **Query params:** `?page=1&limit=20`
- **Default:** page=1, limit=20
- **Max limit:** 100

### 9.4 Filtering & Sorting
- **Filters:** `?type=SUV&seats=5&priceMin=100&priceMax=500`
- **Sort:** `?sort=price&order=asc`
- **Date range:** `?startDate=2026-01-20&endDate=2026-01-25`

---

## 10. Performance Requirements

### 10.1 Response Time Targets
| Endpoint Type | Target | Max |
|---------------|--------|-----|
| GET list (paginated) | < 200ms | 500ms |
| GET single resource | < 100ms | 300ms |
| POST/PUT/PATCH | < 300ms | 1s |
| Analytics queries | < 500ms | 2s |

### 10.2 Optimization Strategies
- **Database:**
  - Proper indexes on filtered/sorted columns
  - Use `SELECT` only needed fields (Prisma select)
  - Pagination server-side
  - Connection pooling
- **Queries:**
  - Avoid N+1 queries (use Prisma `include` wisely)
  - Batch related data fetching
- **Caching (Stretch):**
  - Redis for car list, locations, addons (rarely change)

---

## 11. Testing Strategy (Stretch Goal)

### 11.1 Test Pyramid
```
E2E Tests (few)           → Supertest (API integration tests)
Integration Tests (some)  → Test use cases with real DB (test container)
Unit Tests (many)         → Test business logic, pure functions
```

### 11.2 Tools
- **Test Runner:** Jest or Vitest
- **API Testing:** Supertest
- **DB Testing:** Prisma with SQLite or test PostgreSQL container
- **Coverage Target:** 70%+ (MVP: optional)

---

## 12. Environment Configuration

### 12.1 Environment Variables
```bash
# App
NODE_ENV=development|production
PORT=3000
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/car_rental

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### 12.2 Environments
- **Development:** Local, hot-reload, verbose logging
- **Production:** Docker, minified, error logs only, rate limiting strict

---

## 13. Docker Strategy

### 13.1 Containers
```yaml
services:
  backend:
    - Express.js app
    - Port: 3000
    - Depends on: db

  db:
    - PostgreSQL 16
    - Port: 5432
    - Volume: postgres_data

  frontend:
    - React/Next.js (future)
    - Port: 80
    - Nginx reverse proxy
```

### 13.2 Multi-Stage Build (Backend)
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
# Install dependencies, build TypeScript

# Stage 2: Production
FROM node:20-alpine
# Copy only built files + node_modules
# Run as non-root user
```

### 13.3 Docker Compose
- **Development:** Hot-reload, mount volumes
- **Production:** Optimized images, health checks

---

## 14. Development Workflow

### 14.1 Git Workflow
- **Main branch:** production-ready
- **Develop branch:** integration
- **Feature branches:** `feature/booking-creation`
- **Commit convention:** Conventional Commits

### 14.2 Development Scripts
```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "tsx prisma/seed.ts",
  "prisma:studio": "prisma studio",
  "docker:dev": "docker-compose up",
  "docker:build": "docker-compose build"
}
```

---

## 15. Deployment Considerations

### 15.1 Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seed data loaded (optional)
- [ ] SSL/TLS enabled
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] Logging to file/service
- [ ] Health check endpoint (`/health`)
- [ ] Graceful shutdown handling
- [ ] Docker images optimized

### 15.2 Health Check Endpoint
```
GET /health
Response:
{
  "status": "healthy",
  "database": "connected",
  "uptime": 123456
}
```

---

## 16. Success Metrics

### 16.1 Technical KPIs
- **API Response Time:** 95th percentile < 500ms
- **Database Query Time:** Avg < 50ms
- **Error Rate:** < 1% of requests
- **Uptime:** 99%+ (production)

### 16.2 Code Quality
- **TypeScript:** No `any` types in production code
- **ESLint:** Zero errors
- **Prettier:** Auto-formatted
- **Dependencies:** No critical vulnerabilities (npm audit)

---

## 17. Out of Scope (MVP)

### 17.1 Not Included in Week 1
- Real payment gateway integration
- Email notifications (SMTP)
- SMS notifications
- Real-time WebSocket updates
- Multi-language i18n
- Advanced caching (Redis)
- Full E2E test suite
- CI/CD pipeline setup
- Cloud deployment (AWS/GCP)
- CDN for static assets
- Database read replicas
- Horizontal scaling setup

### 17.2 Possible Week 2+ Additions
- Refresh token rotation
- OAuth (Google, Facebook login)
- File upload for car images (S3)
- PDF invoice generation
- Advanced analytics (charts library)
- Elasticsearch for search
- GraphQL API alternative

---

## 18. Team & Responsibilities

### 18.1 Roles (Single Developer - Week 1)
- **Backend Development:** Full-stack focus on API + DB
- **DevOps:** Docker setup, local environment
- **QA:** Manual testing of critical flows

### 18.2 Handoff to Frontend
- API documentation (Swagger UI live)
- Postman collection export
- Sample curl requests
- Seeded data for testing

---

## 19. References

### 19.1 Documentation Links
- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 19.2 Related Documents
- [BRD](../brd.md)
- [Database Schema](./02-database-schema.md)
- [API Specification](./03-api-specification.md)
- [Docker Setup Guide](./04-docker-setup.md)

---

**Document Status:** ✅ Approved for Implementation
**Next Steps:** Review Database Schema Design → API Specification → Start Development
