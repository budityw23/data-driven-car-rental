# Frontend Technical Design Document - Data-Driven Car Rental

## 8. Testing Strategy
- **Framework**: Vitest (fast, compatible with Vite).
- **Library**: React Testing Library (for component integration tests).
- **Scope**:
  - **Unit Tests**: Focus on complex logic in `src/utils` (e.g., price calculation, date differences) and `src/hooks`.
  - **Integration Tests**: Critical flows like "Booking Form Submission" (optional for MVP, good for portfolio).
  - **E2E**: Out of scope for Week 1.

## 1. Architecture Overview
The frontend will be a **Single Page Application (SPA)** built with **React** and **TypeScript**, using **Vite** as the build tool. It will communicate with the backend REST API via a typed HTTP client.

## 2. Technology Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Variables, Flexbox/Grid) with CSS Modules for component scoping.
  - *Rationale*: "Use Vanilla CSS for maximum flexibility" (as per User Rules) while maintaining modularity.
- **Routing**: React Router DOM v6
- **Data Fetching**: TanStack Query (React Query) v5
  - *Rationale*: Handles caching, loading states, and background updates efficiently.
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Icons**: Lucide React (Clean, modern icons)
- **Design System**: Custom "clean, data-first" design system implemented in CSS variables.

## 3. Directory Structure
```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/                # API integration
│   │   ├── client.ts       # Axios instance with interceptors
│   │   ├── auth.ts         # Auth related endpoints
│   │   ├── cars.ts         # Car related endpoints
│   │   ├── bookings.ts     # Booking endpoints
│   │   └── admin.ts        # Admin endpoints
│   ├── assets/             # Images, global styles
│   │   └── styles/
│   │       ├── main.css    # Global resets and variables
│   │       └── utils.css   # Utility classes
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Core UI (Button, Input, Card, Modal)
│   │   ├── layout/         # Layout components (Navbar, Sidebar, Footer)
│   │   └── shared/         # Feature-specific shared components
│   ├── contexts/           # Global state (AuthContext, ToastContext)
│   ├── hooks/              # Custom hooks (useAuth, useDebounce)
│   ├── pages/              # Page components (routed)
│   │   ├── public/         # Home, Cars, Login
│   │   ├── customer/       # Dashboard, Bookings
│   │   └── admin/          # Dashboard, Fleet Mgmt, Analytics
│   ├── types/              # TypeScript definitions (User, Car, Booking)
│   ├── utils/              # Helper functions (currency formatter, date calc)
│   ├── App.tsx             # Root component with Routing
│   └── main.tsx            # Entry point
```

## 4. UI Design System (CSS Variables)
We will define a global theme in `index.css`:
```css
:root {
  /* Colors */
  --primary: #2563eb;       /* Royal Blue */
  --primary-dark: #1e40af;
  --bg-body: #f8fafc;       /* Light Slate */
  --bg-card: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border: #e2e8f0;

  /* Status Colors */
  --status-pending: #f59e0b;
  --status-confirmed: #3b82f6;
  --status-active: #22c55e;
  --status-error: #ef4444;

  /* Spacing & Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --container-max: 1280px;
}
```

## 5. State Management Strategy
1.  **Server State**: handled by React Query (Cars, Bookings, Analytics).
2.  **Auth State**: handled by `AuthContext` (User profile, Token persistence in localStorage).
3.  **Form State**: handled by React Hook Form.
4.  **UI State**: Local component state (Modal open/close).

## 6. Authentication Flow
- **Login**: `POST /auth/login` -> Receive JWT -> Store in `localStorage` & `axios` header -> Update AuthContext -> Redirect.
- **Guard**: `ProtectedRoute` component checks AuthContext. If no user, redirect to `/login`.
- **Role Guard**: Checks `user.role` (CUSTOMER vs ADMIN).

## 9. Deployment & Containerization
- **Container**: Docker Multi-stage build.
  - **Stage 1 (Builder)**: Node image to build the static assets (`npm run build`).
  - **Stage 2 (Runner)**: Nginx Alpine image to serve the static files.
- **Orchestration**: `docker-compose.yml` to run alongside the backend.
  - **Service Name**: `frontend`
  - **Port**: 80 (mapped to host 3000 or similar).

