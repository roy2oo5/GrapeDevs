import platform
from time import monotonic

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.services.database import check_database


router = APIRouter(tags=["System"])
started_at = monotonic()


@router.get("/")
def root():
    return {
        "application": get_settings().APP_NAME,
        "message": "PulseGrid AI Backend is running",
        "docs": "/docs",
    }


@router.get("/health")
def health_check():
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


@router.get("/health/db")
def database_health_check():
    if not check_database():
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {
        "status": "healthy",
        "database": "connected",
        "provider": "Supabase PostgreSQL",
    }