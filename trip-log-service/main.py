"""SmartBus Unillanos — trip-log-service entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.routes_router import router as routes_router
from routers.trips_router import router as trips_router

app = FastAPI(
    title="SmartBus trip-log-service",
    description="Microservicio de registro de viajes para Ruta Parque — MVP SmartBus Unillanos",
    version="0.1.0",
)

# Allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_router)
app.include_router(trips_router)


@app.get("/", tags=["health"])
async def health():
    """Health-check endpoint."""
    return {"status": "ok", "service": "trip-log-service"}
