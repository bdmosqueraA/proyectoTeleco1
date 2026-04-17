# trip-log-service (Python · FastAPI)

A RESTful microservice built with FastAPI for:
- registering bus trip records with occupancy data
- querying trip history with optional filters
- computing occupancy statistics (average, max, peak hour)
- collecting structured ML variables (weather, academic week, special events)

This project is part of the **SmartBus Unillanos** MVP. Its purpose is to gather historical ridership data that will eventually feed machine learning models for dynamic frequency optimization.

---

## Architecture

The service follows a flat, minimalist architecture suitable for an MVP:

- **main.py**: configures the FastAPI application, CORS middleware, and includes routers.
- **config.py**: loads environment variables (JWT secret, issuer, audience) from `.env`.
- **auth/jwt_validator.py**: validates JWT tokens independently using the shared secret.
- **models/**: contains Pydantic schemas for request validation and response serialization.
- **routers/**: contains endpoint definitions grouped by resource.
- **storage/in_memory.py**: in-memory data store (list-based). Data resets on restart.

```text
trip-log-service/
├── auth/
│   └── jwt_validator.py
├── models/
│   ├── route.py
│   └── trip.py
├── routers/
│   ├── routes_router.py
│   └── trips_router.py
├── storage/
│   └── in_memory.py
├── config.py
├── main.py
├── requirements.txt
├── .env
└── .env.example
```

---

## What each router does

### RoutesRouter

Handles route catalog queries. No authentication required.

Endpoints:
- `GET /routes`: returns all available bus routes with their schedules.

### TripsRouter

Handles trip record CRUD and statistics. All endpoints require a valid JWT.

Endpoints:
- `POST /trips`: registers a new trip record.
- `GET /trips`: lists all trips, optionally filtered by `route_id` and/or `date`.
- `GET /trips/{trip_id}`: returns a single trip by ID.
- `GET /trips/stats/summary`: returns aggregated occupancy statistics.

---

## Data model

### TripCreate (input)

| Field | Type | Required | Description |
|---|---|---|---|
| `route_id` | string | yes | ID of the bus route |
| `departure_time` | datetime | yes | Date and time the bus departed |
| `passenger_count` | int (0–100) | yes | Number of passengers on board |
| `bus_id` | string | yes | Identifier of the bus unit |
| `weather` | enum | no | `SOLEADO`, `NUBLADO`, or `LLUVIOSO`. Defaults to `SOLEADO` |
| `academic_week` | int (1–18) | no | Week number within the academic semester. Defaults to `1` |
| `special_event` | bool | no | Whether a special campus event is happening. Defaults to `false` |
| `notes` | string | no | Free-text observations |

### TripResponse (output)

All fields from `TripCreate` plus:

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique trip identifier |
| `registered_by` | string | Username extracted from the JWT `unique_name` claim |
| `created_at` | datetime | UTC timestamp of when the record was created |

### RouteInfo

| Field | Type | Description |
|---|---|---|
| `id` | string | Route identifier (e.g. `ruta_parque`) |
| `name` | string | Human-readable name (e.g. `Ruta Parque`) |
| `description` | string | Origin → destination description |
| `schedule` | list[string] | List of departure times (e.g. `["05:20", "05:40", ...]`) |

---

## ML context variables

These fields were added specifically to support future machine learning models for demand prediction:

| Variable | Why it matters |
|---|---|
| **weather** | Rainy conditions significantly affect bus ridership at Unillanos. Students may choose alternative transport or skip classes entirely. |
| **academic_week** | Demand varies dramatically between regular weeks, midterms (parciales), and finals. Week 1 and week 16–18 have distinct patterns. |
| **special_event** | Campus events (induction week, sports events, assemblies) create abnormal demand spikes that would confuse a model without this flag. |

---

## Authentication

This service does **not** issue tokens. It only validates them.

- Tokens are issued by **MiniIdentity API** (the auth service).
- Validation uses the shared HS256 secret key.
- The `unique_name` claim is extracted as the user identity.
- If `unique_name` is absent, falls back to the `sub` claim.

JWT configuration is loaded from environment variables:

| Variable | Value |
|---|---|
| `JWT_SECRET` | `THIS_IS_A_DEMO_KEY_CHANGE_IT_123456789` |
| `JWT_ISSUER` | `MiniIdentityApi` |
| `JWT_AUDIENCE` | `MiniIdentityApiUsers` |

---

## Storage

The MVP uses **in-memory storage** (a Python list). Data is lost when the service restarts
. This is intentional for the pilot phase.

The storage module exposes four functions:

| Function | Description |
|---|---|
| `save_trip(trip)` | Appends a trip dict to the list |
| `get_all_trips(route_id, date)` | Returns trips with optional filters |
| `get_trip_by_id(trip_id)` | Returns a single trip or `None` |
| `compute_stats()` | Calculates total trips, average/max/min passengers, and busiest hour |

Future versions will replace this with **PostgreSQL + TimescaleDB**.

---

## Configuration

Create a `.env` file in the project root (or copy from `.env.example`):

```env
JWT_SECRET=THIS_IS_A_DEMO_KEY_CHANGE_IT_123456789
JWT_ISSUER=MiniIdentityApi
JWT_AUDIENCE=MiniIdentityApiUsers
PORT=8000
```

---

## Requirements

Install dependencies inside a virtual environment:

```bash
python -m venv venv
.\venv\Scripts\activate       # Windows
# source venv/bin/activate    # Linux/macOS

pip install -r requirements.txt
```

### requirements.txt

```text
fastapi>=0.111
uvicorn>=0.29
pyjwt>=2.8
python-dotenv>=1.0
```

---

## Running the service

```bash
uvicorn main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`.

---

## Swagger URL

Interactive API documentation is auto-generated and available at:

```text
http://localhost:8000/docs
```

---

## Example requests

### Get routes (public)
`GET /routes`

Response:
```json
[
  {
    "id": "ruta_parque",
    "name": "Ruta Parque",
    "description": "Parque de los Estudiantes → Campus Unillanos",
    "schedule": ["05:20", "05:40", "06:00", "..."]
  }
]
```

### Register a trip (requires JWT)
`POST /trips`

Headers:
```text
Authorization: Bearer eyJ...
```

Body:
```json
{
  "route_id": "ruta_parque",
  "departure_time": "2026-04-16T06:20:00",
  "passenger_count": 45,
  "bus_id": "BUS-01",
  "weather": "LLUVIOSO",
  "academic_week": 8,
  "special_event": false,
  "notes": "Lluvia fuerte, algunos estudiantes esperaron el siguiente bus."
}
```

### Get trip statistics (requires JWT)
`GET /trips/stats/summary`

Response:
```json
{
  "total_trips": 12,
  "average_passengers": 38.5,
  "max_passengers": 60,
  "min_passengers": 8,
  "busiest_hour": "07:00"
}
```

### List trips with filters (requires JWT)
`GET /trips?route_id=ruta_parque&date=2026-04-16`

---

## Important notes

- The route `/trips/stats/summary` is registered **before** `/trips/{trip_id}` in the router to prevent FastAPI from interpreting `"stats"` as a path parameter.
- CORS is configured to allow all origins (`*`) for development. This must be restricted in production.
- The `Weather` enum only accepts: `SOLEADO`, `NUBLADO`, `LLUVIOSO` (uppercase).
