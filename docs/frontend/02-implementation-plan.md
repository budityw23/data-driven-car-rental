# Frontend Implementation Plan

## Phase 1: Project Setup & Foundation
- [x] **Initialize Project**
  - Run `npx create-vite@latest frontend --template react-ts`.
  - Install dependencies: `react-router-dom`, `axios`, `@tanstack/react-query`, `lucide-react`, `date-fns`, `react-hook-form`.
  - Configure `vite.config.ts` (alias for `@/`).
  - Set up `eslint` and `prettier`.
- [x] **Testing Setup**
  - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
  - Configure `vitest.config.ts`.
  - Create a sample test to verify setup.
- [x] **Global Styling Setup**
  - Create `src/assets/styles/main.css` with CSS variables for the Design System.
  - Create `src/assets/styles/utils.css` for common utilities (flex, grid properties).
  - Clean up default Vite CSS.
- [x] **Core Components & Layout**
  - Create `Button`, `Input`, `Card` components.
  - Create `Navbar` and `Footer` components.
  - Create `MainLayout` wrapping the application.
- [x] **API Client Setup**
  - Configure `axios` instance with base URL (from env vars).
  - Add request interceptor to attach JWT token.
  - Add response interceptor to handle 401 (logout).
- [x] **Docker Setup**
  - Create `Dockerfile` (multistage: Node build -> Nginx serve).
  - Create `nginx.conf` for SPA routing (fallback to index.html).
  - Update root `docker-compose.yml` (if exists) or create one to include frontend service.

## Phase 2: Authentication System
- [x] **Auth Context**
  - Create `AuthContext` to store user state and methods (`login`, `register`, `logout`).
  - Implement `useAuth` hook.
  - Persist token in `localStorage`.
- [x] **Auth Pages**
  - Create `LoginPage` with form validation.
  - Create `RegisterPage` with form validation.
  - Connect to `/api/auth/login` and `/api/auth/register`.
- [x] **Route Protection**
  - Create `ProtectedRoute` component.
  - Implement role-based redirection (Admin vs Customer).

## Phase 3: Public Views (Discovery)
- [x] **Home Page**
  - Hero section.
  - Featured cars (fetching from API).
- [x] **Car Listing Page**
  - Fetch cars with pagination.
  - Implement Filter Sidebar (Type, Price, Seats).
  - Implement Sort dropdown.
  - Sync filters with URL query parameters.
- [x] **Car Detail Page**
  - Fetch single car details.
  - Display images gallery (carousel or grid).
  - Show specs and price.

## Phase 4: Booking Flow (Customer)
- [x] **Booking Widget (on Car Detail)**
  - Date Range Picker inputs.
  - Compute and show total price dynamically (Day difference * Daily Price + Addons).
  - Validation: specific car availability check via API (if supported) or just rely on submit error.
- [x] **Booking Submission**
  - `POST /api/bookings`.
  - Handle success (redirect to confirmation/my-bookings).
  - Handle conflict errors (show specific "already booked" message).
- [x] **My Bookings**
  - Create `MyBookingsPage`.
  - List bookings with status badges.
  - Implement "Cancel" action (with confirmation modal).

## Phase 5: Admin Dashboard
- [x] **Admin Layout**
  - Sidebar navigation (`/admin`, `/admin/cars`, `/admin/bookings`).
- [x] **Dashboard Home**
  - Fetch and display Analytics KPIs (Revenue, Utilization).
  - Render simple charts (maybe using a lightweight lib like `recharts` or CSS-only bars if minimal).
- [x] **Fleet Management**
  - `CarListPage` for Admin (Management view).
  - `CarFormPage` (Create/Edit).
  - Implement Soft Delete (Status toggle).
- [x] **Booking Management**
  - `AdminBookingsPage` with status filters.
  - Kanban or Table view.
  - Action buttons to change status (Confirm, Pickup, Return, Cancel).
  - [x] Integrate Real Analytics API.


## Phase 6: Polish & Verification
- [x] **Unit Testing**
  - Write tests for `dateUtils` (days calculation).
  - Write tests for `priceUtils` (total price, addons).
- [x] **Error Handling**
  - Create a Global Error Boundary or Toast system for API errors.
  - 404 Page.
- [x] **Loading States**
  - Skeleton loaders for Car Lists.
  - Spinners for button actions.
- [x] **Responsive Check**
  - Verify Mobile vs Desktop layouts.
- [x] **SEO Basics**
  - Meta tags (Title, Description) per page.

## Phase 7: Deployment Readiness
- [ ] **Environment Variables**
  - `.env.production` setup.
- [ ] **Build Check**
  - Run `npm run build` and preview.
