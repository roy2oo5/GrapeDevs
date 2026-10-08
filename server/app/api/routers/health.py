import platform
from time import monotonic

from fastapi import APIRouter

from app.core.config import get_settings


router = APIRouter(tags=["System"])
started_at = monotonic()


@router.get("/health")
def api_health():
    settings = get_settings()
    return {
        "status": "healthy",
        "application": settings.APP_NAME,
        "backend": "running",
        "framework": "FastAPI",
        "environment": settings.APP_ENV,
        "python_version": platform.python_version(),
        "uptime_seconds": monotonic() - started_at,
    }