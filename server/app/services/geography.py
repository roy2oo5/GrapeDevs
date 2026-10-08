from __future__ import annotations

from math import asin, cos, radians, sin, sqrt
from typing import Any


MAX_HOSPITAL_DISTANCE_KM = 50.0


def hospital_coordinates(settings: dict[str, Any] | None) -> tuple[float, float] | None:
    if not settings:
        return None
    try:
        latitude = float(settings["latitude"])
        longitude = float(settings["longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return None
    return latitude, longitude


def distance_between_hospitals(first: Any, second: Any) -> float | None:
    if first is None or second is None:
        return None
    first_coordinates = hospital_coordinates(first.settings)
    second_coordinates = hospital_coordinates(second.settings)
    if first_coordinates is None or second_coordinates is None:
        return None

    first_latitude, first_longitude = first_coordinates
    second_latitude, second_longitude = second_coordinates
    latitude_delta = radians(second_latitude - first_latitude)
    longitude_delta = radians(second_longitude - first_longitude)
    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(radians(first_latitude))
        * cos(radians(second_latitude))
        * sin(longitude_delta / 2) ** 2
    )
    return 6371.0 * 2 * asin(sqrt(haversine))


def is_within_hospital_radius(first: Any, second: Any) -> bool:
    distance = distance_between_hospitals(first, second)
    return distance is not None and distance <= MAX_HOSPITAL_DISTANCE_KM
