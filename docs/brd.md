# Business Requirements Document (BRD) — Data-Driven Car Rental Web App (1-Week Build)

## 1) Product Summary
A lightweight, data-driven car rental web application that showcases:
- Search and filtering
- Availability and booking workflow
- Admin operations (fleet, pricing, bookings)
- Analytics dashboard (revenue, utilization, cancellation rate, popular cars)

**Goal for portfolio:** Demonstrate end-to-end CRUD + transactional flow + analytics + clean UI/UX + role-based access.

**Non-goal (for 1 week):** Real payment gateway, real driver KYC, complex insurance workflows, multi-branch logistics, dynamic driver assignment, real-time telematics.

---

## 2) Target Users & Roles
### 2.1 Customer (Guest / Logged-in)
- Browse cars
- View details and availability
- Create booking
- Manage own bookings (view, cancel)
- Optional: login/register for better experience

### 2.2 Admin
- Manage cars (fleet)
- Manage pricing rules
- Manage bookings (approve/confirm, mark picked-up/returned, cancel)
- See dashboard analytics

---

## 3) Core Use Cases (Must Support)
### Customer side
1. Browse car catalog
2. Filter/search cars (price, type, seats, transmission, fuel, availability date range)
3. View car detail page
4. Create booking (date range + pickup/dropoff location + add-ons)
5. View booking confirmation + booking status
6. View booking list + cancel booking (policy: only before pickup date)

### Admin side
1. Car management (create/edit/deactivate)
2. Booking management (status updates)
3. Pricing management (base daily price; weekend multiplier optional)
4. Analytics dashboard (KPIs + charts + tables)

---

## 4) Scope: 1-Week MVP Feature List
> Anything marked **MVP** is required. Anything marked **Stretch** only if time remains.

### 4.1 Customer Features (MVP)
- **Car Listing**
  - Grid list with pagination
  - Quick filters (type, seats, transmission, daily price range)
  - Sort (price low-high, most popular, newest)
- **Car Detail**
  - Photos carousel
  - Specs (seats, transmission, fuel, year)
  - Price breakdown (daily price × days, add-ons)
  - Availability widget (date range)
- **Booking Flow**
  - Date range selection
  - Pickup + dropoff location (simple dropdown)
  - Optional add-ons (GPS, child seat, insurance)
  - Booking summary before confirm
  - Booking created with status: `PENDING`
- **My Bookings**
  - List bookings + status badge
  - Booking detail page
  - Cancel booking (status changes to `CANCELLED`, only if now < pickup date)

### 4.2 Admin Features (MVP)
- **Admin Login** (simple role-based; can be seeded admin user)
- **Fleet Management**
  - Add new car
  - Edit car
  - Set car active/inactive
  - Upload image URL(s) (MVP uses URL input; file upload is Stretch)
- **Booking Management**
  - View list with filters by status/date
  - Update status:
    - `PENDING` → `CONFIRMED`
    - `CONFIRMED` → `PICKED_UP`
    - `PICKED_UP` → `RETURNED`
    - Any → `CANCELLED` (with reason)
- **Pricing Management**
  - Edit base daily price per car
  - Optional: weekend multiplier (Stretch)
- **Analytics Dashboard**
  - KPIs (cards):
    - Total Revenue (paid/confirmed or returned)
    - Total Bookings
    - Cancellation Rate
    - Fleet Utilization %
  - Charts:
    - Revenue trend by day/week
    - Bookings by status
    - Top cars by bookings
  - Table:
    - Recent bookings

### 4.3 Data-Driven Portfolio Add-ons (High Value, Still 1-Week Friendly)
- Audit log (who changed booking status + timestamp)
- Soft delete for cars (inactive)
- Simple rule engine:
  - Prevent overlapping bookings on the same car for the same date range
- Export CSV for admin bookings list (Stretch)

---

## 5) Data Model (Minimal, Portfolio-Friendly)
### 5.1 Entities
**User**
- id, name, email, passwordHash (or auth provider id), role (`CUSTOMER|ADMIN`), createdAt

**Car**
- id, brand, model, year
- type (`SUV|SEDAN|HATCHBACK|MPV|VAN`)
- seats (int), transmission (`AT|MT`), fuel (`GAS|DIESEL|EV`)
- dailyPrice (number)
- status (`ACTIVE|INACTIVE`)
- images (array of URLs)
- createdAt, updatedAt

**Location**
- id, name (e.g., “Yogyakarta City Center”)

**Addon**
- id, name, pricePerBooking (fixed), active

**Booking**
- id, userId, carId
- pickupLocationId, dropoffLocationId
- startDate, endDate (date)
- days (int, derived)
- basePrice, addonPrice, totalPrice (store final numbers)
- status (`PENDING|CONFIRMED|PICKED_UP|RETURNED|CANCELLED`)
- cancelReason (optional)
- createdAt, updatedAt

**BookingAddon**
- bookingId, addonId, price

**AuditLog** (optional but recommended)
- id, actorUserId, entityType, entityId, action, beforeJson, afterJson, createdAt

### 5.2 Critical Constraints (MVP)
- Booking overlap check per car:
  - No booking with status in (`PENDING`, `CONFIRMED`, `PICKED_UP`) may overlap the requested date range.
- Cancel policy:
  - Customer can cancel only before startDate.
- Derived fields:
  - days = endDate - startDate (minimum 1)

---

## 6) Business Rules
### 6.1 Pricing
- Total base = dailyPrice × days
- Add-ons are fixed per booking (MVP)
- totalPrice = basePrice + addonPrice
- Store computed numbers at booking time (don’t rely only on live car price)

### 6.2 Booking Status Lifecycle
- `PENDING` (created by customer)
- Admin actions:
  - confirm → `CONFIRMED`
  - mark pickup → `PICKED_UP`
  - mark return → `RETURNED`
  - cancel → `CANCELLED` (reason required)
- Customer actions:
  - cancel from `PENDING/CONFIRMED` if startDate not reached

### 6.3 Availability
- Car is “Available” for a date range if it has no overlapping booking in active statuses.
- Availability should be shown on listing (optional label) and enforced on booking submit.

---

## 7) Pages / Screens (MVP Sitemap)
### Public
- `/` Home (hero + search widget + featured cars)
- `/cars` Car listing + filters
- `/cars/:id` Car detail + booking widget
- `/login` `/register` (optional if you want auth)

### Customer (requires login for bookings list)
- `/my/bookings` bookings list
- `/my/bookings/:id` booking detail

### Admin
- `/admin` dashboard
- `/admin/cars` list
- `/admin/cars/new` create
- `/admin/cars/:id/edit` edit
- `/admin/bookings` list + management
- `/admin/bookings/:id` detail + status actions
- `/admin/settings` (locations, add-ons)

---

## 8) API Requirements (MVP)
> You can implement REST quickly; GraphQL is unnecessary for this scope.

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`

### Cars
- GET `/api/cars` (filters: type, seats, transmission, priceMin, priceMax, startDate, endDate, sort, page)
- GET `/api/cars/:id`
- (Admin) POST `/api/admin/cars`
- (Admin) PUT `/api/admin/cars/:id`
- (Admin) PATCH `/api/admin/cars/:id/status`

### Bookings
- (Customer) POST `/api/bookings` (create booking; enforces availability)
- (Customer) GET `/api/bookings/my`
- (Customer) GET `/api/bookings/my/:id`
- (Customer) POST `/api/bookings/:id/cancel`
- (Admin) GET `/api/admin/bookings` (filters: status, dateRange, carId)
- (Admin) PATCH `/api/admin/bookings/:id/status`

### Reference Data
- GET `/api/locations`
- GET `/api/addons`
- (Admin) POST/PUT for locations/addons (optional)

### Analytics (Admin)
- GET `/api/admin/analytics/summary` (KPIs)
- GET `/api/admin/analytics/revenue-trend?range=7d|30d`
- GET `/api/admin/analytics/top-cars?limit=5`

---

## 9) Analytics Definitions (MVP)
- **Total Revenue**: sum(totalPrice) of bookings with status in (`CONFIRMED`, `PICKED_UP`, `RETURNED`)  
  (or just `RETURNED` if you want stricter definition)
- **Total Bookings**: count(all bookings)
- **Cancellation Rate**: cancelled / total
- **Utilization %**:
  - For a date range: (sum(days booked for ACTIVE cars) / (number of ACTIVE cars × days in range)) × 100
- **Top Cars**: count bookings grouped by carId

---

## 10) Non-Functional Requirements
- Performance:
  - Cars list should load < 1.5s on typical broadband for 50 cars
  - Pagination server-side
- Security:
  - Role-based route guard for `/admin/*`
  - Validate ownership for `/my/bookings/:id`
- Data integrity:
  - Transaction or locking strategy for booking creation to prevent race conditions (keep simple: DB constraint + recheck)
- Observability (lightweight):
  - Server logs for booking create and status updates
  - Optional: AuditLog table

---

## 11) UI Style Guide (Portfolio-Ready, Fast to Build)

## 11.1 Visual Theme
- **Style:** Modern, clean, data-first, minimal decoration
- **Color usage:** Neutral base + 1 primary accent + semantic colors for status
- **Layout:** 12-column responsive grid, generous whitespace
- **Radius:** 12px for cards, 10px for inputs, 999px for pills
- **Shadows:** Subtle (avoid heavy shadows)

## 11.2 Typography
- Use 1 sans-serif family (system or Inter-like)
- Scale (suggested):
  - H1: 32–36
  - H2: 24–28
  - H3: 18–20
  - Body: 14–16
  - Caption: 12–13
- Line height:
  - Headings: 1.2–1.3
  - Body: 1.5–1.7

## 11.3 UI Components (Rules)
### Buttons
- Primary: solid fill, used only for main CTA on a screen
- Secondary: outline
- Tertiary: text button for low emphasis
- Rule: one Primary button per section to avoid CTA overload

### Forms
- Inputs have visible label (no label-only placeholders)
- Inline validation:
  - Show error message under field
  - Validate on blur + on submit
- Date range picker:
  - Always show computed days + price preview

### Cards
- Car card content order:
  1. Image
  2. Car name (Brand + Model)
  3. Specs row (seats, transmission, fuel)
  4. Price/day
  5. Availability badge (optional)
  6. CTA (View details)

### Tables (Admin)
- Sticky header
- Right-align currency columns
- Status uses colored pill badges
- Row actions:
  - Use kebab menu to keep layout clean

### Status Badges
- `PENDING`: neutral / amber
- `CONFIRMED`: blue
- `PICKED_UP`: purple
- `RETURNED`: green
- `CANCELLED`: red

### Loading & Empty States
- Use skeleton loaders on list pages
- Empty state must include:
  - A short explanation
  - A single action (e.g., “Clear filters”)

### Error States
- Top-level error banner on API failures
- Retry button for list pages

## 11.4 Dashboard UI Rules
- KPI cards at top (4 cards)
- One main chart (revenue trend) above the fold
- Supporting chart + table below
- Filters:
  - Date range selector (7d, 30d, custom)
  - Status filter for bookings table

---

## 12) Week Plan (Build Order That Fits 7 Days)
### Day 1: Foundation
- DB schema + seed data (cars, locations, addons, admin user)
- Auth + role guard

### Day 2: Cars
- `/cars` list with filters + pagination
- `/cars/:id` detail

### Day 3: Booking Creation
- Availability check + booking create endpoint
- Booking summary UI

### Day 4: Customer Bookings
- My bookings list/detail
- Cancel flow

### Day 5: Admin Ops
- Admin bookings list + status updates
- Admin cars CRUD

### Day 6: Analytics
- Analytics queries + dashboard UI
- Top cars + revenue trend

### Day 7: Polish
- Validation, empty states, skeletons
- Audit log (if time)
- Deploy + README screenshots + sample data guide

---

## 13) Acceptance Criteria (MVP Checklist)
### Customer
- Can filter cars by at least 4 criteria
- Can create booking and see correct totalPrice
- Cannot book a car for overlapping dates
- Can see own bookings and cancel before startDate

### Admin
- Can create/edit/deactivate cars
- Can update booking statuses following lifecycle rules
- Can see dashboard KPIs and at least 2 charts
- Analytics numbers match database truth for seeded dataset

---

## 14) Seed Data (So Your App Looks Alive)
- 20 cars across 4 types
- 5 locations
- 3 addons
- 40 historical bookings with mixed statuses for dashboard realism

---

## 15) Nice-to-Have (Stretch)
- File upload for car images (instead of URL)
- Coupon codes
- Email notifications (mock)
- PDF invoice download
- Multi-currency formatting and locale support
