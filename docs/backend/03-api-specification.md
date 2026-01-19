# API Specification Document
## Data-Driven Car Rental - REST API

**Version:** 1.0
**Date:** 2026-01-19
**Base URL:** `http://localhost:3000/api`
**Protocol:** REST (JSON)
**Authentication:** JWT Bearer Token

---

## Table of Contents
1. [Authentication Endpoints](#1-authentication-endpoints)
2. [Car Endpoints](#2-car-endpoints)
3. [Booking Endpoints](#3-booking-endpoints)
4. [Location & Addon Endpoints](#4-location--addon-endpoints)
5. [Analytics Endpoints](#5-analytics-endpoints-admin)
6. [Common Patterns](#6-common-patterns)
7. [Error Responses](#7-error-responses)
8. [Request/Response Examples](#8-requestresponse-examples)

---

## 1. Authentication Endpoints

### 1.1 Register User
**POST** `/api/auth/register`

**Description:** Create a new customer account

**Request Body:**
```json
{
  "email": "string (required, email format, max 255)",
  "password": "string (required, min 8, max 100)",
  "name": "string (required, max 255)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "createdAt": "2026-01-19T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400` - Validation error (invalid email, weak password)
- `409` - Email already exists

**Validation Rules:**
- Email: Valid email format
- Password: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
- Name: Non-empty, max 255 chars

---

### 1.2 Login
**POST** `/api/auth/login`

**Description:** Authenticate user and receive JWT token

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@carrental.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `429` - Too many login attempts

---

### 1.3 Get Current User
**GET** `/api/auth/me`

**Description:** Get authenticated user profile

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "createdAt": "2026-01-15T08:00:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid/expired token)

---

### 1.4 Logout
**POST** `/api/auth/logout`

**Description:** Invalidate current session (client-side token removal)

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** JWT is stateless, so logout is primarily handled client-side by removing the token. This endpoint can be used for logging/analytics.

---

## 2. Car Endpoints

### 2.1 List Cars (Public)
**GET** `/api/cars`

**Description:** Get paginated list of active cars with filtering and sorting

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number (min: 1) |
| limit | integer | No | 20 | Items per page (min: 1, max: 100) |
| type | string | No | - | Filter by car type (SUV, SEDAN, HATCHBACK, MPV, VAN) |
| seats | integer | No | - | Minimum seats required |
| transmission | string | No | - | Filter by transmission (AT, MT) |
| fuel | string | No | - | Filter by fuel type (GAS, DIESEL, EV) |
| priceMin | number | No | - | Minimum daily price |
| priceMax | number | No | - | Maximum daily price |
| startDate | string | No | - | Check availability from date (ISO 8601 date) |
| endDate | string | No | - | Check availability to date (ISO 8601 date) |
| sort | string | No | price | Sort field (price, createdAt, seats) |
| order | string | No | asc | Sort order (asc, desc) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "brand": "Toyota",
      "model": "Avanza",
      "year": 2023,
      "type": "MPV",
      "seats": 7,
      "transmission": "AT",
      "fuel": "GAS",
      "dailyPrice": 350000,
      "images": [
        "https://example.com/car1.jpg",
        "https://example.com/car2.jpg"
      ],
      "isAvailable": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 18,
    "totalPages": 1
  }
}
```

**Availability Logic:**
- If `startDate` and `endDate` provided, check for booking overlaps
- `isAvailable` field indicates availability for requested date range
- If dates not provided, `isAvailable` is omitted or always true

**Errors:**
- `400` - Invalid query parameters

---

### 2.2 Get Car Details (Public)
**GET** `/api/cars/:id`

**Description:** Get detailed information about a specific car

**Path Parameters:**
- `id` (uuid): Car ID

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Check availability from date |
| endDate | string | No | Check availability to date |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand": "Toyota",
    "model": "Avanza",
    "year": 2023,
    "type": "MPV",
    "seats": 7,
    "transmission": "AT",
    "fuel": "GAS",
    "dailyPrice": 350000,
    "status": "ACTIVE",
    "images": [
      "https://example.com/car1.jpg",
      "https://example.com/car2.jpg"
    ],
    "isAvailable": true,
    "conflictingBookings": [],
    "createdAt": "2026-01-10T00:00:00Z",
    "updatedAt": "2026-01-10T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Car not found
- `400` - Invalid date format

---

### 2.3 Create Car (Admin)
**POST** `/api/admin/cars`

**Description:** Add a new car to the fleet

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "brand": "string (required, max 100)",
  "model": "string (required, max 100)",
  "year": "integer (required, 2000-2030)",
  "type": "string (required, enum: SUV|SEDAN|HATCHBACK|MPV|VAN)",
  "seats": "integer (required, 2-15)",
  "transmission": "string (required, enum: AT|MT)",
  "fuel": "string (required, enum: GAS|DIESEL|EV)",
  "dailyPrice": "number (required, > 0, max 2 decimals)",
  "images": "array of strings (required, URLs, max 5)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand": "Honda",
    "model": "CR-V",
    "year": 2024,
    "type": "SUV",
    "seats": 5,
    "transmission": "AT",
    "fuel": "GAS",
    "dailyPrice": 500000,
    "status": "ACTIVE",
    "images": ["https://example.com/crv.jpg"],
    "createdAt": "2026-01-19T10:00:00Z",
    "updatedAt": "2026-01-19T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `400` - Validation error

---

### 2.4 Update Car (Admin)
**PUT** `/api/admin/cars/:id`

**Description:** Update car details

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (uuid): Car ID

**Request Body:** (All fields optional for partial update)
```json
{
  "brand": "string (optional)",
  "model": "string (optional)",
  "year": "integer (optional)",
  "type": "string (optional)",
  "seats": "integer (optional)",
  "transmission": "string (optional)",
  "fuel": "string (optional)",
  "dailyPrice": "number (optional)",
  "images": "array of strings (optional)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brand": "Honda",
    "model": "CR-V",
    "year": 2024,
    "type": "SUV",
    "seats": 5,
    "transmission": "AT",
    "fuel": "GAS",
    "dailyPrice": 550000,
    "status": "ACTIVE",
    "images": ["https://example.com/crv.jpg"],
    "createdAt": "2026-01-19T10:00:00Z",
    "updatedAt": "2026-01-19T11:30:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Car not found
- `400` - Validation error

**Side Effects:**
- Audit log entry created
- Price change affects only future bookings

---

### 2.5 Update Car Status (Admin)
**PATCH** `/api/admin/cars/:id/status`

**Description:** Activate or deactivate a car (soft delete)

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (uuid): Car ID

**Request Body:**
```json
{
  "status": "string (required, enum: ACTIVE|INACTIVE)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "INACTIVE",
    "updatedAt": "2026-01-19T12:00:00Z"
  }
}
```

**Business Rules:**
- Cannot set INACTIVE if car has active bookings (PENDING, CONFIRMED, PICKED_UP)
- Returns `409 Conflict` if constraint violated

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Car not found
- `409` - Car has active bookings

---

## 3. Booking Endpoints

### 3.1 Create Booking (Customer)
**POST** `/api/bookings`

**Description:** Create a new car rental booking

**Authentication:** Required (Customer or Admin)

**Request Body:**
```json
{
  "carId": "uuid (required)",
  "pickupLocationId": "uuid (required)",
  "dropoffLocationId": "uuid (required)",
  "startDate": "string (required, ISO 8601 date, >= today)",
  "endDate": "string (required, ISO 8601 date, > startDate)",
  "addonIds": "array of uuids (optional, default: [])"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "carId": "uuid",
    "car": {
      "brand": "Toyota",
      "model": "Avanza",
      "dailyPrice": 350000
    },
    "pickupLocation": {
      "id": "uuid",
      "name": "Yogyakarta Airport"
    },
    "dropoffLocation": {
      "id": "uuid",
      "name": "Yogyakarta City Center"
    },
    "startDate": "2026-01-25",
    "endDate": "2026-01-28",
    "days": 3,
    "basePrice": 1050000,
    "addonPrice": 150000,
    "totalPrice": 1200000,
    "addons": [
      {
        "id": "uuid",
        "name": "GPS Navigation",
        "price": 50000
      },
      {
        "id": "uuid",
        "name": "Extra Insurance",
        "price": 100000
      }
    ],
    "status": "PENDING",
    "createdAt": "2026-01-19T10:00:00Z"
  }
}
```

**Business Rules:**
1. **Availability Check:**
   - Query bookings for same car with overlapping dates and active statuses
   - If overlap found, return `409 Conflict`

2. **Price Calculation:**
   ```
   days = (endDate - startDate) in days
   basePrice = car.dailyPrice × days
   addonPrice = sum(addon.pricePerBooking for each addonId)
   totalPrice = basePrice + addonPrice
   ```

3. **Initial Status:** Always `PENDING` (awaits admin confirmation)

**Errors:**
- `401` - Unauthorized
- `400` - Validation error (invalid dates, car not found)
- `404` - Car, location, or addon not found
- `409` - Car not available for selected dates

**Example Conflict Response:**
```json
{
  "success": false,
  "error": {
    "code": "CAR_NOT_AVAILABLE",
    "message": "Car is already booked for the selected dates",
    "details": {
      "carId": "uuid",
      "requestedDates": {
        "startDate": "2026-01-25",
        "endDate": "2026-01-28"
      },
      "conflictingBooking": {
        "id": "uuid",
        "startDate": "2026-01-24",
        "endDate": "2026-01-27",
        "status": "CONFIRMED"
      }
    }
  }
}
```

---

### 3.2 Get My Bookings (Customer)
**GET** `/api/bookings/my`

**Description:** Get all bookings for authenticated user

**Authentication:** Required (Customer or Admin)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Items per page (max 100) |
| status | string | No | - | Filter by status |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "car": {
        "id": "uuid",
        "brand": "Toyota",
        "model": "Avanza",
        "images": ["url"]
      },
      "pickupLocation": {
        "name": "Yogyakarta Airport"
      },
      "dropoffLocation": {
        "name": "Yogyakarta City Center"
      },
      "startDate": "2026-01-25",
      "endDate": "2026-01-28",
      "days": 3,
      "totalPrice": 1200000,
      "status": "PENDING",
      "createdAt": "2026-01-19T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Errors:**
- `401` - Unauthorized

---

### 3.3 Get Booking Details (Customer)
**GET** `/api/bookings/my/:id`

**Description:** Get detailed information about a specific booking

**Authentication:** Required (Customer or Admin)

**Path Parameters:**
- `id` (uuid): Booking ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "car": {
      "id": "uuid",
      "brand": "Toyota",
      "model": "Avanza",
      "year": 2023,
      "type": "MPV",
      "seats": 7,
      "transmission": "AT",
      "images": ["url"]
    },
    "pickupLocation": {
      "id": "uuid",
      "name": "Yogyakarta Airport",
      "address": "Jl. Raya Solo Km 10"
    },
    "dropoffLocation": {
      "id": "uuid",
      "name": "Yogyakarta City Center",
      "address": "Jl. Malioboro No 1"
    },
    "startDate": "2026-01-25",
    "endDate": "2026-01-28",
    "days": 3,
    "basePrice": 1050000,
    "addonPrice": 150000,
    "totalPrice": 1200000,
    "addons": [
      {
        "id": "uuid",
        "name": "GPS Navigation",
        "price": 50000
      },
      {
        "id": "uuid",
        "name": "Extra Insurance",
        "price": 100000
      }
    ],
    "status": "PENDING",
    "cancelReason": null,
    "createdAt": "2026-01-19T10:00:00Z",
    "updatedAt": "2026-01-19T10:00:00Z"
  }
}
```

**Authorization:**
- Customers can only view their own bookings
- Admins can view any booking

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not owner and not admin)
- `404` - Booking not found

---

### 3.4 Cancel Booking (Customer)
**POST** `/api/bookings/:id/cancel`

**Description:** Cancel a pending or confirmed booking

**Authentication:** Required (Customer or Admin)

**Path Parameters:**
- `id` (uuid): Booking ID

**Request Body:**
```json
{
  "reason": "string (optional, max 500)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelReason": "Trip postponed",
    "updatedAt": "2026-01-19T11:00:00Z"
  }
}
```

**Business Rules:**
1. **Customer Cancellation:**
   - Only allowed if `status` is `PENDING` or `CONFIRMED`
   - Only allowed if `NOW() < startDate` (before pickup date)
   - Customer can only cancel own bookings

2. **Admin Cancellation:**
   - Can cancel anytime (except `RETURNED`)
   - Must provide reason

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not owner and not admin)
- `404` - Booking not found
- `400` - Cannot cancel (already picked up, past start date, etc.)

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CANCELLATION_NOT_ALLOWED",
    "message": "Cannot cancel booking after pickup date has passed",
    "details": {
      "bookingId": "uuid",
      "startDate": "2026-01-18",
      "currentDate": "2026-01-19"
    }
  }
}
```

---

### 3.5 Get All Bookings (Admin)
**GET** `/api/admin/bookings`

**Description:** Get all bookings with advanced filtering

**Authentication:** Required (Admin only)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Items per page (max 100) |
| status | string | No | - | Filter by status |
| carId | uuid | No | - | Filter by car |
| userId | uuid | No | - | Filter by user |
| startDate | string | No | - | Filter bookings starting from date |
| endDate | string | No | - | Filter bookings ending before date |
| sort | string | No | createdAt | Sort field (createdAt, startDate, totalPrice) |
| order | string | No | desc | Sort order (asc, desc) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "car": {
        "id": "uuid",
        "brand": "Toyota",
        "model": "Avanza"
      },
      "pickupLocation": {
        "name": "Yogyakarta Airport"
      },
      "dropoffLocation": {
        "name": "Yogyakarta City Center"
      },
      "startDate": "2026-01-25",
      "endDate": "2026-01-28",
      "days": 3,
      "totalPrice": 1200000,
      "status": "PENDING",
      "createdAt": "2026-01-19T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)

---

### 3.6 Update Booking Status (Admin)
**PATCH** `/api/admin/bookings/:id/status`

**Description:** Update booking status through lifecycle

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (uuid): Booking ID

**Request Body:**
```json
{
  "status": "string (required, enum: CONFIRMED|PICKED_UP|RETURNED|CANCELLED)",
  "cancelReason": "string (required if status=CANCELLED, max 500)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CONFIRMED",
    "updatedAt": "2026-01-19T12:00:00Z"
  }
}
```

**Status Transition Rules:**
| From | To | Allowed |
|------|-----|---------|
| PENDING | CONFIRMED | ✅ |
| PENDING | CANCELLED | ✅ |
| CONFIRMED | PICKED_UP | ✅ |
| CONFIRMED | CANCELLED | ✅ |
| PICKED_UP | RETURNED | ✅ |
| PICKED_UP | CANCELLED | ❌ (use RETURNED instead) |
| RETURNED | Any | ❌ (terminal state) |
| CANCELLED | Any | ❌ (terminal state) |

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Booking not found
- `400` - Invalid status transition

**Side Effects:**
- Audit log entry created with before/after state

---

## 4. Location & Addon Endpoints

### 4.1 Get All Locations
**GET** `/api/locations`

**Description:** Get all active pickup/dropoff locations

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Yogyakarta Airport",
      "address": "Jl. Raya Solo Km 10",
      "isActive": true
    },
    {
      "id": "uuid",
      "name": "Yogyakarta City Center",
      "address": "Jl. Malioboro No 1",
      "isActive": true
    }
  ]
}
```

---

### 4.2 Get All Addons
**GET** `/api/addons`

**Description:** Get all active rental add-ons

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "GPS Navigation",
      "description": "Garmin GPS device with Indonesia maps",
      "pricePerBooking": 50000,
      "isActive": true
    },
    {
      "id": "uuid",
      "name": "Child Safety Seat",
      "description": "For children 1-4 years old",
      "pricePerBooking": 30000,
      "isActive": true
    },
    {
      "id": "uuid",
      "name": "Extra Insurance",
      "description": "Comprehensive coverage for accidents",
      "pricePerBooking": 100000,
      "isActive": true
    }
  ]
}
```

---

### 4.3 Create Location (Admin)
**POST** `/api/admin/locations`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "string (required, max 255)",
  "address": "string (optional, max 500)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Prambanan Temple Area",
    "address": "Jl. Raya Solo Km 16",
    "isActive": true,
    "createdAt": "2026-01-19T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden
- `409` - Location name already exists

---

### 4.4 Create Addon (Admin)
**POST** `/api/admin/addons`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "string (required, max 255)",
  "description": "string (optional, max 500)",
  "pricePerBooking": "number (required, >= 0)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Wifi Hotspot",
    "description": "Portable wifi device",
    "pricePerBooking": 40000,
    "isActive": true,
    "createdAt": "2026-01-19T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden
- `409` - Addon name already exists

---

## 5. Analytics Endpoints (Admin)

### 5.1 Get Summary KPIs
**GET** `/api/admin/analytics/summary`

**Description:** Get key performance indicators for dashboard

**Authentication:** Required (Admin only)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start of date range (default: 30 days ago) |
| endDate | string | No | End of date range (default: today) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalRevenue": 125000000,
    "totalBookings": 45,
    "cancellationRate": 17.8,
    "fleetUtilization": 62.5,
    "period": {
      "startDate": "2025-12-20",
      "endDate": "2026-01-19"
    }
  }
}
```

**Calculation Formulas:**

1. **Total Revenue:**
   ```sql
   SUM(totalPrice) WHERE status IN ('CONFIRMED', 'PICKED_UP', 'RETURNED')
   AND createdAt BETWEEN startDate AND endDate
   ```

2. **Total Bookings:**
   ```sql
   COUNT(*) WHERE createdAt BETWEEN startDate AND endDate
   ```

3. **Cancellation Rate:**
   ```sql
   (COUNT(*) WHERE status = 'CANCELLED') / (COUNT(*)) × 100
   WHERE createdAt BETWEEN startDate AND endDate
   ```

4. **Fleet Utilization:**
   ```sql
   (SUM(days) WHERE status IN ('CONFIRMED', 'PICKED_UP', 'RETURNED'))
   / (COUNT(ACTIVE cars) × days_in_period) × 100
   ```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden

---

### 5.2 Get Revenue Trend
**GET** `/api/admin/analytics/revenue-trend`

**Description:** Get daily/weekly revenue breakdown

**Authentication:** Required (Admin only)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| range | string | No | 7d | Time range (7d, 30d, 90d) |
| groupBy | string | No | day | Grouping (day, week, month) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-13",
      "bookingsCount": 3,
      "revenue": 2500000
    },
    {
      "date": "2026-01-14",
      "bookingsCount": 5,
      "revenue": 4200000
    },
    {
      "date": "2026-01-15",
      "bookingsCount": 2,
      "revenue": 1800000
    },
    {
      "date": "2026-01-16",
      "bookingsCount": 4,
      "revenue": 3100000
    },
    {
      "date": "2026-01-17",
      "bookingsCount": 6,
      "revenue": 5200000
    },
    {
      "date": "2026-01-18",
      "bookingsCount": 3,
      "revenue": 2700000
    },
    {
      "date": "2026-01-19",
      "bookingsCount": 2,
      "revenue": 1500000
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden

---

### 5.3 Get Top Cars
**GET** `/api/admin/analytics/top-cars`

**Description:** Get most popular cars by booking count

**Authentication:** Required (Admin only)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | No | 5 | Number of top cars (max 20) |
| startDate | string | No | - | Start of date range |
| endDate | string | No | - | End of date range |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "car": {
        "id": "uuid",
        "brand": "Toyota",
        "model": "Avanza",
        "type": "MPV",
        "images": ["url"]
      },
      "bookingsCount": 15,
      "totalRevenue": 12500000,
      "averagePrice": 833333
    },
    {
      "car": {
        "id": "uuid",
        "brand": "Honda",
        "model": "CR-V",
        "type": "SUV",
        "images": ["url"]
      },
      "bookingsCount": 12,
      "totalRevenue": 18000000,
      "averagePrice": 1500000
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden

---

### 5.4 Get Bookings by Status
**GET** `/api/admin/analytics/bookings-by-status`

**Description:** Get booking count distribution by status

**Authentication:** Required (Admin only)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "status": "PENDING",
      "count": 5,
      "percentage": 11.1
    },
    {
      "status": "CONFIRMED",
      "count": 10,
      "percentage": 22.2
    },
    {
      "status": "PICKED_UP",
      "count": 2,
      "percentage": 4.4
    },
    {
      "status": "RETURNED",
      "count": 20,
      "percentage": 44.4
    },
    {
      "status": "CANCELLED",
      "count": 8,
      "percentage": 17.8
    }
  ],
  "total": 45
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden

---

## 6. Common Patterns

### 6.1 Authentication Header
All authenticated requests must include JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6.2 Pagination Response Meta
```json
{
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### 6.3 Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... } // Optional for paginated responses
}
```

### 6.4 Timestamp Format
All timestamps use ISO 8601 format with UTC timezone:
```
2026-01-19T10:30:00Z
```

Dates (without time) use:
```
2026-01-19
```

### 6.5 Rate Limiting Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642589400
```

---

## 7. Error Responses

### 7.1 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional context (optional)
    }
  }
}
```

### 7.2 Standard Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 400 | INVALID_DATE_RANGE | End date must be after start date |
| 400 | CANCELLATION_NOT_ALLOWED | Cannot cancel booking (past date, wrong status) |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 401 | INVALID_CREDENTIALS | Email or password incorrect |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 404 | CAR_NOT_FOUND | Car with specified ID not found |
| 404 | BOOKING_NOT_FOUND | Booking with specified ID not found |
| 409 | CONFLICT | Resource conflict |
| 409 | EMAIL_ALREADY_EXISTS | Email already registered |
| 409 | CAR_NOT_AVAILABLE | Car already booked for selected dates |
| 409 | CAR_HAS_ACTIVE_BOOKINGS | Cannot deactivate car with active bookings |
| 422 | UNPROCESSABLE_ENTITY | Business rule violation |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | INTERNAL_SERVER_ERROR | Unexpected server error |

### 7.3 Validation Error Example
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": ["Invalid email format"],
        "password": ["Password must be at least 8 characters"],
        "startDate": ["Start date cannot be in the past"]
      }
    }
  }
}
```

---

## 8. Request/Response Examples

### 8.1 Complete Booking Flow

**Step 1: Browse Available Cars**
```bash
GET /api/cars?startDate=2026-01-25&endDate=2026-01-28&type=MPV&seats=7
```

**Step 2: View Car Details**
```bash
GET /api/cars/550e8400-e29b-41d4-a716-446655440000?startDate=2026-01-25&endDate=2026-01-28
```

**Step 3: Get Locations and Addons**
```bash
GET /api/locations
GET /api/addons
```

**Step 4: Create Booking**
```bash
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "carId": "550e8400-e29b-41d4-a716-446655440000",
  "pickupLocationId": "660e8400-e29b-41d4-a716-446655440001",
  "dropoffLocationId": "660e8400-e29b-41d4-a716-446655440002",
  "startDate": "2026-01-25",
  "endDate": "2026-01-28",
  "addonIds": [
    "770e8400-e29b-41d4-a716-446655440003",
    "770e8400-e29b-41d4-a716-446655440005"
  ]
}
```

**Step 5: View My Bookings**
```bash
GET /api/bookings/my
Authorization: Bearer <token>
```

**Step 6: Cancel Booking (if needed)**
```bash
POST /api/bookings/880e8400-e29b-41d4-a716-446655440010/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Trip postponed due to weather"
}
```

---

### 8.2 Admin Workflow

**Step 1: Login as Admin**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@carrental.com",
  "password": "Admin123!"
}
```

**Step 2: View All Bookings**
```bash
GET /api/admin/bookings?status=PENDING&page=1&limit=20
Authorization: Bearer <admin-token>
```

**Step 3: Confirm Booking**
```bash
PATCH /api/admin/bookings/880e8400-e29b-41d4-a716-446655440010/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Step 4: Add New Car**
```bash
POST /api/admin/cars
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "brand": "Honda",
  "model": "Brio",
  "year": 2024,
  "type": "HATCHBACK",
  "seats": 5,
  "transmission": "MT",
  "fuel": "GAS",
  "dailyPrice": 250000,
  "images": [
    "https://example.com/brio1.jpg",
    "https://example.com/brio2.jpg"
  ]
}
```

**Step 5: View Analytics**
```bash
GET /api/admin/analytics/summary?startDate=2025-12-20&endDate=2026-01-19
GET /api/admin/analytics/revenue-trend?range=30d
GET /api/admin/analytics/top-cars?limit=5
Authorization: Bearer <admin-token>
```

---

## 9. OpenAPI/Swagger Documentation

### 9.1 Swagger UI Endpoint
**GET** `/api-docs`

**Description:** Interactive API documentation

**Access:** Public (no authentication required)

**Features:**
- Try out endpoints directly
- View request/response schemas
- Download OpenAPI spec (JSON/YAML)

### 9.2 OpenAPI Spec
**GET** `/api-docs.json`

**Description:** Download OpenAPI 3.0 specification

---

## 10. Health & Monitoring

### 10.1 Health Check
**GET** `/health`

**Description:** Service health status

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T10:00:00Z",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "latency": 12
  },
  "version": "1.0.0"
}
```

---

## 11. Implementation Checklist

### 11.1 MVP Endpoints (Priority Order)
- [x] Authentication (register, login, me)
- [x] Car listing (public)
- [x] Car details (public)
- [x] Locations & Addons (public)
- [x] Create booking (customer)
- [x] My bookings (customer)
- [x] Cancel booking (customer)
- [x] Admin car CRUD
- [x] Admin booking management
- [x] Analytics endpoints

### 11.2 Stretch Features
- [ ] Refresh token rotation
- [ ] Email notifications (mock)
- [ ] Export bookings as CSV
- [ ] Webhook for booking status changes
- [ ] Advanced filtering (full-text search)

---

## 12. Testing & Development

### 12.1 Postman Collection
Available at: `/api-docs/postman` (export from Swagger)

### 12.2 Sample cURL Requests

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

**List Cars:**
```bash
curl http://localhost:3000/api/cars?type=SUV&seats=5
```

**Create Booking:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "carId": "uuid",
    "pickupLocationId": "uuid",
    "dropoffLocationId": "uuid",
    "startDate": "2026-01-25",
    "endDate": "2026-01-28",
    "addonIds": []
  }'
```

---

## 13. Frontend Integration Notes

### 13.1 State Management Recommendations
- **Auth state:** Store JWT in localStorage/sessionStorage
- **User data:** Fetch from `/api/auth/me` on app load
- **Car list:** Server-side pagination, client-side filters optional
- **Booking flow:** Multi-step form with price preview

### 13.2 Typical Frontend Routes
| Frontend Route | API Endpoints Used |
|----------------|-------------------|
| `/cars` | `GET /api/cars`, `GET /api/addons`, `GET /api/locations` |
| `/cars/:id` | `GET /api/cars/:id`, `GET /api/addons`, `GET /api/locations` |
| `/booking/new` | `POST /api/bookings` |
| `/my/bookings` | `GET /api/bookings/my` |
| `/my/bookings/:id` | `GET /api/bookings/my/:id`, `POST /api/bookings/:id/cancel` |
| `/admin/dashboard` | All `/api/admin/analytics/*` |
| `/admin/bookings` | `GET /api/admin/bookings`, `PATCH /api/admin/bookings/:id/status` |
| `/admin/cars` | `GET /api/cars`, `POST /api/admin/cars`, `PUT /api/admin/cars/:id` |

---

**Document Status:** ✅ Ready for Implementation
**Related Documents:**
- [Technical Requirements](./01-technical-requirements.md)
- [Database Schema](./02-database-schema.md)
- [Docker Setup](./04-docker-setup.md)
- [BRD](../brd.md)
