"""In-memory trip storage — no database required for the MVP."""

from collections import defaultdict

trips_db: list[dict] = []


def save_trip(trip: dict) -> dict:
    """Append a trip record and return it."""
    trips_db.append(trip)
    return trip


def get_all_trips(route_id: str | None = None, date: str | None = None) -> list[dict]:
    """Return all trips, optionally filtered by route_id and/or date (YYYY-MM-DD)."""
    results = trips_db
    if route_id:
        results = [t for t in results if t["route_id"] == route_id]
    if date:
        results = [
            t for t in results
            if t["departure_time"].strftime("%Y-%m-%d") == date
        ]
    return results


def get_trip_by_id(trip_id: str) -> dict | None:
    """Return a single trip by its id, or None."""
    for trip in trips_db:
        if trip["id"] == trip_id:
            return trip
    return None


def compute_stats() -> dict:
    """Compute summary statistics over all stored trips."""
    if not trips_db:
        return {
            "total_trips": 0,
            "average_passengers": 0.0,
            "max_passengers": 0,
            "min_passengers": 0,
            "busiest_hour": None,
        }

    counts = [t["passenger_count"] for t in trips_db]
    total = len(counts)
    avg = round(sum(counts) / total, 1)

    # Busiest hour: the hour with the highest average passenger count
    hour_totals: dict[str, list[int]] = defaultdict(list)
    for t in trips_db:
        hour_key = t["departure_time"].strftime("%H:00")
        hour_totals[hour_key].append(t["passenger_count"])

    busiest_hour = max(
        hour_totals,
        key=lambda h: sum(hour_totals[h]) / len(hour_totals[h]),
    )

    return {
        "total_trips": total,
        "average_passengers": avg,
        "max_passengers": max(counts),
        "min_passengers": min(counts),
        "busiest_hour": busiest_hour,
    }
