# SmartBus Unillanos — MVP

A data collection and analysis system for bus occupancy at Universidad de los Llanos (Villavicencio, Meta, Colombia).

---

## Prerequisites

Make sure the following tools are installed before starting:

| Tool | Minimum version | Verify installation |
|---|---|---|
| **.NET SDK** | 10.0 | `dotnet --version` |
| **Python** | 3.11 | `python --version` |
| **Node.js** | 18.0 | `node --version` |
| **npm** | 9.0 | `npm --version` |

---

## Project structure

```
MVP/
├── mini-identity-api-dotnet/   ← Authentication API (.NET 10)
├── trip-log-service/           ← Trip logging microservice (Python · FastAPI)
├── frontend/                   ← Web application (React + Vite)
├── 01_project_context.md       ← Full project context
├── 02_mvp_specification.md     ← MVP technical specification
└── README.md                   ← This file
```

---

## Running locally

Three terminals are required, one for each service. Start them in the order shown below.

### Terminal 1 — Authentication API (port 5000)

```powershell
cd mini-identity-api-dotnet\src\MiniIdentityApi.Api
dotnet run --urls "http://localhost:5000"
```

Wait for:
```
Now listening on: http://localhost:5000
```

### Terminal 2 — Trip log microservice (port 8000)

First time (create virtual environment and install dependencies):
```powershell
cd trip-log-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Subsequent runs:
```powershell
cd trip-log-service
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Wait for:
```
Application startup complete.
```

### Terminal 3 — Frontend (port 5173)

First time (install dependencies):
```powershell
cd frontend
npm install
```

Subsequent runs:
```powershell
cd frontend
npm run dev
```

Wait for:
```
Local:   http://localhost:5173/
```

---

## User registration (required once per restart)

Both MiniIdentity and trip-log-service use in-memory storage, so **all data is lost when the service restarts**. You must register at least one user each time you start MiniIdentity.

Open a fourth terminal or use PowerShell:

```powershell
$body = '{"username":"testuser","email":"test@unillanos.edu.co","password":"Test123!"}'
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -ContentType "application/json" -Body $body
```

Expected response:
```
message
-------
User registered successfully.
```

---

## Using the application

1. Open your browser at **http://localhost:5173**
2. Log in with the registered credentials:
   - **Username:** `testuser`
   - **Password:** `Test123!`
3. The **Dashboard** shows operational statistics and the available bus route
4. Click **Registrar Viaje** to register a trip with occupancy data and ML context variables
5. Click **Historial** to view all registered trips
6. Use **Descargar CSV** to export trip data

---

## LAN access from another device

To access the system from another computer on the same network:

### On the host machine

1. Find your local IP address:
   ```powershell
   ipconfig
   ```
   Note the **IPv4 Address** (e.g. `192.168.1.50`)

2. Start all services listening on all network interfaces:
   ```powershell
   # Terminal 1 — Auth
   dotnet run --urls "http://0.0.0.0:5000"

   # Terminal 2 — trip-log-service
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 3 — Frontend
   npm run dev -- --host
   ```

### On the other device

Open a browser and navigate to:
```
http://192.168.1.50:5173
```
(replace with your actual IP)

> **Note:** If Windows Firewall blocks the connection, run as Administrator:
> ```powershell
> netsh advfirewall firewall add rule name="SmartBus Auth" dir=in action=allow protocol=tcp localport=5000
> netsh advfirewall firewall add rule name="SmartBus Trips" dir=in action=allow protocol=tcp localport=8000
> netsh advfirewall firewall add rule name="SmartBus Frontend" dir=in action=allow protocol=tcp localport=5173
> ```

---

## Ports and services

| Service | Port | Technology | API documentation |
|---|---|---|---|
| MiniIdentity API | `5000` | .NET 10 / ASP.NET Core | `http://localhost:5000/swagger` |
| trip-log-service | `8000` | Python / FastAPI | `http://localhost:8000/docs` |
| Frontend | `5173` | React / Vite | — |

---

## Environment variables (trip-log-service)

The file `trip-log-service/.env` must contain:

```env
JWT_SECRET=THIS_IS_A_DEMO_KEY_CHANGE_IT_123456789
JWT_ISSUER=MiniIdentityApi
JWT_AUDIENCE=MiniIdentityApiUsers
PORT=8000
```

These values must match the JWT configuration in MiniIdentity's `appsettings.json`.

---

## Important notes

- **In-memory storage:** Both MiniIdentity and trip-log-service store data in memory. All data is lost when either service restarts.
- **Startup order:** Start MiniIdentity (port 5000) first, then trip-log-service (port 8000), and finally the frontend (port 5173).
- **CORS:** The frontend uses Vite's dev server proxy to avoid CORS issues with MiniIdentity. No additional CORS configuration is needed.
- **Shared JWT secret:** The backend services do not communicate with each other. Both validate JWT tokens independently using the same shared secret key.
- **JWT claims:** MiniIdentity puts the user UUID in the `sub` claim and the username in `unique_name`. The trip-log-service reads `unique_name` for the `registered_by` field.
