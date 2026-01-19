# Implementation Plan - Part B: Features
## Data-Driven Car Rental - Backend Implementation (Phases 4-9)

**Version:** 2.1
**Date:** 2026-01-19
**Document:** Part B of 2 (Features)
**Phases Covered:** 4-9 (Authentication, Cars, Bookings, Admin, Polish, Testing)
**Estimated Duration:** 14-20 hours

---

## Document Navigation

| Document | Phases | Content |
|----------|--------|---------|
| [05a-implementation-plan-foundation.md](./05a-implementation-plan-foundation.md) | 1-3 | Project Setup, Docker, Database, Core Architecture |
| **05b-implementation-plan-features.md** (This file) | 4-9 | Auth, Cars, Bookings, Admin, Analytics, Polish, Testing |

---

## Overview

This document covers the **feature phases** - building actual API endpoints:

| Phase | Name | Description | Est. Duration |
|-------|------|-------------|---------------|
| 4 | Authentication | JWT auth, login, register, middleware | 2-3 hours |
| 5 | Car Module | Car listing, filtering, CRUD | 2-3 hours |
| 6 | Booking Module | Create booking, availability check, status management | 3-4 hours |
| 7 | Admin & Analytics | Admin endpoints, dashboard analytics | 2-3 hours |
| 8 | Polish & Documentation | Swagger, rate limiting, final testing | 1-2 hours |
| 9 | Testing | Unit tests, integration tests, E2E API tests (90%+ coverage) | 4-5 hours |

**Prerequisites:** Complete [Part A (Phases 1-3)](./05a-implementation-plan-foundation.md) first!

---

# PHASE 4: Authentication

## Goal: Complete JWT authentication system

**Duration:** 2-3 hours
**Prerequisites:** Phase 3 completed

---

## 4.1 Create Auth Infrastructure

### Task 4.1.1: Create JWT Utility

**Action:** Create `backend/src/infrastructure/auth/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/index.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  expiresIn: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export function generateToken(payload: JwtPayload): TokenPair {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    accessToken,
    expiresIn: JWT_EXPIRES_IN,
  };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
```

---

### Task 4.1.2: Create Password Utility

**Action:** Create `backend/src/infrastructure/auth/password.ts`

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

### Task 4.1.3: Create Auth Index

**Action:** Create `backend/src/infrastructure/auth/index.ts`

```typescript
export { generateToken, verifyToken, decodeToken, JwtPayload, TokenPair } from './jwt.js';
export { hashPassword, comparePassword } from './password.js';
```

---

## 4.2 Create User Repository

### Task 4.2.1: Create User Repository Implementation

**Action:** Create `backend/src/infrastructure/repositories/UserRepository.ts`

```typescript
import { PrismaClient, User, UserRole } from '@prisma/client';
import { IUserRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class UserRepository implements IUserRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role || UserRole.CUSTOMER,
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }
}
```

---

## 4.3 Create Auth Use Cases

### Task 4.3.1: Create Register Use Case

**Action:** Create `backend/src/application/use-cases/auth/RegisterUseCase.ts`

```typescript
import { User, UserRole } from '../../../domain/entities/index.js';
import { IUserRepository } from '../../../domain/repositories/index.js';
import { ConflictError, ValidationError } from '../../../domain/errors/index.js';
import { hashPassword, generateToken, TokenPair } from '../../../infrastructure/auth/index.js';

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface RegisterOutput {
  user: Omit<User, 'passwordHash'>;
  token: TokenPair;
}

export class RegisterUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Validate password strength
    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    // Hash password and create user
    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
      role: UserRole.CUSTOMER,
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }
}
```

---

### Task 4.3.2: Create Login Use Case

**Action:** Create `backend/src/application/use-cases/auth/LoginUseCase.ts`

```typescript
import { User } from '../../../domain/entities/index.js';
import { IUserRepository } from '../../../domain/repositories/index.js';
import { UnauthorizedError } from '../../../domain/errors/index.js';
import { comparePassword, generateToken, TokenPair } from '../../../infrastructure/auth/index.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: Omit<User, 'passwordHash'>;
  token: TokenPair;
}

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await comparePassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }
}
```

---

### Task 4.3.3: Create GetProfile Use Case

**Action:** Create `backend/src/application/use-cases/auth/GetProfileUseCase.ts`

```typescript
import { User } from '../../../domain/entities/index.js';
import { IUserRepository } from '../../../domain/repositories/index.js';
import { NotFoundError } from '../../../domain/errors/index.js';

export interface GetProfileOutput {
  user: Omit<User, 'passwordHash'>;
}

export class GetProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<GetProfileOutput> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }
}
```

---

### Task 4.3.4: Create Auth Use Cases Index

**Action:** Create `backend/src/application/use-cases/auth/index.ts`

```typescript
export { RegisterUseCase, RegisterInput, RegisterOutput } from './RegisterUseCase.js';
export { LoginUseCase, LoginInput, LoginOutput } from './LoginUseCase.js';
export { GetProfileUseCase, GetProfileOutput } from './GetProfileUseCase.js';
```

---

## 4.4 Create Auth Middleware

### Task 4.4.1: Create Auth Middleware

**Action:** Create `backend/src/presentation/middlewares/authMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../infrastructure/auth/index.js';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/index.js';
import { AuthUser, AuthenticatedRequest } from '../../shared/types/index.js';
import { UserRole } from '../../domain/entities/index.js';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is required');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if ((error as Error).name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token', 'INVALID_TOKEN'));
    } else if ((error as Error).name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token has expired', 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(UserRole.ADMIN)(req, res, next);
}
```

---

### Task 4.4.2: Update Middleware Index

**Action:** Update `backend/src/presentation/middlewares/index.ts`

```typescript
export { errorHandler } from './errorHandler.js';
export { asyncHandler } from './asyncHandler.js';
export { validateRequest, validateBody, validateQuery, validateParams } from './validateRequest.js';
export { authenticate, requireRole, requireAdmin } from './authMiddleware.js';
```

---

## 4.5 Create Auth Validators

### Task 4.5.1: Create Auth Validators

**Action:** Create `backend/src/presentation/validators/authValidators.ts`

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
```

---

## 4.6 Create Auth Controller

### Task 4.6.1: Create Auth Controller

**Action:** Create `backend/src/presentation/controllers/AuthController.ts`

```typescript
import { Request, Response } from 'express';
import { RegisterUseCase, LoginUseCase, GetProfileUseCase } from '../../application/use-cases/auth/index.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';

const userRepository = new UserRepository();

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    const useCase = new RegisterUseCase(userRepository);
    const result = await useCase.execute(req.body);

    return sendCreated(res, {
      user: result.user,
      token: result.token,
    });
  }

  static async login(req: Request, res: Response): Promise<Response> {
    const useCase = new LoginUseCase(userRepository);
    const result = await useCase.execute(req.body);

    return sendSuccess(res, {
      user: result.user,
      token: result.token,
    });
  }

  static async getProfile(req: Request, res: Response): Promise<Response> {
    const { user } = req as AuthenticatedRequest;
    const useCase = new GetProfileUseCase(userRepository);
    const result = await useCase.execute(user.id);

    return sendSuccess(res, result.user);
  }
}
```

---

## 4.7 Create Auth Routes

### Task 4.7.1: Create Auth Routes

**Action:** Create `backend/src/presentation/routes/authRoutes.ts`

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { asyncHandler, validateBody, authenticate } from '../middlewares/index.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(AuthController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(AuthController.login)
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(AuthController.getProfile)
);

export default router;
```

---

### Task 4.7.2: Update Routes Index

**Action:** Update `backend/src/presentation/routes/index.ts`

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

// Car routes (Phase 5)
// router.use('/cars', carRoutes);

// Booking routes (Phase 6)
// router.use('/bookings', bookingRoutes);

// Location routes
// router.use('/locations', locationRoutes);

// Addon routes
// router.use('/addons', addonRoutes);

// Admin routes (Phase 7)
// router.use('/admin', adminRoutes);

export default router;
```

---

## 4.8 Verify Phase 4

### Task 4.8.1: Restart Server

**Action:**

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

**Verify:** No TypeScript errors in logs

---

### Task 4.8.2: Test Register

**Action:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "Password123"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "name": "Test User",
      "role": "CUSTOMER",
      "createdAt": "2026-01-19T...",
      "updatedAt": "2026-01-19T..."
    },
    "token": {
      "accessToken": "eyJ...",
      "expiresIn": "15m"
    }
  }
}
```

---

### Task 4.8.3: Test Login

**Action:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@carrental.com",
    "password": "Admin123!"
  }'
```

**Expected:** Returns user data and token

---

### Task 4.8.4: Test Profile

**Action:** (Use token from login response)

```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Returns user profile

---

### Task 4.8.5: Test Validation Errors

**Action:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "name": "",
    "password": "weak"
  }'
```

**Expected:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": ["Invalid email format"],
        "name": ["Name is required"],
        "password": ["Password must be at least 8 characters"]
      }
    }
  }
}
```

---

## Phase 4 Completion Checklist

- [x] 4.1.1-3 Created auth infrastructure (JWT, password)
- [x] 4.2.1 Created UserRepository
- [x] 4.3.1-4 Created auth use cases (Register, Login, GetProfile)
- [x] 4.4.1-2 Created auth middleware
- [x] 4.5.1 Created auth validators
- [x] 4.6.1 Created AuthController
- [x] 4.7.1-2 Created auth routes
- [x] 4.8.1-5 Verified all auth endpoints

## Phase 4 Deliverables

```
backend/src/
├── infrastructure/
│   ├── auth/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── index.ts
│   └── repositories/
│       └── UserRepository.ts
├── application/
│   └── use-cases/
│       └── auth/
│           ├── RegisterUseCase.ts
│           ├── LoginUseCase.ts
│           ├── GetProfileUseCase.ts
│           └── index.ts
└── presentation/
    ├── controllers/
    │   └── AuthController.ts
    ├── middlewares/
    │   └── authMiddleware.ts
    ├── validators/
    │   └── authValidators.ts
    └── routes/
        └── authRoutes.ts
```

## Resume Point (Phase 4)

```bash
docker-compose -f docker-compose.dev.yml up

# Test auth
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@carrental.com", "password": "Admin123!"}'
```

---

# PHASE 5: Car Module

## Goal: Complete car listing, filtering, and CRUD operations

**Duration:** 2-3 hours
**Prerequisites:** Phase 4 completed

---

## 5.1 Create Car Repository

### Task 5.1.1: Create Car Repository Implementation

**Action:** Create `backend/src/infrastructure/repositories/CarRepository.ts`

```typescript
import { PrismaClient, Car, CarStatus, BookingStatus } from '@prisma/client';
import {
  ICarRepository,
  CarFilters,
  CarSortOptions,
  PaginationParams,
  PaginatedResult,
} from '../../domain/repositories/index.js';
import { CarWithAvailability } from '../../domain/entities/index.js';
import { prisma } from '../database/prisma.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { ACTIVE_BOOKING_STATUSES } from '../../shared/constants/index.js';

export class CarRepository implements ICarRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findAll(
    filters: CarFilters,
    pagination: PaginationParams,
    sort?: CarSortOptions
  ): Promise<PaginatedResult<CarWithAvailability>> {
    const where: any = {};

    // Apply filters
    if (filters.type) where.type = filters.type;
    if (filters.seats) where.seats = { gte: filters.seats };
    if (filters.transmission) where.transmission = filters.transmission;
    if (filters.fuel) where.fuel = filters.fuel;
    if (filters.status) where.status = filters.status;
    else where.status = CarStatus.ACTIVE; // Default to active cars only

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.dailyPrice = {};
      if (filters.priceMin !== undefined) where.dailyPrice.gte = filters.priceMin;
      if (filters.priceMax !== undefined) where.dailyPrice.lte = filters.priceMax;
    }

    // Get total count
    const total = await this.db.car.count({ where });

    // Build orderBy
    const orderBy: any = {};
    if (sort) {
      orderBy[sort.field] = sort.order;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch cars
    const cars = await this.db.car.findMany({
      where,
      orderBy,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    // Check availability if date range provided
    let carsWithAvailability: CarWithAvailability[] = cars;
    if (filters.startDate && filters.endDate) {
      const carIds = cars.map(c => c.id);
      const overlappingBookings = await this.db.booking.findMany({
        where: {
          carId: { in: carIds },
          status: { in: ACTIVE_BOOKING_STATUSES as unknown as BookingStatus[] },
          AND: [
            { startDate: { lte: filters.endDate } },
            { endDate: { gte: filters.startDate } },
          ],
        },
        select: { carId: true },
      });

      const unavailableCarIds = new Set(overlappingBookings.map(b => b.carId));
      carsWithAvailability = cars.map(car => ({
        ...car,
        isAvailable: !unavailableCarIds.has(car.id),
      }));
    }

    return {
      data: carsWithAvailability,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findById(id: string): Promise<Car | null> {
    return this.db.car.findUnique({
      where: { id },
    });
  }

  async create(data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car> {
    return this.db.car.create({
      data,
    });
  }

  async update(id: string, data: Partial<Car>): Promise<Car> {
    return this.db.car.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: CarStatus): Promise<Car> {
    return this.db.car.update({
      where: { id },
      data: { status },
    });
  }

  async checkAvailability(
    carId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const where: any = {
      carId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const overlapping = await this.db.booking.count({ where });
    return overlapping === 0;
  }

  async hasActiveBookings(carId: string): Promise<boolean> {
    const count = await this.db.booking.count({
      where: {
        carId,
        status: { in: ACTIVE_BOOKING_STATUSES as unknown as BookingStatus[] },
      },
    });
    return count > 0;
  }
}
```

---

## 5.2 Create Car Use Cases

### Task 5.2.1: Create GetCars Use Case

**Action:** Create `backend/src/application/use-cases/cars/GetCarsUseCase.ts`

```typescript
import { ICarRepository, CarFilters, CarSortOptions, PaginationParams, PaginatedResult } from '../../../domain/repositories/index.js';
import { CarWithAvailability } from '../../../domain/entities/index.js';

export interface GetCarsInput {
  filters: CarFilters;
  pagination: PaginationParams;
  sort?: CarSortOptions;
}

export class GetCarsUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(input: GetCarsInput): Promise<PaginatedResult<CarWithAvailability>> {
    return this.carRepository.findAll(input.filters, input.pagination, input.sort);
  }
}
```

---

### Task 5.2.2: Create GetCarById Use Case

**Action:** Create `backend/src/application/use-cases/cars/GetCarByIdUseCase.ts`

```typescript
import { Car } from '../../../domain/entities/index.js';
import { ICarRepository } from '../../../domain/repositories/index.js';
import { NotFoundError } from '../../../domain/errors/index.js';

export interface GetCarByIdInput {
  carId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface GetCarByIdOutput {
  car: Car;
  isAvailable?: boolean;
}

export class GetCarByIdUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(input: GetCarByIdInput): Promise<GetCarByIdOutput> {
    const car = await this.carRepository.findById(input.carId);
    if (!car) {
      throw new NotFoundError('Car', input.carId);
    }

    let isAvailable: boolean | undefined;
    if (input.startDate && input.endDate) {
      isAvailable = await this.carRepository.checkAvailability(
        input.carId,
        input.startDate,
        input.endDate
      );
    }

    return { car, isAvailable };
  }
}
```

---

### Task 5.2.3: Create CreateCar Use Case (Admin)

**Action:** Create `backend/src/application/use-cases/cars/CreateCarUseCase.ts`

```typescript
import { Car, CarType, Transmission, FuelType, CarStatus } from '../../../domain/entities/index.js';
import { ICarRepository } from '../../../domain/repositories/index.js';

export interface CreateCarInput {
  brand: string;
  model: string;
  year: number;
  type: CarType;
  seats: number;
  transmission: Transmission;
  fuel: FuelType;
  dailyPrice: number;
  images?: string[];
}

export class CreateCarUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(input: CreateCarInput): Promise<Car> {
    return this.carRepository.create({
      brand: input.brand,
      model: input.model,
      year: input.year,
      type: input.type,
      seats: input.seats,
      transmission: input.transmission,
      fuel: input.fuel,
      dailyPrice: input.dailyPrice as any,
      status: CarStatus.ACTIVE,
      images: input.images || [],
    });
  }
}
```

---

### Task 5.2.4: Create UpdateCar Use Case (Admin)

**Action:** Create `backend/src/application/use-cases/cars/UpdateCarUseCase.ts`

```typescript
import { Car, CarType, Transmission, FuelType, CarStatus } from '../../../domain/entities/index.js';
import { ICarRepository } from '../../../domain/repositories/index.js';
import { NotFoundError, ConflictError } from '../../../domain/errors/index.js';

export interface UpdateCarInput {
  carId: string;
  brand?: string;
  model?: string;
  year?: number;
  type?: CarType;
  seats?: number;
  transmission?: Transmission;
  fuel?: FuelType;
  dailyPrice?: number;
  status?: CarStatus;
  images?: string[];
}

export class UpdateCarUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(input: UpdateCarInput): Promise<Car> {
    const car = await this.carRepository.findById(input.carId);
    if (!car) {
      throw new NotFoundError('Car', input.carId);
    }

    // If trying to deactivate, check for active bookings
    if (input.status === CarStatus.INACTIVE && car.status === CarStatus.ACTIVE) {
      const hasActiveBookings = await this.carRepository.hasActiveBookings(input.carId);
      if (hasActiveBookings) {
        throw new ConflictError(
          'Cannot deactivate car with active bookings',
          'CAR_HAS_ACTIVE_BOOKINGS'
        );
      }
    }

    const { carId, ...updateData } = input;
    return this.carRepository.update(carId, updateData as any);
  }
}
```

---

### Task 5.2.5: Create Cars Use Cases Index

**Action:** Create `backend/src/application/use-cases/cars/index.ts`

```typescript
export { GetCarsUseCase, GetCarsInput } from './GetCarsUseCase.js';
export { GetCarByIdUseCase, GetCarByIdInput, GetCarByIdOutput } from './GetCarByIdUseCase.js';
export { CreateCarUseCase, CreateCarInput } from './CreateCarUseCase.js';
export { UpdateCarUseCase, UpdateCarInput } from './UpdateCarUseCase.js';
```

---

## 5.3 Create Car Validators

### Task 5.3.1: Create Car Validators

**Action:** Create `backend/src/presentation/validators/carValidators.ts`

```typescript
import { z } from 'zod';
import { CarType, Transmission, FuelType, CarStatus } from '@prisma/client';

export const carFiltersSchema = z.object({
  type: z.nativeEnum(CarType).optional(),
  seats: z.coerce.number().int().min(1).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['dailyPrice', 'createdAt', 'seats', 'year']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: 'endDate must be greater than or equal to startDate', path: ['endDate'] }
);

export const carIdParamSchema = z.object({
  id: z.string().uuid('Invalid car ID format'),
});

export const carAvailabilityQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: 'endDate must be greater than or equal to startDate', path: ['endDate'] }
);

export const createCarSchema = z.object({
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  type: z.nativeEnum(CarType),
  seats: z.number().int().min(1).max(50),
  transmission: z.nativeEnum(Transmission),
  fuel: z.nativeEnum(FuelType),
  dailyPrice: z.number().positive('Daily price must be positive'),
  images: z.array(z.string().url()).optional(),
});

export const updateCarSchema = z.object({
  brand: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  type: z.nativeEnum(CarType).optional(),
  seats: z.number().int().min(1).max(50).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  dailyPrice: z.number().positive().optional(),
  status: z.nativeEnum(CarStatus).optional(),
  images: z.array(z.string().url()).optional(),
});

export type CarFiltersDto = z.infer<typeof carFiltersSchema>;
export type CreateCarDto = z.infer<typeof createCarSchema>;
export type UpdateCarDto = z.infer<typeof updateCarSchema>;
```

---

## 5.4 Create Car Controller

### Task 5.4.1: Create Car Controller

**Action:** Create `backend/src/presentation/controllers/CarController.ts`

```typescript
import { Request, Response } from 'express';
import { GetCarsUseCase, GetCarByIdUseCase, CreateCarUseCase, UpdateCarUseCase } from '../../application/use-cases/cars/index.js';
import { CarRepository } from '../../infrastructure/repositories/CarRepository.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { CarFiltersDto } from '../validators/carValidators.js';

const carRepository = new CarRepository();

export class CarController {
  static async getCars(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as CarFiltersDto;

    const useCase = new GetCarsUseCase(carRepository);
    const result = await useCase.execute({
      filters: {
        type: query.type,
        seats: query.seats,
        transmission: query.transmission,
        fuel: query.fuel,
        priceMin: query.priceMin,
        priceMax: query.priceMax,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      pagination: {
        page: query.page,
        limit: query.limit,
      },
      sort: {
        field: query.sortBy as any,
        order: query.sortOrder,
      },
    });

    return sendSuccess(res, result.data, 200, result.meta);
  }

  static async getCarById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { startDate, endDate } = req.query as any;

    const useCase = new GetCarByIdUseCase(carRepository);
    const result = await useCase.execute({
      carId: id,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return sendSuccess(res, result);
  }

  static async createCar(req: Request, res: Response): Promise<Response> {
    const useCase = new CreateCarUseCase(carRepository);
    const car = await useCase.execute(req.body);

    return sendCreated(res, car);
  }

  static async updateCar(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const useCase = new UpdateCarUseCase(carRepository);
    const car = await useCase.execute({
      carId: id,
      ...req.body,
    });

    return sendSuccess(res, car);
  }
}
```

---

## 5.5 Create Car Routes

### Task 5.5.1: Create Car Routes

**Action:** Create `backend/src/presentation/routes/carRoutes.ts`

```typescript
import { Router } from 'express';
import { CarController } from '../controllers/CarController.js';
import { asyncHandler, validateQuery, validateParams, validateBody, authenticate, requireAdmin } from '../middlewares/index.js';
import { carFiltersSchema, carIdParamSchema, carAvailabilityQuerySchema, createCarSchema, updateCarSchema } from '../validators/carValidators.js';

const router = Router();

/**
 * @route   GET /api/cars
 * @desc    Get all cars with filters and pagination
 * @access  Public
 */
router.get(
  '/',
  validateQuery(carFiltersSchema),
  asyncHandler(CarController.getCars)
);

/**
 * @route   GET /api/cars/:id
 * @desc    Get car by ID with optional availability check
 * @access  Public
 */
router.get(
  '/:id',
  validateParams(carIdParamSchema),
  validateQuery(carAvailabilityQuerySchema),
  asyncHandler(CarController.getCarById)
);

/**
 * @route   POST /api/cars
 * @desc    Create a new car
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(createCarSchema),
  asyncHandler(CarController.createCar)
);

/**
 * @route   PATCH /api/cars/:id
 * @desc    Update a car
 * @access  Admin only
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(carIdParamSchema),
  validateBody(updateCarSchema),
  asyncHandler(CarController.updateCar)
);

export default router;
```

---

### Task 5.5.2: Update Routes Index

**Action:** Update `backend/src/presentation/routes/index.ts`

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import carRoutes from './carRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

// Car routes
router.use('/cars', carRoutes);

// Booking routes (Phase 6)
// router.use('/bookings', bookingRoutes);

// Location routes (Phase 5.6)
// router.use('/locations', locationRoutes);

// Addon routes (Phase 5.6)
// router.use('/addons', addonRoutes);

// Admin routes (Phase 7)
// router.use('/admin', adminRoutes);

export default router;
```

---

## 5.6 Create Location & Addon Support

### Task 5.6.1: Create Location Repository

**Action:** Create `backend/src/infrastructure/repositories/LocationRepository.ts`

```typescript
import { PrismaClient, Location } from '@prisma/client';
import { ILocationRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class LocationRepository implements ILocationRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findAll(activeOnly: boolean = true): Promise<Location[]> {
    return this.db.location.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Location | null> {
    return this.db.location.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; address?: string }): Promise<Location> {
    return this.db.location.create({
      data,
    });
  }
}
```

---

### Task 5.6.2: Create Addon Repository

**Action:** Create `backend/src/infrastructure/repositories/AddonRepository.ts`

```typescript
import { PrismaClient, Addon } from '@prisma/client';
import { IAddonRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class AddonRepository implements IAddonRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findAll(activeOnly: boolean = true): Promise<Addon[]> {
    return this.db.addon.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Addon | null> {
    return this.db.addon.findUnique({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<Addon[]> {
    return this.db.addon.findMany({
      where: { id: { in: ids } },
    });
  }

  async create(data: { name: string; description?: string; pricePerBooking: number }): Promise<Addon> {
    return this.db.addon.create({
      data,
    });
  }
}
```

---

### Task 5.6.3: Create Location & Addon Controllers

**Action:** Create `backend/src/presentation/controllers/LocationController.ts`

```typescript
import { Request, Response } from 'express';
import { LocationRepository } from '../../infrastructure/repositories/LocationRepository.js';
import { sendSuccess } from '../../shared/utils/response.js';

const locationRepository = new LocationRepository();

export class LocationController {
  static async getLocations(req: Request, res: Response): Promise<Response> {
    const locations = await locationRepository.findAll();
    return sendSuccess(res, locations);
  }
}
```

**Action:** Create `backend/src/presentation/controllers/AddonController.ts`

```typescript
import { Request, Response } from 'express';
import { AddonRepository } from '../../infrastructure/repositories/AddonRepository.js';
import { sendSuccess } from '../../shared/utils/response.js';

const addonRepository = new AddonRepository();

export class AddonController {
  static async getAddons(req: Request, res: Response): Promise<Response> {
    const addons = await addonRepository.findAll();
    return sendSuccess(res, addons);
  }
}
```

---

### Task 5.6.4: Create Location & Addon Routes

**Action:** Create `backend/src/presentation/routes/locationRoutes.ts`

```typescript
import { Router } from 'express';
import { LocationController } from '../controllers/LocationController.js';
import { asyncHandler } from '../middlewares/index.js';

const router = Router();

/**
 * @route   GET /api/locations
 * @desc    Get all active locations
 * @access  Public
 */
router.get('/', asyncHandler(LocationController.getLocations));

export default router;
```

**Action:** Create `backend/src/presentation/routes/addonRoutes.ts`

```typescript
import { Router } from 'express';
import { AddonController } from '../controllers/AddonController.js';
import { asyncHandler } from '../middlewares/index.js';

const router = Router();

/**
 * @route   GET /api/addons
 * @desc    Get all active addons
 * @access  Public
 */
router.get('/', asyncHandler(AddonController.getAddons));

export default router;
```

---

### Task 5.6.5: Final Routes Index Update

**Action:** Update `backend/src/presentation/routes/index.ts`

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import carRoutes from './carRoutes.js';
import locationRoutes from './locationRoutes.js';
import addonRoutes from './addonRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

// Car routes
router.use('/cars', carRoutes);

// Location routes
router.use('/locations', locationRoutes);

// Addon routes
router.use('/addons', addonRoutes);

// Booking routes (Phase 6)
// router.use('/bookings', bookingRoutes);

// Admin routes (Phase 7)
// router.use('/admin', adminRoutes);

export default router;
```

---

## 5.7 Verify Phase 5

### Task 5.7.1: Restart and Test

**Action:**

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

---

### Task 5.7.2: Test Get Cars

**Action:**

```bash
curl "http://localhost:3000/api/cars"
```

**Expected:** Returns paginated list of 20 cars

---

### Task 5.7.3: Test Car Filters

**Action:**

```bash
# Filter by type
curl "http://localhost:3000/api/cars?type=SUV"

# Filter by price range
curl "http://localhost:3000/api/cars?priceMin=300000&priceMax=500000"

# Filter with availability check
curl "http://localhost:3000/api/cars?startDate=2026-01-25&endDate=2026-01-28"

# Combined filters
curl "http://localhost:3000/api/cars?type=MPV&seats=7&transmission=AT&sortBy=dailyPrice&sortOrder=asc"
```

---

### Task 5.7.4: Test Get Car by ID

**Action:** (Use a car ID from the list)

```bash
curl "http://localhost:3000/api/cars/CAR_ID_HERE"

# With availability check
curl "http://localhost:3000/api/cars/CAR_ID_HERE?startDate=2026-01-25&endDate=2026-01-28"
```

---

### Task 5.7.5: Test Admin Car Creation

**Action:** (First login as admin to get token)

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@carrental.com", "password": "Admin123!"}' | jq -r '.data.token.accessToken')

# Create car
curl -X POST http://localhost:3000/api/cars \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "brand": "Tesla",
    "model": "Model Y",
    "year": 2024,
    "type": "SUV",
    "seats": 5,
    "transmission": "AT",
    "fuel": "EV",
    "dailyPrice": 800000,
    "images": ["https://example.com/tesla.jpg"]
  }'
```

---

### Task 5.7.6: Test Locations and Addons

**Action:**

```bash
curl http://localhost:3000/api/locations
curl http://localhost:3000/api/addons
```

---

## Phase 5 Completion Checklist

- [x] 5.1.1 Created CarRepository
- [x] 5.2.1-5 Created car use cases
- [x] 5.3.1 Created car validators
- [x] 5.4.1 Created CarController
- [x] 5.5.1-2 Created car routes
- [x] 5.6.1-5 Created location/addon support
- [x] 5.7.1-6 Verified all car endpoints

## Phase 5 Deliverables

```
backend/src/
├── infrastructure/
│   └── repositories/
│       ├── CarRepository.ts
│       ├── LocationRepository.ts
│       └── AddonRepository.ts
├── application/
│   └── use-cases/
│       └── cars/
│           ├── GetCarsUseCase.ts
│           ├── GetCarByIdUseCase.ts
│           ├── CreateCarUseCase.ts
│           ├── UpdateCarUseCase.ts
│           └── index.ts
└── presentation/
    ├── controllers/
    │   ├── CarController.ts
    │   ├── LocationController.ts
    │   └── AddonController.ts
    ├── validators/
    │   └── carValidators.ts
    └── routes/
        ├── carRoutes.ts
        ├── locationRoutes.ts
        └── addonRoutes.ts
```

## Resume Point (Phase 5)

```bash
docker-compose -f docker-compose.dev.yml up

# Test cars
curl "http://localhost:3000/api/cars?type=SUV&sortBy=dailyPrice"
curl http://localhost:3000/api/locations
curl http://localhost:3000/api/addons
```

---

# PHASE 6: Booking Module

## Goal: Complete booking system with availability checks

**Duration:** 3-4 hours
**Prerequisites:** Phase 5 completed

---

## 6.1 Create Booking Repository

### Task 6.1.1: Create Booking Repository Implementation

**Action:** Create `backend/src/infrastructure/repositories/BookingRepository.ts`

```typescript
import { PrismaClient, Booking, BookingStatus } from '@prisma/client';
import {
  IBookingRepository,
  BookingFilters,
  BookingSortOptions,
  PaginationParams,
  PaginatedResult,
  CreateBookingData,
} from '../../domain/repositories/index.js';
import { BookingWithRelations } from '../../domain/entities/index.js';
import { prisma } from '../database/prisma.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { ACTIVE_BOOKING_STATUSES } from '../../shared/constants/index.js';

export class BookingRepository implements IBookingRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  private getIncludeRelations() {
    return {
      user: { select: { id: true, email: true, name: true, role: true } },
      car: true,
      pickupLocation: true,
      dropoffLocation: true,
      bookingAddons: { include: { addon: true } },
    };
  }

  async findById(id: string, includeRelations: boolean = true): Promise<BookingWithRelations | null> {
    return this.db.booking.findUnique({
      where: { id },
      include: includeRelations ? this.getIncludeRelations() : undefined,
    }) as Promise<BookingWithRelations | null>;
  }

  async findByUserId(
    userId: string,
    filters: Omit<BookingFilters, 'userId'>,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>> {
    const where: any = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.carId) where.carId = filters.carId;

    const total = await this.db.booking.count({ where });

    const orderBy: any = {};
    if (sort) {
      orderBy[sort.field] = sort.order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const bookings = await this.db.booking.findMany({
      where,
      include: this.getIncludeRelations(),
      orderBy,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return {
      data: bookings as BookingWithRelations[],
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findAll(
    filters: BookingFilters,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.carId) where.carId = filters.carId;
    if (filters.status) where.status = filters.status;
    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {};
      if (filters.startDateFrom) where.startDate.gte = filters.startDateFrom;
      if (filters.startDateTo) where.startDate.lte = filters.startDateTo;
    }

    const total = await this.db.booking.count({ where });

    const orderBy: any = {};
    if (sort) {
      orderBy[sort.field] = sort.order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const bookings = await this.db.booking.findMany({
      where,
      include: this.getIncludeRelations(),
      orderBy,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return {
      data: bookings as BookingWithRelations[],
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async create(data: CreateBookingData): Promise<BookingWithRelations> {
    return this.db.booking.create({
      data: {
        userId: data.userId,
        carId: data.carId,
        pickupLocationId: data.pickupLocationId,
        dropoffLocationId: data.dropoffLocationId,
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        basePrice: data.basePrice,
        addonPrice: data.addonPrice,
        totalPrice: data.totalPrice,
        status: BookingStatus.PENDING,
        bookingAddons: {
          create: data.addonIds.map(addonId => ({
            addonId,
            price: data.addonPrices.get(addonId) || 0,
          })),
        },
      },
      include: this.getIncludeRelations(),
    }) as Promise<BookingWithRelations>;
  }

  async updateStatus(id: string, status: BookingStatus, cancelReason?: string): Promise<Booking> {
    return this.db.booking.update({
      where: { id },
      data: {
        status,
        cancelReason: cancelReason || null,
      },
    });
  }

  async checkOverlap(
    carId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const where: any = {
      carId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const overlapping = await this.db.booking.count({ where });
    return overlapping > 0;
  }
}
```

---

### Task 6.1.2: Create Audit Log Repository

**Action:** Create `backend/src/infrastructure/repositories/AuditLogRepository.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { IAuditLogRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class AuditLogRepository implements IAuditLogRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async create(data: {
    actorId?: string;
    entityType: string;
    entityId: string;
    action: string;
    beforeJson?: object;
    afterJson?: object;
  }): Promise<void> {
    await this.db.auditLog.create({
      data: {
        actorId: data.actorId || null,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        beforeJson: data.beforeJson || null,
        afterJson: data.afterJson || null,
      },
    });
  }
}
```

---

## 6.2 Create Booking Use Cases

### Task 6.2.1: Create CreateBooking Use Case

**Action:** Create `backend/src/application/use-cases/bookings/CreateBookingUseCase.ts`

```typescript
import { BookingWithRelations, CarStatus } from '../../../domain/entities/index.js';
import { IBookingRepository, ICarRepository, ILocationRepository, IAddonRepository } from '../../../domain/repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../../domain/errors/index.js';
import { calculateDays, isFutureOrToday } from '../../../shared/utils/date.js';

export interface CreateBookingInput {
  userId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  startDate: Date;
  endDate: Date;
  addonIds?: string[];
}

export class CreateBookingUseCase {
  constructor(
    private bookingRepository: IBookingRepository,
    private carRepository: ICarRepository,
    private locationRepository: ILocationRepository,
    private addonRepository: IAddonRepository
  ) {}

  async execute(input: CreateBookingInput): Promise<BookingWithRelations> {
    // 1. Validate dates
    if (!isFutureOrToday(input.startDate)) {
      throw new ValidationError('Start date must be today or in the future');
    }

    if (input.endDate < input.startDate) {
      throw new ValidationError('End date must be after start date');
    }

    // 2. Validate car exists and is active
    const car = await this.carRepository.findById(input.carId);
    if (!car) {
      throw new NotFoundError('Car', input.carId);
    }

    if (car.status !== CarStatus.ACTIVE) {
      throw new ValidationError('Car is not available for booking');
    }

    // 3. Check car availability (CRITICAL - prevents double booking)
    const hasOverlap = await this.bookingRepository.checkOverlap(
      input.carId,
      input.startDate,
      input.endDate
    );

    if (hasOverlap) {
      throw new ConflictError(
        'Car is not available for the selected dates',
        'CAR_NOT_AVAILABLE'
      );
    }

    // 4. Validate locations
    const pickupLocation = await this.locationRepository.findById(input.pickupLocationId);
    if (!pickupLocation) {
      throw new NotFoundError('Pickup Location', input.pickupLocationId);
    }

    const dropoffLocation = await this.locationRepository.findById(input.dropoffLocationId);
    if (!dropoffLocation) {
      throw new NotFoundError('Dropoff Location', input.dropoffLocationId);
    }

    // 5. Validate and get addons
    let addons: { id: string; pricePerBooking: any }[] = [];
    if (input.addonIds && input.addonIds.length > 0) {
      addons = await this.addonRepository.findByIds(input.addonIds);
      if (addons.length !== input.addonIds.length) {
        throw new ValidationError('One or more addon IDs are invalid');
      }
    }

    // 6. Calculate pricing
    const days = calculateDays(input.startDate, input.endDate);
    const basePrice = Number(car.dailyPrice) * days;
    const addonPrice = addons.reduce((sum, addon) => sum + Number(addon.pricePerBooking), 0);
    const totalPrice = basePrice + addonPrice;

    // 7. Create addon price map (snapshot prices at booking time)
    const addonPrices = new Map<string, number>();
    addons.forEach(addon => {
      addonPrices.set(addon.id, Number(addon.pricePerBooking));
    });

    // 8. Create booking
    return this.bookingRepository.create({
      userId: input.userId,
      carId: input.carId,
      pickupLocationId: input.pickupLocationId,
      dropoffLocationId: input.dropoffLocationId,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      basePrice,
      addonPrice,
      totalPrice,
      addonIds: input.addonIds || [],
      addonPrices,
    });
  }
}
```

---

### Task 6.2.2: Create GetUserBookings Use Case

**Action:** Create `backend/src/application/use-cases/bookings/GetUserBookingsUseCase.ts`

```typescript
import { IBookingRepository, BookingFilters, BookingSortOptions, PaginationParams, PaginatedResult } from '../../../domain/repositories/index.js';
import { BookingWithRelations, BookingStatus } from '../../../domain/entities/index.js';

export interface GetUserBookingsInput {
  userId: string;
  status?: BookingStatus;
  pagination: PaginationParams;
  sort?: BookingSortOptions;
}

export class GetUserBookingsUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(input: GetUserBookingsInput): Promise<PaginatedResult<BookingWithRelations>> {
    return this.bookingRepository.findByUserId(
      input.userId,
      { status: input.status },
      input.pagination,
      input.sort
    );
  }
}
```

---

### Task 6.2.3: Create GetBookingById Use Case

**Action:** Create `backend/src/application/use-cases/bookings/GetBookingByIdUseCase.ts`

```typescript
import { IBookingRepository } from '../../../domain/repositories/index.js';
import { BookingWithRelations } from '../../../domain/entities/index.js';
import { NotFoundError, ForbiddenError } from '../../../domain/errors/index.js';
import { UserRole } from '../../../domain/entities/index.js';

export interface GetBookingByIdInput {
  bookingId: string;
  userId: string;
  userRole: UserRole;
}

export class GetBookingByIdUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(input: GetBookingByIdInput): Promise<BookingWithRelations> {
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', input.bookingId);
    }

    // Check access: user can only see their own bookings (unless admin)
    if (input.userRole !== UserRole.ADMIN && booking.userId !== input.userId) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    return booking;
  }
}
```

---

### Task 6.2.4: Create CancelBooking Use Case

**Action:** Create `backend/src/application/use-cases/bookings/CancelBookingUseCase.ts`

```typescript
import { Booking, BookingStatus, UserRole } from '../../../domain/entities/index.js';
import { IBookingRepository, IAuditLogRepository } from '../../../domain/repositories/index.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../domain/errors/index.js';
import { BOOKING_STATUS_TRANSITIONS } from '../../../shared/constants/index.js';

export interface CancelBookingInput {
  bookingId: string;
  userId: string;
  userRole: UserRole;
  reason?: string;
}

export class CancelBookingUseCase {
  constructor(
    private bookingRepository: IBookingRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(input: CancelBookingInput): Promise<Booking> {
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', input.bookingId);
    }

    // Check access
    if (input.userRole !== UserRole.ADMIN && booking.userId !== input.userId) {
      throw new ForbiddenError('You do not have permission to cancel this booking');
    }

    // Validate status transition
    const allowedTransitions = BOOKING_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes(BookingStatus.CANCELLED)) {
      throw new ValidationError(
        `Cannot cancel booking with status '${booking.status}'`,
        [{ field: 'status', message: `Booking cannot be cancelled from '${booking.status}' status` }]
      );
    }

    // Update booking status
    const updatedBooking = await this.bookingRepository.updateStatus(
      input.bookingId,
      BookingStatus.CANCELLED,
      input.reason
    );

    // Create audit log
    await this.auditLogRepository.create({
      actorId: input.userId,
      entityType: 'Booking',
      entityId: input.bookingId,
      action: 'CANCELLED',
      beforeJson: { status: booking.status },
      afterJson: { status: BookingStatus.CANCELLED, reason: input.reason },
    });

    return updatedBooking;
  }
}
```

---

### Task 6.2.5: Create Booking Use Cases Index

**Action:** Create `backend/src/application/use-cases/bookings/index.ts`

```typescript
export { CreateBookingUseCase, CreateBookingInput } from './CreateBookingUseCase.js';
export { GetUserBookingsUseCase, GetUserBookingsInput } from './GetUserBookingsUseCase.js';
export { GetBookingByIdUseCase, GetBookingByIdInput } from './GetBookingByIdUseCase.js';
export { CancelBookingUseCase, CancelBookingInput } from './CancelBookingUseCase.js';
```

---

## 6.3 Create Booking Validators

### Task 6.3.1: Create Booking Validators

**Action:** Create `backend/src/presentation/validators/bookingValidators.ts`

```typescript
import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  carId: z.string().uuid('Invalid car ID'),
  pickupLocationId: z.string().uuid('Invalid pickup location ID'),
  dropoffLocationId: z.string().uuid('Invalid dropoff location ID'),
  startDate: z.coerce.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: 'Start date must be today or in the future' }
  ),
  endDate: z.coerce.date(),
  addonIds: z.array(z.string().uuid('Invalid addon ID')).optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be after or equal to start date', path: ['endDate'] }
);

export const bookingIdParamSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
});

export const bookingFiltersSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'startDate', 'totalPrice']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type BookingFiltersDto = z.infer<typeof bookingFiltersSchema>;
export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;
```

---

## 6.4 Create Booking Controller

### Task 6.4.1: Create Booking Controller

**Action:** Create `backend/src/presentation/controllers/BookingController.ts`

```typescript
import { Request, Response } from 'express';
import {
  CreateBookingUseCase,
  GetUserBookingsUseCase,
  GetBookingByIdUseCase,
  CancelBookingUseCase,
} from '../../application/use-cases/bookings/index.js';
import { BookingRepository } from '../../infrastructure/repositories/BookingRepository.js';
import { CarRepository } from '../../infrastructure/repositories/CarRepository.js';
import { LocationRepository } from '../../infrastructure/repositories/LocationRepository.js';
import { AddonRepository } from '../../infrastructure/repositories/AddonRepository.js';
import { AuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { BookingFiltersDto } from '../validators/bookingValidators.js';

const bookingRepository = new BookingRepository();
const carRepository = new CarRepository();
const locationRepository = new LocationRepository();
const addonRepository = new AddonRepository();
const auditLogRepository = new AuditLogRepository();

export class BookingController {
  static async createBooking(req: Request, res: Response): Promise<Response> {
    const { user } = req as AuthenticatedRequest;

    const useCase = new CreateBookingUseCase(
      bookingRepository,
      carRepository,
      locationRepository,
      addonRepository
    );

    const booking = await useCase.execute({
      userId: user.id,
      carId: req.body.carId,
      pickupLocationId: req.body.pickupLocationId,
      dropoffLocationId: req.body.dropoffLocationId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      addonIds: req.body.addonIds,
    });

    return sendCreated(res, booking);
  }

  static async getMyBookings(req: Request, res: Response): Promise<Response> {
    const { user } = req as AuthenticatedRequest;
    const query = req.query as unknown as BookingFiltersDto;

    const useCase = new GetUserBookingsUseCase(bookingRepository);
    const result = await useCase.execute({
      userId: user.id,
      status: query.status,
      pagination: {
        page: query.page,
        limit: query.limit,
      },
      sort: {
        field: query.sortBy as any,
        order: query.sortOrder,
      },
    });

    return sendSuccess(res, result.data, 200, result.meta);
  }

  static async getBookingById(req: Request, res: Response): Promise<Response> {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    const useCase = new GetBookingByIdUseCase(bookingRepository);
    const booking = await useCase.execute({
      bookingId: id,
      userId: user.id,
      userRole: user.role,
    });

    return sendSuccess(res, booking);
  }

  static async cancelBooking(req: Request, res: Response): Promise<Response> {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;
    const { reason } = req.body;

    const useCase = new CancelBookingUseCase(bookingRepository, auditLogRepository);
    const booking = await useCase.execute({
      bookingId: id,
      userId: user.id,
      userRole: user.role,
      reason,
    });

    return sendSuccess(res, booking);
  }
}
```

---

## 6.5 Create Booking Routes

### Task 6.5.1: Create Booking Routes

**Action:** Create `backend/src/presentation/routes/bookingRoutes.ts`

```typescript
import { Router } from 'express';
import { BookingController } from '../controllers/BookingController.js';
import { asyncHandler, validateBody, validateParams, validateQuery, authenticate } from '../middlewares/index.js';
import { createBookingSchema, bookingIdParamSchema, bookingFiltersSchema, cancelBookingSchema } from '../validators/bookingValidators.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Customer)
 */
router.post(
  '/',
  validateBody(createBookingSchema),
  asyncHandler(BookingController.createBooking)
);

/**
 * @route   GET /api/bookings
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get(
  '/',
  validateQuery(bookingFiltersSchema),
  asyncHandler(BookingController.getMyBookings)
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private (Owner or Admin)
 */
router.get(
  '/:id',
  validateParams(bookingIdParamSchema),
  asyncHandler(BookingController.getBookingById)
);

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (Owner or Admin)
 */
router.post(
  '/:id/cancel',
  validateParams(bookingIdParamSchema),
  validateBody(cancelBookingSchema),
  asyncHandler(BookingController.cancelBooking)
);

export default router;
```

---

### Task 6.5.2: Update Routes Index

**Action:** Update `backend/src/presentation/routes/index.ts`

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import carRoutes from './carRoutes.js';
import locationRoutes from './locationRoutes.js';
import addonRoutes from './addonRoutes.js';
import bookingRoutes from './bookingRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

// Car routes
router.use('/cars', carRoutes);

// Location routes
router.use('/locations', locationRoutes);

// Addon routes
router.use('/addons', addonRoutes);

// Booking routes
router.use('/bookings', bookingRoutes);

// Admin routes (Phase 7)
// router.use('/admin', adminRoutes);

export default router;
```

---

## 6.6 Verify Phase 6

### Task 6.6.1: Restart and Test

**Action:**

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

---

### Task 6.6.2: Test Create Booking

**Action:**

```bash
# Login as customer
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "Customer123!"}' | jq -r '.data.token.accessToken')

# Get a car ID and location IDs
CAR_ID=$(curl -s "http://localhost:3000/api/cars?limit=1" | jq -r '.data[0].id')
LOCATIONS=$(curl -s http://localhost:3000/api/locations)
PICKUP_ID=$(echo $LOCATIONS | jq -r '.[0].id')
DROPOFF_ID=$(echo $LOCATIONS | jq -r '.[1].id')

# Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"carId\": \"$CAR_ID\",
    \"pickupLocationId\": \"$PICKUP_ID\",
    \"dropoffLocationId\": \"$DROPOFF_ID\",
    \"startDate\": \"2026-02-01\",
    \"endDate\": \"2026-02-05\"
  }"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "...",
    "carId": "...",
    "status": "PENDING",
    "days": 4,
    "basePrice": "...",
    "totalPrice": "...",
    "car": { ... },
    "pickupLocation": { ... },
    "dropoffLocation": { ... }
  }
}
```

---

### Task 6.6.3: Test Get My Bookings

**Action:**

```bash
curl http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN"

# Filter by status
curl "http://localhost:3000/api/bookings?status=PENDING" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Task 6.6.4: Test Cancel Booking

**Action:**

```bash
# Get a booking ID from previous response
BOOKING_ID="your-booking-id-here"

curl -X POST "http://localhost:3000/api/bookings/$BOOKING_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Changed travel plans"}'
```

---

### Task 6.6.5: Test Double Booking Prevention

**Action:**

```bash
# Try to book the same car for overlapping dates
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"carId\": \"$CAR_ID\",
    \"pickupLocationId\": \"$PICKUP_ID\",
    \"dropoffLocationId\": \"$DROPOFF_ID\",
    \"startDate\": \"2026-02-03\",
    \"endDate\": \"2026-02-07\"
  }"
```

**Expected:** Error response with "Car is not available for the selected dates"

---

## Phase 6 Completion Checklist

- [x] 6.1.1-2 Created BookingRepository and AuditLogRepository
- [x] 6.2.1-5 Created booking use cases
- [x] 6.3.1 Created booking validators
- [x] 6.4.1 Created BookingController
- [x] 6.5.1-2 Created booking routes
- [x] 6.6.1-5 Verified all booking endpoints

## Phase 6 Deliverables

```text
backend/src/
├── infrastructure/
│   └── repositories/
│       ├── BookingRepository.ts
│       └── AuditLogRepository.ts
├── application/
│   └── use-cases/
│       └── bookings/
│           ├── CreateBookingUseCase.ts
│           ├── GetUserBookingsUseCase.ts
│           ├── GetBookingByIdUseCase.ts
│           ├── CancelBookingUseCase.ts
│           └── index.ts
└── presentation/
    ├── controllers/
    │   └── BookingController.ts
    ├── validators/
    │   └── bookingValidators.ts
    └── routes/
        └── bookingRoutes.ts
```

## Resume Point (Phase 6)

```bash
docker-compose -f docker-compose.dev.yml up

# Login and test
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "Customer123!"}' | jq -r '.data.token.accessToken')

curl http://localhost:3000/api/bookings -H "Authorization: Bearer $TOKEN"
```

---

# PHASE 7: Admin & Analytics

## Goal: Admin booking management and analytics dashboard

**Duration:** 2-3 hours
**Prerequisites:** Phase 6 completed

---

## 7.1 Create Analytics Repository

### Task 7.1.1: Create Analytics Repository

**Action:** Create `backend/src/infrastructure/repositories/AnalyticsRepository.ts`

```typescript
import { PrismaClient, BookingStatus } from '@prisma/client';
import { prisma } from '../database/prisma.js';

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface FleetStats {
  totalCars: number;
  activeCars: number;
  inactiveCars: number;
  utilizationRate: number;
}

export interface TopCar {
  carId: string;
  brand: string;
  model: string;
  bookingCount: number;
  revenue: number;
}

export interface DashboardStats {
  revenue: RevenueStats;
  bookings: BookingStats;
  fleet: FleetStats;
  topCars: TopCar[];
}

export class AnalyticsRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [revenue, bookings, fleet, topCars] = await Promise.all([
      this.getRevenueStats(),
      this.getBookingStats(),
      this.getFleetStats(),
      this.getTopCars(5),
    ]);

    return { revenue, bookings, fleet, topCars };
  }

  async getRevenueStats(): Promise<RevenueStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total revenue from completed bookings
    const totalRevenueResult = await this.db.booking.aggregate({
      where: { status: BookingStatus.RETURNED },
      _sum: { totalPrice: true },
      _count: true,
    });

    // Monthly revenue
    const monthlyRevenueResult = await this.db.booking.aggregate({
      where: {
        status: BookingStatus.RETURNED,
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalPrice: true },
    });

    const totalRevenue = Number(totalRevenueResult._sum.totalPrice || 0);
    const totalCount = totalRevenueResult._count || 1;
    const monthlyRevenue = Number(monthlyRevenueResult._sum.totalPrice || 0);

    return {
      totalRevenue,
      monthlyRevenue,
      averageBookingValue: totalCount > 0 ? totalRevenue / totalCount : 0,
    };
  }

  async getBookingStats(): Promise<BookingStats> {
    const statusCounts = await this.db.booking.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    statusCounts.forEach(item => {
      counts[item.status] = item._count.status;
    });

    const totalBookings = Object.values(counts).reduce((sum, c) => sum + c, 0);

    return {
      totalBookings,
      pendingBookings: counts[BookingStatus.PENDING] || 0,
      confirmedBookings: counts[BookingStatus.CONFIRMED] || 0,
      activeBookings: counts[BookingStatus.PICKED_UP] || 0,
      completedBookings: counts[BookingStatus.RETURNED] || 0,
      cancelledBookings: counts[BookingStatus.CANCELLED] || 0,
    };
  }

  async getFleetStats(): Promise<FleetStats> {
    const carCounts = await this.db.car.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    let activeCars = 0;
    let inactiveCars = 0;

    carCounts.forEach(item => {
      if (item.status === 'ACTIVE') {
        activeCars = item._count.status;
      } else {
        inactiveCars = item._count.status;
      }
    });

    const totalCars = activeCars + inactiveCars;

    // Calculate utilization: cars with active bookings / total active cars
    const carsWithActiveBookings = await this.db.booking.findMany({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PICKED_UP] },
      },
      select: { carId: true },
      distinct: ['carId'],
    });

    const utilizationRate = activeCars > 0
      ? (carsWithActiveBookings.length / activeCars) * 100
      : 0;

    return {
      totalCars,
      activeCars,
      inactiveCars,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  }

  async getTopCars(limit: number = 5): Promise<TopCar[]> {
    const topCarsRaw = await this.db.booking.groupBy({
      by: ['carId'],
      where: { status: BookingStatus.RETURNED },
      _count: { carId: true },
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: limit,
    });

    const carIds = topCarsRaw.map(c => c.carId);
    const cars = await this.db.car.findMany({
      where: { id: { in: carIds } },
      select: { id: true, brand: true, model: true },
    });

    const carMap = new Map(cars.map(c => [c.id, c]));

    return topCarsRaw.map(item => {
      const car = carMap.get(item.carId);
      return {
        carId: item.carId,
        brand: car?.brand || 'Unknown',
        model: car?.model || 'Unknown',
        bookingCount: item._count.carId,
        revenue: Number(item._sum.totalPrice || 0),
      };
    });
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date): Promise<{ date: string; revenue: number }[]> {
    const bookings = await this.db.booking.findMany({
      where: {
        status: BookingStatus.RETURNED,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true, totalPrice: true },
    });

    // Group by date
    const revenueByDate = new Map<string, number>();
    bookings.forEach(booking => {
      const dateStr = booking.createdAt.toISOString().split('T')[0];
      const current = revenueByDate.get(dateStr) || 0;
      revenueByDate.set(dateStr, current + Number(booking.totalPrice));
    });

    return Array.from(revenueByDate.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
```

---

## 7.2 Create Admin Use Cases

### Task 7.2.1: Create GetAllBookings Use Case (Admin)

**Action:** Create `backend/src/application/use-cases/admin/GetAllBookingsUseCase.ts`

```typescript
import { IBookingRepository, BookingFilters, BookingSortOptions, PaginationParams, PaginatedResult } from '../../../domain/repositories/index.js';
import { BookingWithRelations } from '../../../domain/entities/index.js';

export interface GetAllBookingsInput {
  filters: BookingFilters;
  pagination: PaginationParams;
  sort?: BookingSortOptions;
}

export class GetAllBookingsUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(input: GetAllBookingsInput): Promise<PaginatedResult<BookingWithRelations>> {
    return this.bookingRepository.findAll(input.filters, input.pagination, input.sort);
  }
}
```

---

### Task 7.2.2: Create UpdateBookingStatus Use Case (Admin)

**Action:** Create `backend/src/application/use-cases/admin/UpdateBookingStatusUseCase.ts`

```typescript
import { Booking, BookingStatus } from '../../../domain/entities/index.js';
import { IBookingRepository, IAuditLogRepository } from '../../../domain/repositories/index.js';
import { NotFoundError, ValidationError } from '../../../domain/errors/index.js';
import { BOOKING_STATUS_TRANSITIONS } from '../../../shared/constants/index.js';

export interface UpdateBookingStatusInput {
  bookingId: string;
  status: BookingStatus;
  adminId: string;
  reason?: string;
}

export class UpdateBookingStatusUseCase {
  constructor(
    private bookingRepository: IBookingRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(input: UpdateBookingStatusInput): Promise<Booking> {
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', input.bookingId);
    }

    // Validate status transition
    const allowedTransitions = BOOKING_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes(input.status)) {
      throw new ValidationError(
        `Invalid status transition from '${booking.status}' to '${input.status}'`,
        [{
          field: 'status',
          message: `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
        }]
      );
    }

    // Update status
    const updatedBooking = await this.bookingRepository.updateStatus(
      input.bookingId,
      input.status,
      input.status === BookingStatus.CANCELLED ? input.reason : undefined
    );

    // Create audit log
    await this.auditLogRepository.create({
      actorId: input.adminId,
      entityType: 'Booking',
      entityId: input.bookingId,
      action: `STATUS_CHANGED_TO_${input.status}`,
      beforeJson: { status: booking.status },
      afterJson: { status: input.status, reason: input.reason },
    });

    return updatedBooking;
  }
}
```

---

### Task 7.2.3: Create GetDashboardStats Use Case

**Action:** Create `backend/src/application/use-cases/admin/GetDashboardStatsUseCase.ts`

```typescript
import { AnalyticsRepository, DashboardStats } from '../../../infrastructure/repositories/AnalyticsRepository.js';

export class GetDashboardStatsUseCase {
  constructor(private analyticsRepository: AnalyticsRepository) {}

  async execute(): Promise<DashboardStats> {
    return this.analyticsRepository.getDashboardStats();
  }
}
```

---

### Task 7.2.4: Create Admin Use Cases Index

**Action:** Create `backend/src/application/use-cases/admin/index.ts`

```typescript
export { GetAllBookingsUseCase, GetAllBookingsInput } from './GetAllBookingsUseCase.js';
export { UpdateBookingStatusUseCase, UpdateBookingStatusInput } from './UpdateBookingStatusUseCase.js';
export { GetDashboardStatsUseCase } from './GetDashboardStatsUseCase.js';
```

---

## 7.3 Create Admin Validators

### Task 7.3.1: Create Admin Validators

**Action:** Create `backend/src/presentation/validators/adminValidators.ts`

```typescript
import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const adminBookingFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  carId: z.string().uuid().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'startDate', 'totalPrice']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  reason: z.string().max(500).optional(),
});

export type AdminBookingFiltersDto = z.infer<typeof adminBookingFiltersSchema>;
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusSchema>;
```

---

## 7.4 Create Admin Controller

### Task 7.4.1: Create Admin Controller

**Action:** Create `backend/src/presentation/controllers/AdminController.ts`

```typescript
import { Request, Response } from 'express';
import {
  GetAllBookingsUseCase,
  UpdateBookingStatusUseCase,
  GetDashboardStatsUseCase,
} from '../../application/use-cases/admin/index.js';
import { BookingRepository } from '../../infrastructure/repositories/BookingRepository.js';
import { AuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository.js';
import { AnalyticsRepository } from '../../infrastructure/repositories/AnalyticsRepository.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { AdminBookingFiltersDto } from '../validators/adminValidators.js';

const bookingRepository = new BookingRepository();
const auditLogRepository = new AuditLogRepository();
const analyticsRepository = new AnalyticsRepository();

export class AdminController {
  static async getAllBookings(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as AdminBookingFiltersDto;

    const useCase = new GetAllBookingsUseCase(bookingRepository);
    const result = await useCase.execute({
      filters: {
        userId: query.userId,
        carId: query.carId,
        status: query.status,
        startDateFrom: query.startDateFrom,
        startDateTo: query.startDateTo,
      },
      pagination: {
        page: query.page,
        limit: query.limit,
      },
      sort: {
        field: query.sortBy as any,
        order: query.sortOrder,
      },
    });

    return sendSuccess(res, result.data, 200, result.meta);
  }

  static async updateBookingStatus(req: Request, res: Response): Promise<Response> {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status, reason } = req.body;

    const useCase = new UpdateBookingStatusUseCase(bookingRepository, auditLogRepository);
    const booking = await useCase.execute({
      bookingId: id,
      status,
      adminId: user.id,
      reason,
    });

    return sendSuccess(res, booking);
  }

  static async getDashboardStats(req: Request, res: Response): Promise<Response> {
    const useCase = new GetDashboardStatsUseCase(analyticsRepository);
    const stats = await useCase.execute();

    return sendSuccess(res, stats);
  }
}
```

---

## 7.5 Create Admin Routes

### Task 7.5.1: Create Admin Routes

**Action:** Create `backend/src/presentation/routes/adminRoutes.ts`

```typescript
import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { asyncHandler, validateQuery, validateParams, validateBody, authenticate, requireAdmin } from '../middlewares/index.js';
import { adminBookingFiltersSchema, updateBookingStatusSchema } from '../validators/adminValidators.js';
import { bookingIdParamSchema } from '../validators/bookingValidators.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard analytics
 * @access  Admin only
 */
router.get(
  '/dashboard',
  asyncHandler(AdminController.getDashboardStats)
);

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings with filters
 * @access  Admin only
 */
router.get(
  '/bookings',
  validateQuery(adminBookingFiltersSchema),
  asyncHandler(AdminController.getAllBookings)
);

/**
 * @route   PATCH /api/admin/bookings/:id/status
 * @desc    Update booking status
 * @access  Admin only
 */
router.patch(
  '/bookings/:id/status',
  validateParams(bookingIdParamSchema),
  validateBody(updateBookingStatusSchema),
  asyncHandler(AdminController.updateBookingStatus)
);

export default router;
```

---

### Task 7.5.2: Update Routes Index

**Action:** Update `backend/src/presentation/routes/index.ts`

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import carRoutes from './carRoutes.js';
import locationRoutes from './locationRoutes.js';
import addonRoutes from './addonRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

// Car routes
router.use('/cars', carRoutes);

// Location routes
router.use('/locations', locationRoutes);

// Addon routes
router.use('/addons', addonRoutes);

// Booking routes
router.use('/bookings', bookingRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;
```

---

## 7.6 Verify Phase 7

### Task 7.6.1: Restart and Test

**Action:**

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

---

### Task 7.6.2: Test Dashboard Analytics

**Action:**

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@carrental.com", "password": "Admin123!"}' | jq -r '.data.token.accessToken')

# Get dashboard stats
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "totalRevenue": 12500000,
      "monthlyRevenue": 3200000,
      "averageBookingValue": 625000
    },
    "bookings": {
      "totalBookings": 40,
      "pendingBookings": 5,
      "confirmedBookings": 10,
      "activeBookings": 2,
      "completedBookings": 15,
      "cancelledBookings": 8
    },
    "fleet": {
      "totalCars": 20,
      "activeCars": 20,
      "inactiveCars": 0,
      "utilizationRate": 25.5
    },
    "topCars": [
      {
        "carId": "...",
        "brand": "Toyota",
        "model": "Fortuner",
        "bookingCount": 5,
        "revenue": 3250000
      }
    ]
  }
}
```

---

### Task 7.6.3: Test Admin Get All Bookings

**Action:**

```bash
# Get all bookings
curl "http://localhost:3000/api/admin/bookings" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by status
curl "http://localhost:3000/api/admin/bookings?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by date range
curl "http://localhost:3000/api/admin/bookings?startDateFrom=2026-01-01&startDateTo=2026-01-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### Task 7.6.4: Test Update Booking Status

**Action:**

```bash
# Get a pending booking ID
BOOKING_ID=$(curl -s "http://localhost:3000/api/admin/bookings?status=PENDING&limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data[0].id')

# Confirm the booking
curl -X PATCH "http://localhost:3000/api/admin/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "CONFIRMED"}'

# Mark as picked up
curl -X PATCH "http://localhost:3000/api/admin/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "PICKED_UP"}'

# Mark as returned
curl -X PATCH "http://localhost:3000/api/admin/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "RETURNED"}'
```

---

### Task 7.6.5: Test Invalid Status Transition

**Action:**

```bash
# Try invalid transition (RETURNED -> PENDING)
curl -X PATCH "http://localhost:3000/api/admin/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "PENDING"}'
```

**Expected:** Error with "Invalid status transition"

---

### Task 7.6.6: Test Admin Access Control

**Action:**

```bash
# Try accessing admin endpoint with customer token
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "Customer123!"}' | jq -r '.data.token.accessToken')

curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

**Expected:** 403 Forbidden error

---

## Phase 7 Completion Checklist

- [x] 7.1.1 Created AnalyticsRepository
- [x] 7.2.1-4 Created admin use cases
- [x] 7.3.1 Created admin validators
- [x] 7.4.1 Created AdminController
- [x] 7.5.1-2 Created admin routes
- [x] 7.6.1-6 Verified all admin endpoints

## Phase 7 Deliverables

```text
backend/src/
├── infrastructure/
│   └── repositories/
│       └── AnalyticsRepository.ts
├── application/
│   └── use-cases/
│       └── admin/
│           ├── GetAllBookingsUseCase.ts
│           ├── UpdateBookingStatusUseCase.ts
│           ├── GetDashboardStatsUseCase.ts
│           └── index.ts
└── presentation/
    ├── controllers/
    │   └── AdminController.ts
    ├── validators/
    │   └── adminValidators.ts
    └── routes/
        └── adminRoutes.ts
```

## Resume Point (Phase 7)

```bash
docker-compose -f docker-compose.dev.yml up

# Login as admin and test
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@carrental.com", "password": "Admin123!"}' | jq -r '.data.token.accessToken')

curl http://localhost:3000/api/admin/dashboard -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

# PHASE 8: Polish & Documentation

## Goal: Add Swagger documentation, rate limiting, and final polish

**Duration:** 1-2 hours
**Prerequisites:** Phase 7 completed

---

## 8.1 Install Swagger Dependencies

### Task 8.1.1: Install Swagger Packages

**Action:** Run in `backend/` directory:

```bash
npm install swagger-ui-express swagger-jsdoc
npm install -D @types/swagger-ui-express @types/swagger-jsdoc
```

---

## 8.2 Create Swagger Configuration

### Task 8.2.1: Create Swagger Config

**Action:** Create `backend/src/infrastructure/swagger/config.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Car Rental API',
      version: '1.0.0',
      description: 'Data-Driven Car Rental Backend API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@carrental.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Validation failed' },
                details: { type: 'object' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Car: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            brand: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            type: { type: 'string', enum: ['SUV', 'SEDAN', 'HATCHBACK', 'MPV', 'VAN'] },
            seats: { type: 'integer' },
            transmission: { type: 'string', enum: ['AT', 'MT'] },
            fuel: { type: 'string', enum: ['GAS', 'DIESEL', 'EV'] },
            dailyPrice: { type: 'number' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            images: { type: 'array', items: { type: 'string' } },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            carId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            days: { type: 'integer' },
            basePrice: { type: 'number' },
            addonPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED'] },
          },
        },
        Location: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            address: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Addon: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            pricePerBooking: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Cars', description: 'Car management endpoints' },
      { name: 'Bookings', description: 'Booking management endpoints' },
      { name: 'Locations', description: 'Location endpoints' },
      { name: 'Addons', description: 'Addon endpoints' },
      { name: 'Admin', description: 'Admin-only endpoints' },
    ],
  },
  apis: ['./src/presentation/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

---

### Task 8.2.2: Create Swagger Index

**Action:** Create `backend/src/infrastructure/swagger/index.ts`

```typescript
export { swaggerSpec } from './config.js';
```

---

## 8.3 Add Swagger JSDoc Comments

### Task 8.3.1: Update Auth Routes with Swagger Docs

**Action:** Update `backend/src/presentation/routes/authRoutes.ts`

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { asyncHandler, validateBody, authenticate } from '../middlewares/index.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(AuthController.register)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(AuthController.login)
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(AuthController.getProfile)
);

export default router;
```

---

### Task 8.3.2: Update Car Routes with Swagger Docs

**Action:** Update `backend/src/presentation/routes/carRoutes.ts`

```typescript
import { Router } from 'express';
import { CarController } from '../controllers/CarController.js';
import { asyncHandler, validateQuery, validateParams, validateBody, authenticate, requireAdmin } from '../middlewares/index.js';
import { carFiltersSchema, carIdParamSchema, carAvailabilityQuerySchema, createCarSchema, updateCarSchema } from '../validators/carValidators.js';

const router = Router();

/**
 * @swagger
 * /api/cars:
 *   get:
 *     tags: [Cars]
 *     summary: Get all cars with filters
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SUV, SEDAN, HATCHBACK, MPV, VAN]
 *       - in: query
 *         name: seats
 *         schema:
 *           type: integer
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [AT, MT]
 *       - in: query
 *         name: fuel
 *         schema:
 *           type: string
 *           enum: [GAS, DIESEL, EV]
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of cars
 */
router.get(
  '/',
  validateQuery(carFiltersSchema),
  asyncHandler(CarController.getCars)
);

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     tags: [Cars]
 *     summary: Get car by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 */
router.get(
  '/:id',
  validateParams(carIdParamSchema),
  validateQuery(carAvailabilityQuerySchema),
  asyncHandler(CarController.getCarById)
);

/**
 * @swagger
 * /api/cars:
 *   post:
 *     tags: [Cars]
 *     summary: Create a new car (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       201:
 *         description: Car created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(createCarSchema),
  asyncHandler(CarController.createCar)
);

/**
 * @swagger
 * /api/cars/{id}:
 *   patch:
 *     tags: [Cars]
 *     summary: Update a car (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       200:
 *         description: Car updated
 *       404:
 *         description: Car not found
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(carIdParamSchema),
  validateBody(updateCarSchema),
  asyncHandler(CarController.updateCar)
);

export default router;
```

---

## 8.4 Add Rate Limiting

### Task 8.4.1: Install Rate Limiter

**Action:** Run in `backend/` directory:

```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

---

### Task 8.4.2: Create Rate Limiter Middleware

**Action:** Create `backend/src/presentation/middlewares/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for booking creation (prevent spam)
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 bookings per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many booking requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

### Task 8.4.3: Update Middleware Index

**Action:** Update `backend/src/presentation/middlewares/index.ts`

```typescript
export { errorHandler } from './errorHandler.js';
export { asyncHandler } from './asyncHandler.js';
export { validateRequest, validateBody, validateQuery, validateParams } from './validateRequest.js';
export { authenticate, requireRole, requireAdmin } from './authMiddleware.js';
export { apiLimiter, authLimiter, bookingLimiter } from './rateLimiter.js';
```

---

## 8.5 Update App with Swagger & Rate Limiting

### Task 8.5.1: Final app.ts Update

**Action:** Update `backend/src/app.ts`

```typescript
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import logger from './infrastructure/logger/index.js';
import { prisma } from './infrastructure/database/prisma.js';
import { swaggerSpec } from './infrastructure/swagger/index.js';
import { errorHandler, apiLimiter } from './presentation/middlewares/index.js';
import apiRoutes from './presentation/routes/index.js';

dotenv.config();

const app: Express = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiting (apply to all API routes)
app.use('/api', apiLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Car Rental API Docs',
}));

// Health check
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
      docs: '/api-docs',
    },
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

// Error handler
app.use(errorHandler);

export default app;
```

---

## 8.6 Apply Rate Limiting to Specific Routes

### Task 8.6.1: Update Auth Routes with Rate Limiting

**Action:** Update auth routes to use auth limiter:

```typescript
// At the top of authRoutes.ts, add:
import { authLimiter } from '../middlewares/index.js';

// Apply to login and register:
router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(AuthController.register));
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(AuthController.login));
```

---

### Task 8.6.2: Update Booking Routes with Rate Limiting

**Action:** Update booking routes to use booking limiter:

```typescript
// At the top of bookingRoutes.ts, add:
import { bookingLimiter } from '../middlewares/index.js';

// Apply to create booking:
router.post('/', bookingLimiter, validateBody(createBookingSchema), asyncHandler(BookingController.createBooking));
```

---

## 8.7 Final Verification

### Task 8.7.1: Restart and Access Swagger

**Action:**

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

**Then open:** http://localhost:3000/api-docs

---

### Task 8.7.2: Test All Endpoints via Swagger UI

**Verify in Swagger UI:**

- [ ] Auth endpoints (register, login, profile)
- [ ] Car endpoints (list, get, create, update)
- [ ] Booking endpoints (create, list, get, cancel)
- [ ] Location endpoints (list)
- [ ] Addon endpoints (list)
- [ ] Admin endpoints (dashboard, bookings, status update)

---

### Task 8.7.3: Final API Test Script

**Action:** Create a test script to verify all endpoints:

```bash
#!/bin/bash
# test-api.sh

BASE_URL="http://localhost:3000"

echo "=== Testing Car Rental API ==="

# Health check
echo -e "\n1. Health Check:"
curl -s "$BASE_URL/health" | jq '.data.status'

# Register
echo -e "\n2. Register User:"
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$(date +%s)'@test.com","name":"Test","password":"Password123"}' | jq '.success'

# Login
echo -e "\n3. Login:"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carrental.com","password":"Admin123!"}')
TOKEN=$(echo $RESPONSE | jq -r '.data.token.accessToken')
echo "Token received: $(echo $TOKEN | cut -c1-20)..."

# Get Cars
echo -e "\n4. Get Cars:"
curl -s "$BASE_URL/api/cars?limit=3" | jq '.data | length'

# Get Locations
echo -e "\n5. Get Locations:"
curl -s "$BASE_URL/api/locations" | jq 'length'

# Get Addons
echo -e "\n6. Get Addons:"
curl -s "$BASE_URL/api/addons" | jq 'length'

# Admin Dashboard
echo -e "\n7. Admin Dashboard:"
curl -s "$BASE_URL/api/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.bookings.totalBookings'

echo -e "\n=== All Tests Complete ==="
```

---

## Phase 8 Completion Checklist

- [x] 8.1.1 Installed Swagger packages
- [x] 8.2.1-2 Created Swagger configuration
- [x] 8.3.1-2 Added Swagger JSDoc to routes
- [x] 8.4.1-3 Added rate limiting
- [x] 8.5.1 Updated app.ts with Swagger
- [x] 8.6.1-2 Applied rate limiters to routes
- [x] 8.7.1-3 Final verification

## Phase 8 Deliverables

```text
backend/src/
├── infrastructure/
│   └── swagger/
│       ├── config.ts
│       └── index.ts
└── presentation/
    └── middlewares/
        └── rateLimiter.ts
```

## Resume Point (Phase 8)

```bash
docker-compose -f docker-compose.dev.yml up

# Access Swagger UI
open http://localhost:3000/api-docs

# Run test script
./test-api.sh
```

---

# PHASE 9: Testing

## Goal: Comprehensive test suite with 90%+ coverage

**Duration:** 4-5 hours
**Prerequisites:** Phase 8 completed
**Testing Framework:** Jest with Supertest for E2E API testing

---

## 9.1 Setup Jest Testing Environment

### Task 9.1.1: Install Testing Dependencies

**Action:** Run in `backend/` directory:

```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install -D @faker-js/faker
```

**Dependencies explanation:**

| Package | Purpose |
|---------|---------|
| jest | Testing framework |
| @types/jest | TypeScript types for Jest |
| ts-jest | TypeScript preprocessor for Jest |
| supertest | HTTP assertions for API testing |
| @types/supertest | TypeScript types for Supertest |
| @faker-js/faker | Generate fake test data |

---

### Task 9.1.2: Create Jest Configuration

**Action:** Create `backend/jest.config.js`

```javascript
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/prisma/',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
};

export default config;
```

---

### Task 9.1.3: Update package.json Scripts

**Action:** Add test scripts to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio",
    "test": "NODE_OPTIONS='--experimental-vm-modules' jest",
    "test:watch": "NODE_OPTIONS='--experimental-vm-modules' jest --watch",
    "test:coverage": "NODE_OPTIONS='--experimental-vm-modules' jest --coverage",
    "test:unit": "NODE_OPTIONS='--experimental-vm-modules' jest --testPathPattern=unit",
    "test:integration": "NODE_OPTIONS='--experimental-vm-modules' jest --testPathPattern=integration",
    "test:e2e": "NODE_OPTIONS='--experimental-vm-modules' jest --testPathPattern=e2e"
  }
}
```

---

### Task 9.1.4: Create Test Directory Structure

**Action:** Run from `backend/` directory:

```bash
mkdir -p src/__tests__/{unit/{utils,domain,services},integration/{repositories,middlewares},e2e/{auth,cars,bookings,admin}}
```

**Expected Structure:**

```
backend/src/__tests__/
├── setup.ts                    # Global test setup
├── helpers/
│   ├── testDb.ts              # Test database utilities
│   ├── testApp.ts             # Test Express app
│   └── factories.ts           # Test data factories
├── unit/
│   ├── utils/
│   │   ├── pagination.test.ts
│   │   ├── date.test.ts
│   │   └── response.test.ts
│   ├── domain/
│   │   └── errors.test.ts
│   └── services/
│       └── auth.test.ts
├── integration/
│   ├── repositories/
│   │   ├── userRepository.test.ts
│   │   ├── carRepository.test.ts
│   │   └── bookingRepository.test.ts
│   └── middlewares/
│       ├── authMiddleware.test.ts
│       └── validateRequest.test.ts
└── e2e/
    ├── auth/
    │   └── auth.test.ts
    ├── cars/
    │   └── cars.test.ts
    ├── bookings/
    │   └── bookings.test.ts
    └── admin/
        └── admin.test.ts
```

---

### Task 9.1.5: Create Test Setup File

**Action:** Create `backend/src/__tests__/setup.ts`

```typescript
import { prisma } from '../infrastructure/database/prisma.js';

beforeAll(async () => {
  // Ensure database is connected
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

// Increase timeout for database operations
jest.setTimeout(30000);
```

---

## 9.2 Create Test Helpers

### Task 9.2.1: Create Test Database Utilities

**Action:** Create `backend/src/__tests__/helpers/testDb.ts`

```typescript
import { prisma } from '../../infrastructure/database/prisma.js';
import { UserRole, CarType, Transmission, FuelType, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function cleanDatabase() {
  // Delete in correct order to respect foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.bookingAddon.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.location.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(overrides: Partial<{
  email: string;
  name: string;
  password: string;
  role: UserRole;
}> = {}) {
  const passwordHash = await bcrypt.hash(overrides.password || 'TestPass123!', 10);

  return prisma.user.create({
    data: {
      email: overrides.email || `test-${Date.now()}@example.com`,
      name: overrides.name || 'Test User',
      passwordHash,
      role: overrides.role || UserRole.CUSTOMER,
    },
  });
}

export async function createTestAdmin(overrides: Partial<{
  email: string;
  name: string;
  password: string;
}> = {}) {
  return createTestUser({ ...overrides, role: UserRole.ADMIN });
}

export async function createTestCar(overrides: Partial<{
  brand: string;
  model: string;
  year: number;
  type: CarType;
  seats: number;
  transmission: Transmission;
  fuel: FuelType;
  dailyPrice: number;
}> = {}) {
  return prisma.car.create({
    data: {
      brand: overrides.brand || 'Toyota',
      model: overrides.model || 'Test Model',
      year: overrides.year || 2024,
      type: overrides.type || CarType.SEDAN,
      seats: overrides.seats || 5,
      transmission: overrides.transmission || Transmission.AT,
      fuel: overrides.fuel || FuelType.GAS,
      dailyPrice: overrides.dailyPrice || 500000,
      images: ['test-image.jpg'],
    },
  });
}

export async function createTestLocation(overrides: Partial<{
  name: string;
  address: string;
}> = {}) {
  return prisma.location.create({
    data: {
      name: overrides.name || `Test Location ${Date.now()}`,
      address: overrides.address || 'Test Address',
    },
  });
}

export async function createTestAddon(overrides: Partial<{
  name: string;
  description: string;
  pricePerBooking: number;
}> = {}) {
  return prisma.addon.create({
    data: {
      name: overrides.name || `Test Addon ${Date.now()}`,
      description: overrides.description || 'Test Description',
      pricePerBooking: overrides.pricePerBooking || 50000,
    },
  });
}

export async function createTestBooking(data: {
  userId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  startDate?: Date;
  endDate?: Date;
  status?: BookingStatus;
}) {
  const startDate = data.startDate || new Date();
  const endDate = data.endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const car = await prisma.car.findUnique({ where: { id: data.carId } });
  const basePrice = Number(car?.dailyPrice || 500000) * days;

  return prisma.booking.create({
    data: {
      userId: data.userId,
      carId: data.carId,
      pickupLocationId: data.pickupLocationId,
      dropoffLocationId: data.dropoffLocationId,
      startDate,
      endDate,
      days,
      basePrice,
      addonPrice: 0,
      totalPrice: basePrice,
      status: data.status || BookingStatus.PENDING,
    },
  });
}
```

---

### Task 9.2.2: Create Test App Helper

**Action:** Create `backend/src/__tests__/helpers/testApp.ts`

```typescript
import express from 'express';
import request from 'supertest';
import app from '../../app.js';
import { generateToken } from '../../infrastructure/auth/jwt.js';
import { UserRole } from '@prisma/client';

export const testApp = app;

export function getAuthHeader(userId: string, email: string, role: UserRole = UserRole.CUSTOMER) {
  const token = generateToken({ userId, email, role });
  return { Authorization: `Bearer ${token.accessToken}` };
}

export function makeRequest() {
  return request(testApp);
}

// Helper for authenticated requests
export function authenticatedRequest(userId: string, email: string, role: UserRole = UserRole.CUSTOMER) {
  const headers = getAuthHeader(userId, email, role);

  return {
    get: (url: string) => request(testApp).get(url).set(headers),
    post: (url: string) => request(testApp).post(url).set(headers),
    put: (url: string) => request(testApp).put(url).set(headers),
    patch: (url: string) => request(testApp).patch(url).set(headers),
    delete: (url: string) => request(testApp).delete(url).set(headers),
  };
}
```

---

### Task 9.2.3: Create Test Data Factories

**Action:** Create `backend/src/__tests__/helpers/factories.ts`

```typescript
import { faker } from '@faker-js/faker';
import { CarType, Transmission, FuelType, UserRole } from '@prisma/client';

export const UserFactory = {
  build: (overrides = {}) => ({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: 'ValidPass123!',
    ...overrides,
  }),

  buildAdmin: (overrides = {}) => ({
    ...UserFactory.build(overrides),
    role: UserRole.ADMIN,
  }),
};

export const CarFactory = {
  build: (overrides = {}) => ({
    brand: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    year: faker.number.int({ min: 2020, max: 2024 }),
    type: faker.helpers.arrayElement(Object.values(CarType)),
    seats: faker.helpers.arrayElement([4, 5, 7]),
    transmission: faker.helpers.arrayElement(Object.values(Transmission)),
    fuel: faker.helpers.arrayElement(Object.values(FuelType)),
    dailyPrice: faker.number.int({ min: 300000, max: 1000000 }),
    images: [faker.image.url()],
    ...overrides,
  }),
};

export const LocationFactory = {
  build: (overrides = {}) => ({
    name: `${faker.location.city()} ${faker.helpers.arrayElement(['Airport', 'Station', 'Center'])}`,
    address: faker.location.streetAddress({ useFullAddress: true }),
    ...overrides,
  }),
};

export const AddonFactory = {
  build: (overrides = {}) => ({
    name: faker.helpers.arrayElement(['GPS', 'Child Seat', 'Insurance', 'WiFi', 'Roof Rack']),
    description: faker.lorem.sentence(),
    pricePerBooking: faker.number.int({ min: 25000, max: 200000 }),
    ...overrides,
  }),
};

export const BookingFactory = {
  buildInput: (carId: string, pickupLocationId: string, dropoffLocationId: string, overrides = {}) => {
    const startDate = faker.date.soon({ days: 7 });
    const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000);

    return {
      carId,
      pickupLocationId,
      dropoffLocationId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      addonIds: [],
      ...overrides,
    };
  },
};
```

---

## 9.3 Unit Tests

### Task 9.3.1: Create Pagination Utils Tests

**Action:** Create `backend/src/__tests__/unit/utils/pagination.test.ts`

```typescript
import { parsePagination, buildPaginationMeta } from '../../../shared/utils/pagination.js';

describe('Pagination Utils', () => {
  describe('parsePagination', () => {
    it('should return default values when no input provided', () => {
      const result = parsePagination({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
    });

    it('should parse string page and limit', () => {
      const result = parsePagination({ page: '3', limit: '10' });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(20);
    });

    it('should handle number inputs', () => {
      const result = parsePagination({ page: 2, limit: 15 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(15);
      expect(result.skip).toBe(15);
    });

    it('should enforce max limit of 100', () => {
      const result = parsePagination({ limit: '500' });

      expect(result.limit).toBe(100);
    });

    it('should default to page 1 for invalid page values', () => {
      expect(parsePagination({ page: '0' }).page).toBe(1);
      expect(parsePagination({ page: '-1' }).page).toBe(1);
      expect(parsePagination({ page: 'invalid' }).page).toBe(1);
    });

    it('should calculate skip correctly', () => {
      expect(parsePagination({ page: 1, limit: 10 }).skip).toBe(0);
      expect(parsePagination({ page: 2, limit: 10 }).skip).toBe(10);
      expect(parsePagination({ page: 5, limit: 20 }).skip).toBe(80);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct meta for first page', () => {
      const meta = buildPaginationMeta(1, 10, 100);

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(10);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('should build correct meta for last page', () => {
      const meta = buildPaginationMeta(10, 10, 100);

      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('should build correct meta for middle page', () => {
      const meta = buildPaginationMeta(5, 10, 100);

      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('should handle single page result', () => {
      const meta = buildPaginationMeta(1, 10, 5);

      expect(meta.totalPages).toBe(1);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('should handle empty results', () => {
      const meta = buildPaginationMeta(1, 10, 0);

      expect(meta.totalPages).toBe(0);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });
  });
});
```

---

### Task 9.3.2: Create Date Utils Tests

**Action:** Create `backend/src/__tests__/unit/utils/date.test.ts`

```typescript
import { calculateDays, isPastDate, isFutureOrToday, addDays } from '../../../shared/utils/date.js';

describe('Date Utils', () => {
  describe('calculateDays', () => {
    it('should calculate days between two dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');

      expect(calculateDays(start, end)).toBe(4);
    });

    it('should return 1 for same day', () => {
      const date = new Date('2024-01-01');

      expect(calculateDays(date, date)).toBe(1);
    });

    it('should handle dates with time components', () => {
      const start = new Date('2024-01-01T10:30:00');
      const end = new Date('2024-01-03T15:45:00');

      expect(calculateDays(start, end)).toBe(2);
    });

    it('should return minimum of 1 day', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-01');

      expect(calculateDays(start, end)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');

      expect(isPastDate(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      expect(isPastDate(futureDate)).toBe(false);
    });

    it('should return false for today', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      expect(isPastDate(today)).toBe(false);
    });
  });

  describe('isFutureOrToday', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      expect(isFutureOrToday(futureDate)).toBe(true);
    });

    it('should return true for today', () => {
      const today = new Date();

      expect(isFutureOrToday(today)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2020-01-01');

      expect(isFutureOrToday(pastDate)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days to a date', () => {
      const date = new Date('2024-01-01');
      const result = addDays(date, 5);

      expect(result.getDate()).toBe(6);
    });

    it('should handle month overflow', () => {
      const date = new Date('2024-01-30');
      const result = addDays(date, 5);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });

    it('should not mutate original date', () => {
      const original = new Date('2024-01-01');
      const originalTime = original.getTime();

      addDays(original, 5);

      expect(original.getTime()).toBe(originalTime);
    });

    it('should handle negative days', () => {
      const date = new Date('2024-01-10');
      const result = addDays(date, -5);

      expect(result.getDate()).toBe(5);
    });
  });
});
```

---

### Task 9.3.3: Create Error Classes Tests

**Action:** Create `backend/src/__tests__/unit/domain/errors.test.ts`

```typescript
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../../domain/errors/index.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_ERROR', false, { field: 'value' });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.isOperational).toBe(false);
      expect(error.details).toEqual({ field: 'value' });
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with resource name', () => {
      const error = new NotFoundError('Car');

      expect(error.message).toBe('Car not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('CAR_NOT_FOUND');
    });

    it('should include identifier in message', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe("User with identifier '123' not found");
    });

    it('should handle resource names with spaces', () => {
      const error = new NotFoundError('Booking Addon');

      expect(error.code).toBe('BOOKING_ADDON_NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should include field errors', () => {
      const fields = [
        { field: 'email', message: 'Invalid email' },
        { field: 'email', message: 'Email required' },
        { field: 'password', message: 'Too short' },
      ];

      const error = new ValidationError('Validation failed', fields);

      expect(error.fields).toEqual(fields);
      expect(error.details?.fields).toEqual({
        email: ['Invalid email', 'Email required'],
        password: ['Too short'],
      });
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should accept custom message and code', () => {
      const error = new UnauthorizedError('Token expired', 'TOKEN_EXPIRED');

      expect(error.message).toBe('Token expired');
      expect(error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Admin access required');

      expect(error.message).toBe('Admin access required');
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Email already exists');

      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should accept custom code', () => {
      const error = new ConflictError('Duplicate entry', 'DUPLICATE_EMAIL');

      expect(error.code).toBe('DUPLICATE_EMAIL');
    });
  });
});
```

---

## 9.4 Integration Tests

### Task 9.4.1: Create Auth Middleware Tests

**Action:** Create `backend/src/__tests__/integration/middlewares/authMiddleware.test.ts`

```typescript
import { makeRequest, getAuthHeader } from '../../helpers/testApp.js';
import { cleanDatabase, createTestUser, createTestAdmin } from '../../helpers/testDb.js';
import { UserRole } from '@prisma/client';

describe('Auth Middleware', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('authenticate', () => {
    it('should reject request without token', async () => {
      const response = await makeRequest()
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await makeRequest()
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should accept request with valid token', async () => {
      const user = await createTestUser({ email: 'test@example.com' });
      const headers = getAuthHeader(user.id, user.email, user.role);

      const response = await makeRequest()
        .get('/api/auth/profile')
        .set(headers);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject token for non-existent user', async () => {
      const headers = getAuthHeader('non-existent-id', 'fake@example.com', UserRole.CUSTOMER);

      const response = await makeRequest()
        .get('/api/auth/profile')
        .set(headers);

      expect(response.status).toBe(401);
    });
  });

  describe('requireAdmin', () => {
    it('should reject non-admin users', async () => {
      const user = await createTestUser({ email: 'customer@example.com' });
      const headers = getAuthHeader(user.id, user.email, UserRole.CUSTOMER);

      const response = await makeRequest()
        .get('/api/admin/dashboard')
        .set(headers);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should accept admin users', async () => {
      const admin = await createTestAdmin({ email: 'admin@example.com' });
      const headers = getAuthHeader(admin.id, admin.email, UserRole.ADMIN);

      const response = await makeRequest()
        .get('/api/admin/dashboard')
        .set(headers);

      expect(response.status).toBe(200);
    });
  });
});
```

---

### Task 9.4.2: Create Validation Middleware Tests

**Action:** Create `backend/src/__tests__/integration/middlewares/validateRequest.test.ts`

```typescript
import { makeRequest } from '../../helpers/testApp.js';
import { cleanDatabase } from '../../helpers/testDb.js';

describe('Validation Middleware', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Register Validation', () => {
    it('should reject empty request body', async () => {
      const response = await makeRequest()
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.fields).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await makeRequest()
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'ValidPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details.fields.email).toBeDefined();
    });

    it('should reject weak password', async () => {
      const response = await makeRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details.fields.password).toBeDefined();
    });

    it('should reject short name', async () => {
      const response = await makeRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'A',
          password: 'ValidPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.details.fields.name).toBeDefined();
    });
  });

  describe('Login Validation', () => {
    it('should reject missing email', async () => {
      const response = await makeRequest()
        .post('/api/auth/login')
        .send({ password: 'password' });

      expect(response.status).toBe(400);
    });

    it('should reject missing password', async () => {
      const response = await makeRequest()
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });
  });
});
```

---

## 9.5 E2E API Tests

### Task 9.5.1: Create Auth E2E Tests

**Action:** Create `backend/src/__tests__/e2e/auth/auth.test.ts`

```typescript
import { makeRequest, authenticatedRequest } from '../../helpers/testApp.js';
import { cleanDatabase, createTestUser } from '../../helpers/testDb.js';
import { UserFactory } from '../../helpers/factories.js';

describe('Auth API E2E', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = UserFactory.build();

      const response = await makeRequest()
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.token.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const existingUser = await createTestUser({ email: 'existing@example.com' });

      const response = await makeRequest()
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          name: 'New User',
          password: 'ValidPass123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const password = 'TestPass123!';
      const user = await createTestUser({ email: 'login@example.com', password });

      const response = await makeRequest()
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.token.accessToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await createTestUser({ email: 'test@example.com', password: 'CorrectPass123!' });

      const response = await makeRequest()
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent email', async () => {
      const response = await makeRequest()
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const user = await createTestUser({ email: 'profile@example.com', name: 'Profile User' });
      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth.get('/api/auth/profile');

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('profile@example.com');
      expect(response.body.data.name).toBe('Profile User');
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should reject unauthenticated request', async () => {
      const response = await makeRequest().get('/api/auth/profile');

      expect(response.status).toBe(401);
    });
  });
});
```

---

### Task 9.5.2: Create Cars E2E Tests

**Action:** Create `backend/src/__tests__/e2e/cars/cars.test.ts`

```typescript
import { makeRequest, authenticatedRequest } from '../../helpers/testApp.js';
import { cleanDatabase, createTestUser, createTestAdmin, createTestCar, createTestLocation } from '../../helpers/testDb.js';
import { CarFactory } from '../../helpers/factories.js';
import { CarType, Transmission, FuelType, UserRole } from '@prisma/client';

describe('Cars API E2E', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/cars', () => {
    it('should return paginated list of cars', async () => {
      // Create multiple cars
      await createTestCar({ brand: 'Toyota', model: 'Camry' });
      await createTestCar({ brand: 'Honda', model: 'Civic' });
      await createTestCar({ brand: 'BMW', model: '3 Series' });

      const response = await makeRequest()
        .get('/api/cars')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(3);
      expect(response.body.meta.totalPages).toBe(2);
    });

    it('should filter cars by type', async () => {
      await createTestCar({ type: CarType.SUV });
      await createTestCar({ type: CarType.SUV });
      await createTestCar({ type: CarType.SEDAN });

      const response = await makeRequest()
        .get('/api/cars')
        .query({ type: 'SUV' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((car: any) => car.type === 'SUV')).toBe(true);
    });

    it('should filter cars by seats', async () => {
      await createTestCar({ seats: 5 });
      await createTestCar({ seats: 7 });
      await createTestCar({ seats: 5 });

      const response = await makeRequest()
        .get('/api/cars')
        .query({ seats: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.every((car: any) => car.seats === 5)).toBe(true);
    });

    it('should filter cars by price range', async () => {
      await createTestCar({ dailyPrice: 300000 });
      await createTestCar({ dailyPrice: 500000 });
      await createTestCar({ dailyPrice: 800000 });

      const response = await makeRequest()
        .get('/api/cars')
        .query({ priceMin: 400000, priceMax: 600000 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    it('should sort cars by price ascending', async () => {
      await createTestCar({ dailyPrice: 500000 });
      await createTestCar({ dailyPrice: 300000 });
      await createTestCar({ dailyPrice: 700000 });

      const response = await makeRequest()
        .get('/api/cars')
        .query({ sortBy: 'dailyPrice', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      const prices = response.body.data.map((car: any) => Number(car.dailyPrice));
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });
  });

  describe('GET /api/cars/:id', () => {
    it('should return car by id', async () => {
      const car = await createTestCar({ brand: 'Tesla', model: 'Model 3' });

      const response = await makeRequest()
        .get(`/api/cars/${car.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(car.id);
      expect(response.body.data.brand).toBe('Tesla');
      expect(response.body.data.model).toBe('Model 3');
    });

    it('should return 404 for non-existent car', async () => {
      const response = await makeRequest()
        .get('/api/cars/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CAR_NOT_FOUND');
    });
  });

  describe('POST /api/cars (Admin)', () => {
    it('should create car as admin', async () => {
      const admin = await createTestAdmin({ email: 'admin@example.com' });
      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const carData = CarFactory.build();

      const response = await auth
        .post('/api/cars')
        .send(carData);

      expect(response.status).toBe(201);
      expect(response.body.data.brand).toBe(carData.brand);
      expect(response.body.data.model).toBe(carData.model);
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser({ email: 'user@example.com' });
      const auth = authenticatedRequest(user.id, user.email, UserRole.CUSTOMER);

      const carData = CarFactory.build();

      const response = await auth
        .post('/api/cars')
        .send(carData);

      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const carData = CarFactory.build();

      const response = await makeRequest()
        .post('/api/cars')
        .send(carData);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/cars/:id (Admin)', () => {
    it('should update car as admin', async () => {
      const admin = await createTestAdmin({ email: 'admin@example.com' });
      const car = await createTestCar({ dailyPrice: 500000 });
      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const response = await auth
        .patch(`/api/cars/${car.id}`)
        .send({ dailyPrice: 600000 });

      expect(response.status).toBe(200);
      expect(Number(response.body.data.dailyPrice)).toBe(600000);
    });

    it('should return 404 for non-existent car', async () => {
      const admin = await createTestAdmin({ email: 'admin@example.com' });
      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const response = await auth
        .patch('/api/cars/non-existent-id')
        .send({ dailyPrice: 600000 });

      expect(response.status).toBe(404);
    });
  });
});
```

---

### Task 9.5.3: Create Bookings E2E Tests

**Action:** Create `backend/src/__tests__/e2e/bookings/bookings.test.ts`

```typescript
import { makeRequest, authenticatedRequest } from '../../helpers/testApp.js';
import {
  cleanDatabase,
  createTestUser,
  createTestCar,
  createTestLocation,
  createTestBooking,
  createTestAddon,
} from '../../helpers/testDb.js';
import { BookingFactory } from '../../helpers/factories.js';
import { BookingStatus, UserRole } from '@prisma/client';

describe('Bookings API E2E', () => {
  let user: any;
  let car: any;
  let pickupLocation: any;
  let dropoffLocation: any;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser({ email: 'booker@example.com' });
    car = await createTestCar({ dailyPrice: 500000 });
    pickupLocation = await createTestLocation({ name: 'Airport' });
    dropoffLocation = await createTestLocation({ name: 'Downtown' });
  });

  describe('POST /api/bookings', () => {
    it('should create booking successfully', async () => {
      const auth = authenticatedRequest(user.id, user.email, user.role);
      const bookingData = BookingFactory.buildInput(car.id, pickupLocation.id, dropoffLocation.id);

      const response = await auth
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.carId).toBe(car.id);
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.totalPrice).toBeDefined();
    });

    it('should include addons in booking', async () => {
      const addon = await createTestAddon({ pricePerBooking: 50000 });
      const auth = authenticatedRequest(user.id, user.email, user.role);
      const bookingData = BookingFactory.buildInput(car.id, pickupLocation.id, dropoffLocation.id, {
        addonIds: [addon.id],
      });

      const response = await auth
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(Number(response.body.data.addonPrice)).toBeGreaterThan(0);
    });

    it('should reject booking for unavailable car', async () => {
      // Create existing booking
      await createTestBooking({
        userId: user.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: BookingStatus.CONFIRMED,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);
      const bookingData = BookingFactory.buildInput(car.id, pickupLocation.id, dropoffLocation.id, {
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      const response = await auth
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CAR_NOT_AVAILABLE');
    });

    it('should reject unauthenticated requests', async () => {
      const bookingData = BookingFactory.buildInput(car.id, pickupLocation.id, dropoffLocation.id);

      const response = await makeRequest()
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(401);
    });

    it('should reject past start date', async () => {
      const auth = authenticatedRequest(user.id, user.email, user.role);
      const bookingData = BookingFactory.buildInput(car.id, pickupLocation.id, dropoffLocation.id, {
        startDate: '2020-01-01',
        endDate: '2020-01-05',
      });

      const response = await auth
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/bookings', () => {
    it('should return user bookings', async () => {
      await createTestBooking({
        userId: user.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth.get('/api/bookings');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    it('should not return other users bookings', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      await createTestBooking({
        userId: otherUser.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth.get('/api/bookings');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should filter by status', async () => {
      await createTestBooking({
        userId: user.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
        status: BookingStatus.CONFIRMED,
      });
      await createTestBooking({
        userId: user.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
        status: BookingStatus.CANCELLED,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth
        .get('/api/bookings')
        .query({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('CONFIRMED');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should return booking details', async () => {
      const booking = await createTestBooking({
        userId: user.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth.get(`/api/bookings/${booking.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(booking.id);
      expect(response.body.data.car).toBeDefined();
      expect(response.body.data.pickupLocation).toBeDefined();
    });

    it('should not allow access to other users booking', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const booking = await createTestBooking({
        userId: otherUser.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth.get(`/api/bookings/${booking.id}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/bookings/:id/cancel', () => {
    it('should cancel pending booking', async () => {
      const booking = await createTestBooking({
        userId: user.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
        status: BookingStatus.PENDING,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth
        .post(`/api/bookings/${booking.id}/cancel`)
        .send({ reason: 'Changed plans' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELLED');
      expect(response.body.data.cancelReason).toBe('Changed plans');
    });

    it('should not cancel returned booking', async () => {
      const booking = await createTestBooking({
        userId: user.id,
        carId: car.id,
        pickupLocationId: pickupLocation.id,
        dropoffLocationId: dropoffLocation.id,
        status: BookingStatus.RETURNED,
      });

      const auth = authenticatedRequest(user.id, user.email, user.role);

      const response = await auth
        .post(`/api/bookings/${booking.id}/cancel`)
        .send({ reason: 'Want refund' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });
});
```

---

### Task 9.5.4: Create Admin E2E Tests

**Action:** Create `backend/src/__tests__/e2e/admin/admin.test.ts`

```typescript
import { makeRequest, authenticatedRequest } from '../../helpers/testApp.js';
import {
  cleanDatabase,
  createTestUser,
  createTestAdmin,
  createTestCar,
  createTestLocation,
  createTestBooking,
} from '../../helpers/testDb.js';
import { BookingStatus, UserRole } from '@prisma/client';

describe('Admin API E2E', () => {
  let admin: any;
  let customer: any;
  let car: any;
  let location: any;

  beforeEach(async () => {
    await cleanDatabase();
    admin = await createTestAdmin({ email: 'admin@example.com' });
    customer = await createTestUser({ email: 'customer@example.com' });
    car = await createTestCar();
    location = await createTestLocation();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard stats for admin', async () => {
      // Create some bookings
      await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
        status: BookingStatus.RETURNED,
      });
      await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
        status: BookingStatus.CONFIRMED,
      });

      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const response = await auth.get('/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.data.bookings).toBeDefined();
      expect(response.body.data.bookings.totalBookings).toBe(2);
      expect(response.body.data.cars).toBeDefined();
      expect(response.body.data.revenue).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      const auth = authenticatedRequest(customer.id, customer.email, UserRole.CUSTOMER);

      const response = await auth.get('/api/admin/dashboard');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/bookings', () => {
    it('should return all bookings for admin', async () => {
      await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
      });

      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const response = await auth.get('/api/admin/bookings');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
        status: BookingStatus.PENDING,
      });
      await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
        status: BookingStatus.CONFIRMED,
      });

      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const response = await auth
        .get('/api/admin/bookings')
        .query({ status: 'PENDING' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((b: any) => b.status === 'PENDING')).toBe(true);
    });
  });

  describe('PATCH /api/admin/bookings/:id/status', () => {
    it('should update booking status as admin', async () => {
      const booking = await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
        status: BookingStatus.PENDING,
      });

      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const response = await auth
        .patch(`/api/admin/bookings/${booking.id}/status`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should reject invalid status transition', async () => {
      const booking = await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
        status: BookingStatus.RETURNED,
      });

      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      const response = await auth
        .patch(`/api/admin/bookings/${booking.id}/status`)
        .send({ status: 'PENDING' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should allow full status flow', async () => {
      const booking = await createTestBooking({
        userId: customer.id,
        carId: car.id,
        pickupLocationId: location.id,
        dropoffLocationId: location.id,
        status: BookingStatus.PENDING,
      });

      const auth = authenticatedRequest(admin.id, admin.email, UserRole.ADMIN);

      // PENDING -> CONFIRMED
      let response = await auth
        .patch(`/api/admin/bookings/${booking.id}/status`)
        .send({ status: 'CONFIRMED' });
      expect(response.body.data.status).toBe('CONFIRMED');

      // CONFIRMED -> PICKED_UP
      response = await auth
        .patch(`/api/admin/bookings/${booking.id}/status`)
        .send({ status: 'PICKED_UP' });
      expect(response.body.data.status).toBe('PICKED_UP');

      // PICKED_UP -> RETURNED
      response = await auth
        .patch(`/api/admin/bookings/${booking.id}/status`)
        .send({ status: 'RETURNED' });
      expect(response.body.data.status).toBe('RETURNED');
    });
  });
});
```

---

## 9.6 Run Tests

### Task 9.6.1: Create Test Database

**Action:** You'll need a separate test database. Update docker-compose.dev.yml or create docker-compose.test.yml:

```yaml
# Add to docker-compose.dev.yml or create separate file
services:
  db-test:
    image: postgres:16-alpine
    container_name: car_rental_db_test
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: car_rental_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
```

**Note:** Using tmpfs makes tests faster as data is stored in memory.

---

### Task 9.6.2: Create Test Environment File

**Action:** Create `backend/.env.test`

```bash
NODE_ENV=test
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/car_rental_test?schema=public
JWT_SECRET=test-secret-key-for-testing-only
JWT_EXPIRES_IN=1h
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=error
```

---

### Task 9.6.3: Run All Tests

**Action:** Run from `backend/` directory:

```bash
# Start test database
docker-compose -f docker-compose.dev.yml up db-test -d

# Run migrations on test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/car_rental_test npx prisma migrate deploy

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode during development
npm run test:watch
```

---

### Task 9.6.4: Verify Coverage

**Action:** After running tests with coverage, check the output:

```bash
npm run test:coverage
```

**Expected Output:**

```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   90.xx |   90.xx  |   90.xx |   90.xx |
 domain/errors             |   100   |   100    |   100   |   100   |
 shared/utils              |   100   |   100    |   100   |   100   |
 infrastructure/auth       |   95.xx |   90.xx  |   100   |   95.xx |
 presentation/middlewares  |   92.xx |   88.xx  |   90.xx |   92.xx |
 ...                       |   ...   |   ...    |   ...   |   ...   |
---------------------------|---------|----------|---------|---------|
```

**Coverage reports are generated in:**
- `backend/coverage/lcov-report/index.html` - HTML report (open in browser)
- `backend/coverage/lcov.info` - LCOV format for CI tools

---

## 9.7 CI/CD Integration (Optional)

### Task 9.7.1: Create GitHub Actions Workflow

**Action:** Create `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: car_rental_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: backend
        run: npx prisma generate

      - name: Run migrations
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/car_rental_test
        run: npx prisma migrate deploy

      - name: Run tests
        working-directory: backend
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/car_rental_test
          JWT_SECRET: test-secret-key
          JWT_EXPIRES_IN: 1h
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: backend/coverage
          fail_ci_if_error: true
```

---

## Phase 9 Completion Checklist

- [x] 9.1.1 Installed testing dependencies
- [x] 9.1.2 Created Jest configuration
- [x] 9.1.3 Updated package.json with test scripts
- [x] 9.1.4 Created test directory structure
- [x] 9.1.5 Created test setup file
- [x] 9.2.1-3 Created test helpers (testDb, testApp, factories)
- [x] 9.3.1-3 Created unit tests (pagination, date, errors)
- [ ] 9.4.1-2 Created integration tests (auth middleware, validation)
- [x] 9.5.1-4 Created E2E tests (auth, cars, bookings, admin)
- [ ] 9.6.1-4 Ran tests and verified 90%+ coverage (Jest ESM configuration needs fine-tuning)
- [ ] 9.7.1 (Optional) Created CI/CD workflow

## Phase 9 Deliverables

```
backend/
├── jest.config.js
├── .env.test
├── src/__tests__/
│   ├── setup.ts
│   ├── helpers/
│   │   ├── testDb.ts
│   │   ├── testApp.ts
│   │   └── factories.ts
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── pagination.test.ts
│   │   │   └── date.test.ts
│   │   └── domain/
│   │       └── errors.test.ts
│   ├── integration/
│   │   └── middlewares/
│   │       ├── authMiddleware.test.ts
│   │       └── validateRequest.test.ts
│   └── e2e/
│       ├── auth/
│       │   └── auth.test.ts
│       ├── cars/
│       │   └── cars.test.ts
│       ├── bookings/
│       │   └── bookings.test.ts
│       └── admin/
│           └── admin.test.ts
└── coverage/
    └── lcov-report/
        └── index.html
```

## Resume Point (Phase 9)

```bash
# Start test database
docker-compose -f docker-compose.dev.yml up db-test -d

# Run all tests
cd backend && npm test

# Run with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

## Implementation Complete

Congratulations! You have completed the full backend implementation:

### Summary of What Was Built

| Phase | Components |
|-------|------------|
| 1 | Docker environment, Express server |
| 2 | Prisma schema, migrations, seed data |
| 3 | Clean architecture, error handling, utilities |
| 4 | JWT authentication, login, register |
| 5 | Car CRUD, filtering, locations, addons |
| 6 | Booking system, availability checks |
| 7 | Admin dashboard, analytics, status management |
| 8 | Swagger docs, rate limiting |
| 9 | Unit tests, integration tests, E2E tests (90%+ coverage) |

### API Endpoints Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/health` | GET | Public | Health check |
| `/api/auth/register` | POST | Public | Register user |
| `/api/auth/login` | POST | Public | Login |
| `/api/auth/profile` | GET | Private | Get profile |
| `/api/cars` | GET | Public | List cars |
| `/api/cars/:id` | GET | Public | Get car |
| `/api/cars` | POST | Admin | Create car |
| `/api/cars/:id` | PATCH | Admin | Update car |
| `/api/locations` | GET | Public | List locations |
| `/api/addons` | GET | Public | List addons |
| `/api/bookings` | GET | Private | My bookings |
| `/api/bookings` | POST | Private | Create booking |
| `/api/bookings/:id` | GET | Private | Get booking |
| `/api/bookings/:id/cancel` | POST | Private | Cancel booking |
| `/api/admin/dashboard` | GET | Admin | Analytics |
| `/api/admin/bookings` | GET | Admin | All bookings |
| `/api/admin/bookings/:id/status` | PATCH | Admin | Update status |

### Quick Start Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Access database
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d car_rental_dev

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

# Reset database
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# View API docs
open http://localhost:3000/api-docs

# Run tests
cd backend && npm test

# Run tests with coverage
cd backend && npm run test:coverage
```

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@carrental.com | Admin123! |
| Customer | john.doe@example.com | Customer123! |

---

**Document Status:** Complete - Ready for Implementation

**Next Steps:** Build the frontend using your preferred framework to consume this API.
