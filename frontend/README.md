# SmartBus Unillanos — Frontend (React + Vite)

A single-page application built with React and Vite for:
- authenticating users via MiniIdentity API
- viewing bus route information and departure schedules
- registering trip records with occupancy and ML context variables
- reviewing trip history and operational statistics

This project is the user-facing interface of the **SmartBus Unillanos** MVP. It acts as the sole orchestrator between the two backend microservices (MiniIdentity and trip-log-service).

---

## Architecture

The frontend follows a flat component-based architecture:

- **pages/**: full-screen views mapped to routes.
- **api/**: HTTP client modules for each backend service.
- **context/**: React Context providers for global state (authentication).
- **index.css**: complete design system with CSS custom properties.

```text
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── authApi.js          # MiniIdentity HTTP client
│   │   └── tripApi.js          # trip-log-service HTTP client
│   ├── context/
│   │   └── AuthContext.jsx     # JWT state management
│   ├── pages/
│   │   ├── LoginPage.jsx       # Authentication screen
│   │   ├── DashboardPage.jsx   # Main overview screen
│   │   ├── RegisterTripPage.jsx # Trip registration form
│   │   └── TripHistoryPage.jsx # Trip history table
│   ├── App.jsx                 # Router and route definitions
│   ├── main.jsx                # React root render
│   └── index.css               # Global design system
├── index.html
├── vite.config.js
└── package.json
```

---

## What each page does

### LoginPage (`/login`)
Handles user authentication.

Features:
- Username/email and password form.
- Sends credentials to MiniIdentity via `POST /api/auth/login`.
- Stores the JWT in `localStorage` on success.
- Redirects to `/dashboard` after login.
- Redirects authenticated users away from login automatically.

### DashboardPage (`/dashboard`)
Main overview screen after login.

Features:
- Welcome bar with user avatar (initial letter) and username.
- Operational summary with four stat cards:
  - **Total trips registered**: count of all trip records.
  - **Average passengers**: mean passenger count across all trips.
  - **Max passengers**: highest recorded passenger count.
  - **Peak hour**: the departure hour with the highest average occupancy.
- Route catalog section showing Ruta Parque with:
  - Animated gradient border.
  - Active status badge with pulsing dot.
  - All 37 departure times displayed as interactive pills.
- Navigation buttons: Register Trip, History, Logout.

### RegisterTripPage (`/trips/new`)
Form to register a new bus trip record.

Features:
- **Trip data section**:
  - Route selector (populated from API).
  - Departure date (date input).
  - Departure time (time input).
  - Passenger count (0–100).
  - Bus ID (text).
- **ML context section**:
  - Weather selector: Soleado, Nublado, Lluvioso.
  - Academic week selector (1–18) with labels for key periods (Inicio, Parciales, Finales, Cierre).
  - Special event checkbox.
- Notes field (optional).
- Redirects to History on success.

### TripHistoryPage (`/trips`)
Table showing all registered trip records.

Features:
- Nine-column table: Route, Bus, Date, Time, Passengers, Weather (colored badge), Academic Week, Special Event, Registered By.
- **CSV export**: download all trip records as a `.csv` file (client-side generation with UTF-8 BOM for Excel compatibility).
- Empty state with icon when no trips exist.
- Navigation to register new trip or return to dashboard.

---

## Authentication flow

1. User enters credentials on `LoginPage`.
2. Frontend calls `POST /api/auth/login` on MiniIdentity (via Vite proxy).
3. MiniIdentity returns `{ accessToken, tokenType, username, ... }`.
4. Frontend normalizes to `{ token }` and stores in `localStorage`.
5. `AuthContext` decodes the JWT payload to extract `unique_name` as the display username.
6. All subsequent API calls to trip-log-service include `Authorization: Bearer <token>`.
7. Logout removes the token from `localStorage` and redirects to `/login`.

---

## API modules

### authApi.js
HTTP client for MiniIdentity.

| Function | Endpoint | Description |
|---|---|---|
| `loginUser(usernameOrEmail, password)` | `POST /api/auth/login` | Authenticates and returns `{ token }` |
| `registerUser(username, email, password)` | `POST /api/auth/register` | Registers a new user account |

### tripApi.js
HTTP client for trip-log-service.

| Function | Endpoint | Description |
|---|---|---|
| `getRoutes()` | `GET /routes` | Fetches available bus routes (public) |
| `getTrips(token)` | `GET /trips` | Fetches all trip records (auth required) |
| `createTrip(token, data)` | `POST /trips` | Registers a new trip (auth required) |
| `getTripStats(token)` | `GET /trips/stats/summary` | Fetches occupancy statistics (auth required) |

---

## Context providers

### AuthContext
Global authentication state using React Context API.

Exposed values:
- `token`: the raw JWT string (or `null`).
- `user`: the decoded username from `unique_name` claim.
- `login(jwt)`: stores the token and updates user state.
- `logout()`: clears the token and user state.

---

## Design system

The UI uses a premium dark-mode design with:
- **Glassmorphism**: `backdrop-filter: blur()` on cards and inputs.
- **CSS custom properties**: all colors, spacing, and transitions are tokenized.
- **SVG icons**: all icons are inline SVG (no emoji, no icon libraries).
- **Micro-animations**: fade-in on page load, hover lift on cards, pulsing status dot.
- **Animated gradient border**: route card uses a rotating gradient border (`gradientShift` keyframe).
- **Typography**: Inter font from Google Fonts.

---

## Vite proxy configuration

All API requests are routed through Vite's dev server proxy. This avoids CORS issues and enables LAN access from other devices.

```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',   // MiniIdentity
      changeOrigin: true,
    },
    '/routes': {
      target: 'http://localhost:8000',   // trip-log-service
      changeOrigin: true,
      bypass(req) {
        if (req.headers.accept?.includes('text/html')) return req.url;
      },
    },
    '/trips': {
      target: 'http://localhost:8000',   // trip-log-service
      changeOrigin: true,
      bypass(req) {
        if (req.headers.accept?.includes('text/html')) return req.url;
      },
    },
  },
}
```

The `bypass` function ensures that browser page refreshes (which send `Accept: text/html`) are served by the SPA instead of being proxied to the backend (which would return 401).

---

## Requirements

- Node.js 18+ 
- npm 9+

### Dependencies

| Package | Purpose |
|---|---|
| `react` | UI component library |
| `react-dom` | DOM rendering |
| `react-router-dom` | Client-side routing |

---

## Running the frontend

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Required backend services

The frontend requires both backends to be running:

| Service | URL | Purpose |
|---|---|---|
| MiniIdentity API | `http://localhost:5000` | User authentication (proxied via Vite) |
| trip-log-service | `http://localhost:8000` | Trip data and statistics |

---

## Important notes

- The frontend **never** communicates directly with backend ports from the browser. All requests go through Vite's proxy (`/api` → port 5000, `/routes` and `/trips` → port 8000).
- This proxy architecture enables LAN access: other devices only need to reach port 5173.
- JWT tokens are stored in `localStorage` under the key `smartbus_token`.
- MiniIdentity returns `accessToken` in its login response; `authApi.js` normalizes this to `token` for internal consistency.
- The `sub` claim in MiniIdentity JWTs contains a UUID, not the username. The username is in `unique_name`.
