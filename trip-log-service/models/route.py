"""Route Pydantic model."""

from pydantic import BaseModel


class RouteInfo(BaseModel):
    id: str
    name: str
    description: str
    schedule: list[str]  # list of "HH:MM" strings
