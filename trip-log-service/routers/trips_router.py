"""Trips router — protected CRUD and statistics endpoints."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth.jwt_validator import get_current_user
from models.trip import TripCreate, TripResponse
from storage.in_memory import compute_stats, get_all_trips, get_trip_by_id, save_trip

router = APIRouter()


@router.post("/trips", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(body: TripCreate, user: str = Depends(get_current_user)):
    """Register a new trip record."""
    trip = {
        "id": str(uuid.uuid4()),
        "route_id": body.route_id,
        "departure_time": body.departure_time,
        "passenger_count": body.passenger_count,
        "bus_id": body.bus_id,
        "weather": body.weather,
        "academic_week": body.academic_week,
        "special_event": body.special_event,
        "notes": body.notes,
        "registered_by": user,
        "created_at": datetime.now(timezone.utc),
    }
    save_trip(trip)
    return trip


@router.get("/trips/stats/summary")
async def trip_stats(user: str = Depends(get_current_user)):
    """Return occupancy summary statistics.

     This route is registered before ``/trips/{trip_id}`` so FastAPI
    does not interpret ``"stats"`` as a path parameter.
    """
    return compute_stats()


@router.get("/trips", response_model=list[TripResponse])
async def list_trips(
    route_id: str | None = Query(None),
    date: str | None = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    user: str = Depends(get_current_user),
):
    """List trips, optionally filtered by route and/or date (YYYY-MM-DD)."""
    return get_all_trips(route_id=route_id, date=date)


@router.get("/trips/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, user: str = Depends(get_current_user)):
    """Get a single trip by ID."""
    trip = get_trip_by_id(trip_id)
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )
    return trip
