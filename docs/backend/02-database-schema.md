# Database Schema Design Document
## Data-Driven Car Rental - PostgreSQL + Prisma

**Version:** 1.0
**Date:** 2026-01-19
**Database:** PostgreSQL 16.x
**ORM:** Prisma 5.x

---

## 1. Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    User     │
└─────────────┘
      │ 1
      │
      │ N
┌─────────────┐         N ┌─────────────┐ 1      ┌─────────────┐
│   Booking   │───────────│BookingAddon │────────│    Addon    │
└─────────────┘           └─────────────┘        └─────────────┘
      │ N                                               │ 1
      │                                                 │ active
      │ 1                                               │
┌─────────────┐                                         │
│     Car     │                                         │
└─────────────┘                                         │
      │ 1                                               │
      │                                                 │
      │ N                                               │
      └─────────────────────────────────────────────────┘

┌─────────────┐
│  Location   │────── Referenced by Booking (pickup, dropoff)
└─────────────┘

┌─────────────┐
│  AuditLog   │────── Tracks changes to critical entities
└─────────────┘
```

---

## 2. Table Definitions

### 2.1 User Table
Stores customer and admin accounts.

```prisma
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

enum UserRole {
  CUSTOMER
  ADMIN
}
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Default uuid_generate_v4() | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login) |
| name | VARCHAR(255) | NOT NULL | Full name |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash (salt rounds=10) |
| role | ENUM | NOT NULL, Default 'CUSTOMER' | User role (CUSTOMER, ADMIN) |
| created_at | TIMESTAMP | NOT NULL, Default NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, Auto-update | Last modification timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_users_email ON users(email)`

**Seed Data:**
- 1 Admin user: `admin@carrental.com` / `Admin123!`
- 5 Customer users for testing bookings

---

### 2.2 Car Table
Vehicle fleet inventory.

```prisma
model Car {
  id           String         @id @default(uuid())
  brand        String
  model        String
  year         Int
  type         CarType
  seats        Int
  transmission Transmission
  fuel         FuelType
  dailyPrice   Decimal        @map("daily_price") @db.Decimal(10, 2)
  status       CarStatus      @default(ACTIVE)
  images       String[]       // Array of image URLs

  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  // Relations
  bookings     Booking[]

  @@map("cars")
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
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| brand | VARCHAR(100) | NOT NULL | Car brand (e.g., Toyota) |
| model | VARCHAR(100) | NOT NULL | Car model (e.g., Avanza) |
| year | INTEGER | NOT NULL, CHECK (year >= 2000 AND year <= 2030) | Manufacturing year |
| type | ENUM | NOT NULL | SUV, SEDAN, HATCHBACK, MPV, VAN |
| seats | INTEGER | NOT NULL, CHECK (seats >= 2 AND seats <= 15) | Passenger capacity |
| transmission | ENUM | NOT NULL | AT (Automatic) or MT (Manual) |
| fuel | ENUM | NOT NULL | GAS, DIESEL, EV |
| daily_price | DECIMAL(10,2) | NOT NULL, CHECK (daily_price > 0) | Base rental price per day |
| status | ENUM | NOT NULL, Default 'ACTIVE' | ACTIVE or INACTIVE |
| images | TEXT[] | NOT NULL | Array of image URLs |
| created_at | TIMESTAMP | NOT NULL, Default NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, Auto-update | Last modification timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_cars_type ON cars(type)`
- `INDEX idx_cars_status ON cars(status)`
- `INDEX idx_cars_daily_price ON cars(daily_price)`
- `INDEX idx_cars_seats ON cars(seats)`

**Business Rules:**
- Cannot delete cars with active bookings (soft delete: set status=INACTIVE)
- Price changes affect future bookings only (existing bookings store snapshot)

**Seed Data:**
- 20 cars across 5 types (4 cars per type)
- Mix of transmissions and fuel types
- Prices range from 100,000 to 800,000 IDR per day

---

### 2.3 Location Table
Pickup and dropoff locations.

```prisma
model Location {
  id        String   @id @default(uuid())
  name      String   @unique
  address   String?
  isActive  Boolean  @default(true) @map("is_active")

  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  bookingsPickup  Booking[] @relation("PickupLocation")
  bookingsDropoff Booking[] @relation("DropoffLocation")

  @@map("locations")
}
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Location name (e.g., "Yogyakarta Airport") |
| address | TEXT | NULL | Full address (optional) |
| is_active | BOOLEAN | NOT NULL, Default TRUE | Whether location is available |
| created_at | TIMESTAMP | NOT NULL, Default NOW() | Creation timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_locations_name ON locations(name)`

**Seed Data:**
- 5 locations in Yogyakarta area:
  - "Yogyakarta Airport"
  - "Yogyakarta City Center"
  - "Malioboro Street"
  - "UGM Campus"
  - "Prambanan Temple Area"

---

### 2.4 Addon Table
Optional services/products for bookings.

```prisma
model Addon {
  id              String         @id @default(uuid())
  name            String         @unique
  description     String?
  pricePerBooking Decimal        @map("price_per_booking") @db.Decimal(10, 2)
  isActive        Boolean        @default(true) @map("is_active")

  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // Relations
  bookingAddons   BookingAddon[]

  @@map("addons")
}
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Addon name (e.g., "GPS Navigation") |
| description | TEXT | NULL | Addon description |
| price_per_booking | DECIMAL(10,2) | NOT NULL, CHECK (price_per_booking >= 0) | Fixed price per booking |
| is_active | BOOLEAN | NOT NULL, Default TRUE | Whether addon is available |
| created_at | TIMESTAMP | NOT NULL, Default NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, Auto-update | Last modification timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_addons_name ON addons(name)`

**Seed Data:**
- 3 addons:
  - "GPS Navigation" - 50,000 IDR
  - "Child Safety Seat" - 30,000 IDR
  - "Extra Insurance" - 100,000 IDR

---

### 2.5 Booking Table
Core transactional entity for car rentals.

```prisma
model Booking {
  id                String        @id @default(uuid())
  userId            String        @map("user_id")
  carId             String        @map("car_id")
  pickupLocationId  String        @map("pickup_location_id")
  dropoffLocationId String        @map("dropoff_location_id")

  startDate         DateTime      @map("start_date") @db.Date
  endDate           DateTime      @map("end_date") @db.Date
  days              Int           // Computed: endDate - startDate

  basePrice         Decimal       @map("base_price") @db.Decimal(12, 2)
  addonPrice        Decimal       @map("addon_price") @db.Decimal(12, 2) @default(0)
  totalPrice        Decimal       @map("total_price") @db.Decimal(12, 2)

  status            BookingStatus @default(PENDING)
  cancelReason      String?       @map("cancel_reason")

  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  // Relations
  user              User          @relation(fields: [userId], references: [id])
  car               Car           @relation(fields: [carId], references: [id])
  pickupLocation    Location      @relation("PickupLocation", fields: [pickupLocationId], references: [id])
  dropoffLocation   Location      @relation("DropoffLocation", fields: [dropoffLocationId], references: [id])
  bookingAddons     BookingAddon[]

  @@index([userId])
  @@index([carId])
  @@index([status])
  @@index([startDate, endDate])
  @@index([carId, startDate, endDate])
  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  PICKED_UP
  RETURNED
  CANCELLED
}
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK (users.id), NOT NULL | Booking customer |
| car_id | UUID | FK (cars.id), NOT NULL | Rented car |
| pickup_location_id | UUID | FK (locations.id), NOT NULL | Pickup location |
| dropoff_location_id | UUID | FK (locations.id), NOT NULL | Dropoff location |
| start_date | DATE | NOT NULL | Rental start date |
| end_date | DATE | NOT NULL, CHECK (end_date > start_date) | Rental end date |
| days | INTEGER | NOT NULL, CHECK (days >= 1) | Rental duration |
| base_price | DECIMAL(12,2) | NOT NULL, CHECK (base_price > 0) | Car daily price × days |
| addon_price | DECIMAL(12,2) | NOT NULL, Default 0 | Sum of addon prices |
| total_price | DECIMAL(12,2) | NOT NULL, CHECK (total_price = base_price + addon_price) | Final price |
| status | ENUM | NOT NULL, Default 'PENDING' | Booking lifecycle status |
| cancel_reason | TEXT | NULL | Reason for cancellation |
| created_at | TIMESTAMP | NOT NULL, Default NOW() | Booking creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, Auto-update | Last modification timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_bookings_user_id ON bookings(user_id)`
- `INDEX idx_bookings_car_id ON bookings(car_id)`
- `INDEX idx_bookings_status ON bookings(status)`
- `INDEX idx_bookings_dates ON bookings(start_date, end_date)`
- `COMPOSITE INDEX idx_bookings_car_dates ON bookings(car_id, start_date, end_date)` ← **Critical for availability checks**

**Foreign Keys:**
- `user_id → users.id ON DELETE RESTRICT`
- `car_id → cars.id ON DELETE RESTRICT`
- `pickup_location_id → locations.id ON DELETE RESTRICT`
- `dropoff_location_id → locations.id ON DELETE RESTRICT`

**Business Rules:**
1. **Overlap Prevention:**
   ```sql
   -- Cannot create booking if overlapping with existing active bookings
   SELECT COUNT(*) FROM bookings
   WHERE car_id = $carId
     AND status IN ('PENDING', 'CONFIRMED', 'PICKED_UP')
     AND (
       (start_date <= $endDate AND end_date >= $startDate)
     ) > 0
   ```

2. **Price Calculation:**
   ```typescript
   days = (endDate - startDate) / (1000 * 60 * 60 * 24)
   basePrice = car.dailyPrice * days
   addonPrice = sum(bookingAddons.price)
   totalPrice = basePrice + addonPrice
   ```

3. **Cancellation Policy:**
   - Customer can cancel only if `NOW() < startDate`
   - Admin can cancel anytime (with reason)

**Seed Data:**
- 40 historical bookings (mixed statuses for analytics):
  - 15 RETURNED (completed rentals)
  - 10 CONFIRMED (upcoming)
  - 5 PENDING (awaiting confirmation)
  - 8 CANCELLED (various reasons)
  - 2 PICKED_UP (currently rented)

---

### 2.6 BookingAddon Table
Many-to-many junction table between Booking and Addon.

```prisma
model BookingAddon {
  id        String   @id @default(uuid())
  bookingId String   @map("booking_id")
  addonId   String   @map("addon_id")
  price     Decimal  @db.Decimal(10, 2) // Snapshot of addon price at booking time

  // Relations
  booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  addon     Addon    @relation(fields: [addonId], references: [id])

  @@unique([bookingId, addonId])
  @@index([bookingId])
  @@map("booking_addons")
}
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| booking_id | UUID | FK (bookings.id), NOT NULL | Booking reference |
| addon_id | UUID | FK (addons.id), NOT NULL | Addon reference |
| price | DECIMAL(10,2) | NOT NULL | Addon price at booking time (snapshot) |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_booking_addons_unique ON booking_addons(booking_id, addon_id)`
- `INDEX idx_booking_addons_booking_id ON booking_addons(booking_id)`

**Foreign Keys:**
- `booking_id → bookings.id ON DELETE CASCADE` ← Deleting booking removes addons
- `addon_id → addons.id ON DELETE RESTRICT` ← Cannot delete addon if in use

**Why Store Price Snapshot:**
- Addon prices may change over time
- Historical bookings must preserve original prices for analytics accuracy

---

### 2.7 AuditLog Table
Tracks critical changes for compliance and debugging.

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?  @map("actor_id") // User who performed action
  entityType String   @map("entity_type") // "Booking", "Car", etc.
  entityId   String   @map("entity_id")
  action     String   // "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"
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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| actor_id | UUID | FK (users.id), NULL | User who performed action (NULL for system) |
| entity_type | VARCHAR(50) | NOT NULL | Entity name (Booking, Car, User) |
| entity_id | UUID | NOT NULL | ID of affected entity |
| action | VARCHAR(50) | NOT NULL | Action type (CREATE, UPDATE, DELETE, STATUS_CHANGE) |
| before_json | JSONB | NULL | State before change |
| after_json | JSONB | NULL | State after change |
| created_at | TIMESTAMP | NOT NULL, Default NOW() | Action timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`
- `INDEX idx_audit_logs_actor ON audit_logs(actor_id)`
- `INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC)`

**Use Cases:**
- Track booking status changes (PENDING → CONFIRMED → PICKED_UP → RETURNED)
- Track car price updates
- Track admin actions for accountability
- Debug data inconsistencies

**Example Entry:**
```json
{
  "id": "uuid",
  "actorId": "admin-uuid",
  "entityType": "Booking",
  "entityId": "booking-uuid",
  "action": "STATUS_CHANGE",
  "beforeJson": { "status": "PENDING" },
  "afterJson": { "status": "CONFIRMED" },
  "createdAt": "2026-01-19T10:30:00Z"
}
```

---

## 3. Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
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

// Models
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String
  passwordHash String    @map("password_hash")
  role         UserRole  @default(CUSTOMER)

  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  bookings     Booking[]
  auditLogs    AuditLog[]

  @@map("users")
}

model Car {
  id           String         @id @default(uuid())
  brand        String
  model        String
  year         Int
  type         CarType
  seats        Int
  transmission Transmission
  fuel         FuelType
  dailyPrice   Decimal        @map("daily_price") @db.Decimal(10, 2)
  status       CarStatus      @default(ACTIVE)
  images       String[]

  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  bookings     Booking[]

  @@index([type])
  @@index([status])
  @@index([dailyPrice])
  @@index([seats])
  @@map("cars")
}

model Location {
  id        String   @id @default(uuid())
  name      String   @unique
  address   String?
  isActive  Boolean  @default(true) @map("is_active")

  createdAt DateTime @default(now()) @map("created_at")

  bookingsPickup  Booking[] @relation("PickupLocation")
  bookingsDropoff Booking[] @relation("DropoffLocation")

  @@map("locations")
}

model Addon {
  id              String         @id @default(uuid())
  name            String         @unique
  description     String?
  pricePerBooking Decimal        @map("price_per_booking") @db.Decimal(10, 2)
  isActive        Boolean        @default(true) @map("is_active")

  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  bookingAddons   BookingAddon[]

  @@map("addons")
}

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
  cancelReason      String?       @map("cancel_reason")

  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  user              User          @relation(fields: [userId], references: [id])
  car               Car           @relation(fields: [carId], references: [id])
  pickupLocation    Location      @relation("PickupLocation", fields: [pickupLocationId], references: [id])
  dropoffLocation   Location      @relation("DropoffLocation", fields: [dropoffLocationId], references: [id])
  bookingAddons     BookingAddon[]

  @@index([userId])
  @@index([carId])
  @@index([status])
  @@index([startDate, endDate])
  @@index([carId, startDate, endDate])
  @@map("bookings")
}

model BookingAddon {
  id        String   @id @default(uuid())
  bookingId String   @map("booking_id")
  addonId   String   @map("addon_id")
  price     Decimal  @db.Decimal(10, 2)

  booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  addon     Addon    @relation(fields: [addonId], references: [id])

  @@unique([bookingId, addonId])
  @@index([bookingId])
  @@map("booking_addons")
}

model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?  @map("actor_id")
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  action     String
  beforeJson Json?    @map("before_json")
  afterJson  Json?    @map("after_json")

  createdAt  DateTime @default(now()) @map("created_at")

  actor      User?    @relation(fields: [actorId], references: [id])

  @@index([entityType, entityId])
  @@index([actorId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 4. Database Migration Strategy

### 4.1 Migration Workflow
```bash
# 1. Initialize Prisma
npx prisma init

# 2. Create initial migration
npx prisma migrate dev --name init

# 3. Generate Prisma Client
npx prisma generate

# 4. Run seed data
npx prisma db seed
```

### 4.2 Seed Script Structure
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Admin User
  const admin = await prisma.user.create({ ... });

  // 2. Create Customers (5 users)
  const customers = await prisma.user.createMany({ ... });

  // 3. Create Locations (5 locations)
  await prisma.location.createMany({ ... });

  // 4. Create Addons (3 addons)
  await prisma.addon.createMany({ ... });

  // 5. Create Cars (20 cars)
  await prisma.car.createMany({ ... });

  // 6. Create Historical Bookings (40 bookings)
  await createBookingsWithAddons();

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

---

## 5. Database Constraints & Triggers

### 5.1 Check Constraints
```sql
-- Booking date validation
ALTER TABLE bookings
ADD CONSTRAINT chk_booking_dates
CHECK (end_date > start_date);

-- Booking days validation
ALTER TABLE bookings
ADD CONSTRAINT chk_booking_days
CHECK (days >= 1);

-- Price validation
ALTER TABLE bookings
ADD CONSTRAINT chk_booking_prices
CHECK (base_price > 0 AND addon_price >= 0 AND total_price > 0);

-- Car year validation
ALTER TABLE cars
ADD CONSTRAINT chk_car_year
CHECK (year >= 2000 AND year <= 2030);

-- Car seats validation
ALTER TABLE cars
ADD CONSTRAINT chk_car_seats
CHECK (seats >= 2 AND seats <= 15);
```

### 5.2 Trigger for Auto-Calculating Days (Optional)
```sql
-- PostgreSQL function to auto-calculate days
CREATE OR REPLACE FUNCTION calculate_booking_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days := (NEW.end_date - NEW.start_date);
  IF NEW.days < 1 THEN
    RAISE EXCEPTION 'Booking duration must be at least 1 day';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_booking_days
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_booking_days();
```

---

## 6. Data Integrity Rules

### 6.1 Referential Integrity
- **ON DELETE RESTRICT:** Users, Cars, Locations, Addons (cannot delete if referenced)
- **ON DELETE CASCADE:** BookingAddons (auto-delete when booking is deleted)

### 6.2 Application-Level Constraints
Must be enforced in business logic:
1. **Booking Overlap Check** (before creating booking)
2. **Cancellation Policy** (before cancelling)
3. **Status Transition Validation** (PENDING → CONFIRMED → PICKED_UP → RETURNED)
4. **Price Snapshot** (store addon prices at booking time, not reference live prices)

---

## 7. Performance Optimization

### 7.1 Query Optimization Strategies

**1. Availability Check Query (Most Critical)**
```sql
-- Check if car is available for date range
SELECT COUNT(*) FROM bookings
WHERE car_id = $1
  AND status IN ('PENDING', 'CONFIRMED', 'PICKED_UP')
  AND (start_date <= $2 AND end_date >= $3);

-- Index used: idx_bookings_car_dates (car_id, start_date, end_date)
```

**2. Car Listing with Filters**
```sql
-- Filter cars by type, seats, price, and availability
SELECT * FROM cars
WHERE type = $1
  AND seats >= $2
  AND daily_price BETWEEN $3 AND $4
  AND status = 'ACTIVE'
ORDER BY daily_price ASC
LIMIT 20 OFFSET 0;

-- Indexes used: idx_cars_type, idx_cars_seats, idx_cars_daily_price
```

**3. User Bookings Query**
```sql
-- Get user's bookings with car details
SELECT b.*, c.brand, c.model, l1.name as pickup, l2.name as dropoff
FROM bookings b
JOIN cars c ON b.car_id = c.id
JOIN locations l1 ON b.pickup_location_id = l1.id
JOIN locations l2 ON b.dropoff_location_id = l2.id
WHERE b.user_id = $1
ORDER BY b.created_at DESC;

-- Index used: idx_bookings_user_id
```

### 7.2 Connection Pooling
```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 20
}
```

### 7.3 Analyze Plan
```sql
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE car_id = 'uuid'
  AND status IN ('PENDING', 'CONFIRMED')
  AND start_date >= '2026-01-20';

-- Verify indexes are being used
```

---

## 8. Backup & Recovery Strategy

### 8.1 Backup Schedule (Production)
- **Full Backup:** Daily at 2 AM UTC
- **Incremental Backup:** Every 6 hours
- **Retention:** 30 days

### 8.2 Backup Commands
```bash
# Full backup
pg_dump -U postgres -d car_rental > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d car_rental < backup_20260119.sql
```

---

## 9. Security Considerations

### 9.1 Database User Roles
```sql
-- Application user (limited privileges)
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Read-only user (for analytics/reporting)
CREATE USER read_only_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_user;
```

### 9.2 Sensitive Data
- **Passwords:** NEVER store plaintext; always hash with bcrypt
- **PII (Email, Name):** Consider encryption at rest for GDPR compliance (future)
- **Audit Logs:** Never delete (append-only table)

---

## 10. Data Validation Rules (Application Layer)

### 10.1 User Entity
- Email: Valid email format, max 255 chars
- Password: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
- Name: Max 255 chars, no special chars

### 10.2 Car Entity
- Brand/Model: Max 100 chars, alphanumeric + spaces
- Year: 2000-2030
- Seats: 2-15
- Daily Price: > 0, max 2 decimal places
- Images: Array of valid URLs, max 5 images

### 10.3 Booking Entity
- Start Date: Must be >= today
- End Date: Must be > Start Date
- Days: Auto-calculated, must be >= 1
- Total Price: Must equal basePrice + addonPrice

---

## 11. Analytics Queries

### 11.1 Total Revenue
```sql
SELECT SUM(total_price) as total_revenue
FROM bookings
WHERE status IN ('CONFIRMED', 'PICKED_UP', 'RETURNED');
```

### 11.2 Cancellation Rate
```sql
SELECT
  COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::float / COUNT(*)::float * 100 as cancellation_rate
FROM bookings;
```

### 11.3 Fleet Utilization %
```sql
-- For a given date range
WITH date_range AS (
  SELECT 7 as days -- e.g., last 7 days
),
active_cars AS (
  SELECT COUNT(*) as total_cars FROM cars WHERE status = 'ACTIVE'
),
booked_days AS (
  SELECT SUM(days) as total_booked_days
  FROM bookings
  WHERE status IN ('CONFIRMED', 'PICKED_UP', 'RETURNED')
    AND start_date >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  (total_booked_days::float / (total_cars * 7)::float * 100) as utilization_percent
FROM active_cars, booked_days, date_range;
```

### 11.4 Top Cars by Bookings
```sql
SELECT
  c.id,
  c.brand,
  c.model,
  COUNT(b.id) as booking_count,
  SUM(b.total_price) as total_revenue
FROM cars c
LEFT JOIN bookings b ON c.id = b.car_id
WHERE b.status != 'CANCELLED'
GROUP BY c.id, c.brand, c.model
ORDER BY booking_count DESC
LIMIT 5;
```

### 11.5 Revenue Trend (Last 7 Days)
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as bookings_count,
  SUM(total_price) as daily_revenue
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status IN ('CONFIRMED', 'PICKED_UP', 'RETURNED')
GROUP BY DATE(created_at)
ORDER BY date ASC;
```

---

## 12. Data Model Tradeoffs & Decisions

### 12.1 Why Store Price Snapshots?
**Decision:** Store `basePrice`, `addonPrice`, `totalPrice` in Booking table (not compute on-the-fly)

**Rationale:**
- Car prices may change over time
- Historical bookings must preserve original pricing for:
  - Accurate revenue analytics
  - Customer invoice history
  - Dispute resolution
- Slight denormalization for critical business data

### 12.2 Why UUID over Auto-Increment IDs?
**Decision:** Use UUIDs for all primary keys

**Rationale:**
- Better for distributed systems (future scaling)
- Prevents ID enumeration attacks
- Easier to merge data from multiple sources
- No sequential ID leakage (business intelligence)

**Tradeoff:** Slightly larger index size (16 bytes vs 4 bytes)

### 12.3 Why Separate BookingAddon Table?
**Decision:** Junction table instead of JSONB column

**Rationale:**
- Proper normalization (3NF)
- Type safety with Prisma
- Easier to query addon statistics
- Referential integrity with foreign keys

### 12.4 Why AuditLog Uses JSONB?
**Decision:** Store before/after states as JSON

**Rationale:**
- Flexible schema (different entity types)
- No need for separate audit tables per entity
- Easy to query with PostgreSQL JSON operators
- Balance between flexibility and performance

---

## 13. Testing Data Requirements

### 13.1 Seed Data Breakdown
| Entity | Count | Notes |
|--------|-------|-------|
| Users (Admin) | 1 | admin@carrental.com |
| Users (Customer) | 5 | For testing various booking scenarios |
| Cars | 20 | 4 per type (SUV, SEDAN, HATCHBACK, MPV, VAN) |
| Locations | 5 | Yogyakarta area |
| Addons | 3 | GPS, Child Seat, Insurance |
| Bookings | 40 | Mixed statuses for realistic analytics |

### 13.2 Booking Status Distribution (Seed Data)
- 15 RETURNED (37.5%) - Completed rentals
- 10 CONFIRMED (25%) - Upcoming bookings
- 8 CANCELLED (20%) - Historical cancellations
- 5 PENDING (12.5%) - Awaiting admin confirmation
- 2 PICKED_UP (5%) - Currently active rentals

**Why this distribution:**
- Realistic dashboard KPIs
- Test all status transitions
- Sufficient data for trend charts (7-day, 30-day)

---

## 14. Next Steps

1. ✅ Schema approved → Copy to `prisma/schema.prisma`
2. ⏳ Run `prisma migrate dev --name init`
3. ⏳ Create seed script (`prisma/seed.ts`)
4. ⏳ Generate Prisma Client
5. ⏳ Verify with Prisma Studio (`npx prisma studio`)

---

**Document Status:** ✅ Ready for Implementation
**Related Documents:**
- [Technical Requirements](./01-technical-requirements.md)
- [API Specification](./03-api-specification.md)
- [BRD](../brd.md)
