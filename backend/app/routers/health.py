import sys
import time
from fastapi import APIRouter
from app.models.schemas import HealthStatus
from app.core.config import settings

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/health", response_model=HealthStatus)
async def get_health():
    """
    Check backend telemetry, runtime state, and uptime.
    """
    return HealthStatus(
        status="online",
        framework="FastAPI",
        environment="development" if settings.DEBUG else "production",
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        uptime_seconds=time.time() - START_TIME
    )
