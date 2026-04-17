"""Trip Pydantic models — input and output."""

from datetime import datetime
from pydantic import BaseModel, Field


class TripCreate(BaseModel):
    route_id: str
    departure_time: datetime
    passenger_count: int = Field(ge=0, le=100)
    bus_id: str
    notes: str | None = None


class TripResponse(BaseModel):
    id: str
    route_id: str
    departure_time: datetime
    passenger_count: int
    bus_id: str
    notes: str | None
    registered_by: str  # username extracted from JWT
    created_at: datetime
