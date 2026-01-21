# 🚗 Data-Driven Car Rental Management System

A production-ready, full-stack car rental management platform built with modern technologies and clean architecture principles. This system provides comprehensive fleet management, real-time booking capabilities, and advanced analytics for car rental businesses.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Documentation](#-documentation)
- [License](#-license)

---

## ✨ Features

### Customer Features
- ✅ **Car Discovery** - Browse cars with advanced filtering (type, price, seats, transmission, fuel)
- ✅ **Real-time Availability** - Check car availability for specific date ranges
- ✅ **Smart Booking** - Create bookings with pickup/return locations and add-ons
- ✅ **Booking Management** - View booking history and cancel reservations
- ✅ **Responsive Design** - Seamless experience across desktop, tablet, and mobile

### Admin Features
- ✅ **Fleet Management** - Complete CRUD operations for car inventory
- ✅ **Booking Oversight** - Manage all bookings with status updates (Confirm, Pickup, Return)
- ✅ **Analytics Dashboard** - Track revenue, fleet utilization, and booking trends
- ✅ **Location Management** - Manage pickup/return locations
- ✅ **Add-on Management** - Configure additional services (GPS, child seats, etc.)

### Technical Features
- ✅ **Secure Authentication** - JWT-based auth with role-based access control (RBAC)
- ✅ **Conflict Prevention** - Advanced date overlap detection prevents double-booking
- ✅ **Audit Logging** - Track all critical operations for compliance
- ✅ **Rate Limiting** - Tiered rate limits protect against abuse
- ✅ **Input Validation** - Comprehensive Zod schema validation
- ✅ **Error Handling** - Structured error responses with detailed messages
- ✅ **API Documentation** - Complete Swagger/OpenAPI specification

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript ES2022
- **Framework**: Express.js
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod schema validation
- **Logging**: Winston (structured logging) + Morgan (HTTP)
- **Security**: Helmet.js, CORS, rate limiting
- **Testing**: Jest with ts-jest

### Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2.4
- **State Management**: React Context + TanStack React Query v5
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS 3.4 + Custom CSS variables
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose (dev + prod)
- **Database Migrations**: Prisma Migrate
- **Reverse Proxy**: Nginx (for frontend)
- **Process Manager**: dumb-init for signal handling

---

## 🏗 Architecture

### Backend Clean Architecture

```
backend/
├── src/
│   ├── domain/              # Business entities, errors, interfaces
│   ├── application/         # Use cases, business logic
│   ├── infrastructure/      # Database, repositories, external services
│   ├── presentation/        # Routes, controllers, middlewares, validators
│   └── shared/             # Utilities, types, constants
```

**Key Principles:**
- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Inversion**: Dependencies flow inward toward domain
- **Repository Pattern**: Abstract data access layer
- **Use Case Pattern**: Encapsulate business logic

### Frontend Architecture

```
frontend/
├── src/
│   ├── api/                # API client and service functions
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components (public, customer, admin)
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Helper functions
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose
- PostgreSQL 16 (if running without Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd data-driven-car-rental
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations and seed data**
   ```bash
   docker-compose exec backend npm run db:migrate
   docker-compose exec backend npm run db:seed
   ```

5. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api-docs (if configured)

### Development Setup (Without Docker)

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend API URL

# Start development server
npm run dev
```

### Default Login Credentials (After Seeding)

**Admin Account:**
- Email: `admin@carrental.com`
- Password: `Admin123!`

**Customer Account:**
- Email: `john.doe@example.com`
- Password: `Customer123!`

---

## 📁 Project Structure

```
.
├── backend/                 # Node.js/Express backend
│   ├── prisma/             # Database schema and migrations
│   ├── src/
│   │   ├── domain/         # Core business logic
│   │   ├── application/    # Use cases
│   │   ├── infrastructure/ # Data access, external services
│   │   ├── presentation/   # API routes, controllers
│   │   └── shared/         # Common utilities
│   ├── __tests__/          # Test suites
│   ├── Dockerfile          # Production container
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── contexts/      # State management
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utilities
│   ├── Dockerfile         # Production container
│   └── package.json
│
├── docs/                  # Comprehensive documentation
│   ├── backend/           # Backend specs and guides
│   ├── frontend/          # Frontend design docs
│   └── brd.md            # Business requirements
│
├── docker-compose.yml     # Production orchestration
├── docker-compose.dev.yml # Development orchestration
└── README.md             # This file
```

---

## 📚 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile

#### Cars (Public)
- `GET /api/cars` - List cars with filters and pagination
- `GET /api/cars/:id` - Get car details
- `GET /api/cars/:id/availability` - Check availability for date range

#### Bookings (Protected)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel` - Cancel booking

#### Admin (Admin Only)
- `GET /api/admin/dashboard` - Get analytics dashboard
- `GET /api/admin/bookings` - Get all bookings with filters
- `PATCH /api/admin/bookings/:id/status` - Update booking status
- Full CRUD for cars, locations, and add-ons

### API Features
- **Pagination**: All list endpoints support `page` and `limit` query params
- **Filtering**: Advanced filters (type, price range, seats, transmission, fuel)
- **Sorting**: Configurable sort options (price, year, seats)
- **Search**: Text search across car names and descriptions
- **Rate Limiting**:
  - API: 100 requests / 15 minutes
  - Auth: 10 requests / 15 minutes
  - Bookings: 20 requests / 1 hour

For complete API documentation, see [API Specification](docs/backend/03-api-specification.md).

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- E2E tests for authentication flow
- E2E tests for booking creation and availability
- Unit tests for date utilities
- Unit tests for pagination helpers
- Integration tests for critical endpoints

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

**Test Coverage:**
- Component tests with React Testing Library
- Context provider tests
- Utility function tests
- Form validation tests

---

## 🚢 Deployment

### Docker Production Deployment

1. **Build and start services**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

2. **Run migrations**
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

3. **Health check**
   ```bash
   curl http://localhost:3000/health
   ```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/car_rental
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
CORS_ORIGIN=http://localhost:80
LOG_LEVEL=info
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
```

### Deployment Platforms

**Recommended platforms:**
- **Backend**: Railway, Render, DigitalOcean App Platform, AWS ECS
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Railway PostgreSQL, Supabase, AWS RDS, DigitalOcean Managed DB

---

## 📸 Screenshots

> **Note**: Add screenshots here of your application:
> - Homepage with featured cars
> - Car listing page with filters
> - Car detail page with booking widget
> - Admin dashboard with analytics
> - Booking management interface
> - Mobile responsive views

---

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

### Backend Documentation
- [Technical Requirements](docs/backend/01-technical-requirements.md)
- [Database Schema](docs/backend/02-database-schema.md) - Entity relationships, indexes
- [API Specification](docs/backend/03-api-specification.md) - Complete endpoint documentation (1,560 lines)
- [Docker Setup Guide](docs/backend/04-docker-setup.md) - Development and production setup (905 lines)
- [Implementation Plans](docs/backend/05a-implementation-plan-foundation.md) - Step-by-step guides

### Frontend Documentation
- [Technical Design](docs/frontend/01-technical-design.md) - Architecture and patterns
- [Implementation Plan](docs/frontend/02-implementation-plan.md) - Phase-by-phase development

### Business Documentation
- [Business Requirements Document](docs/brd.md) - Complete feature specifications

---

## 🔒 Security Features

- **Authentication**: JWT with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Helmet.js security headers
- **CORS**: Configured origin whitelist
- **Rate Limiting**: Multi-tier limits (API, auth, bookings)
- **Error Handling**: Sanitized error messages (no stack traces in production)
- **Audit Logging**: Track critical operations

---

## 📊 Database Schema

**Core Entities:**
- `User` - Customer and admin accounts
- `Car` - Vehicle inventory with specifications
- `Booking` - Rental reservations with status tracking
- `Location` - Pickup/return locations
- `Addon` - Additional services (GPS, insurance, etc.)
- `BookingAddon` - Junction table with price snapshots
- `AuditLog` - System audit trail

**Key Features:**
- Composite indexes for query optimization
- Foreign key constraints for data integrity
- Soft deletes (status-based)
- Price snapshots at booking time
- Date overlap prevention

See [Database Schema Documentation](docs/backend/02-database-schema.md) for complete entity relationships and migrations.

---

## 🎯 Key Highlights

### Code Quality
- **4,283 lines** of backend TypeScript
- **2,544 lines** of frontend TypeScript/TSX
- **Strict TypeScript** configuration across the stack
- **ESLint** with TypeScript rules
- **Clean Architecture** with proper layer separation
- **SOLID principles** throughout the codebase

### Performance
- **Database Indexing** on frequently queried fields
- **Pagination** with configurable limits (default 20, max 100)
- **Query Optimization** through Prisma
- **React Query Caching** for efficient data fetching
- **Code Splitting** with React Router lazy loading

### Developer Experience
- **Hot Module Replacement** (HMR) in development
- **TypeScript** for type safety
- **Prisma Studio** for database GUI
- **Docker Compose** for easy setup
- **Comprehensive Logging** for debugging
- **API Documentation** for easy integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
This project follows [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Build process or auxiliary tool changes

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Budi Triwibowo**

- Portfolio: [Your Portfolio URL]
- LinkedIn: [Your LinkedIn]
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Clean Architecture principles by Robert C. Martin
- React and TypeScript communities
- Prisma team for excellent ORM
- All open-source contributors

---

## 📞 Support

If you have any questions or need help with setup, please:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Review the [API specification](docs/backend/03-api-specification.md)

---

<div align="center">

**⭐ Star this repository if you found it helpful! ⭐**

Made with ❤️ and TypeScript

</div>
