import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Literal

from pydantic import BaseModel, Field

from app.api.routers.auth import get_current_hospital_admin
from app.core.config import get_settings


router = APIRouter(
    prefix="/forecast",
    tags=["Demand Forecasting"],
    dependencies=[Depends(get_current_hospital_admin)],
)


class ForecastRequest(BaseModel):
    hospital_id: str = Field(min_length=1)
    medicine_id: str = Field(min_length=1)
    horizon_days: Literal[7, 14] = 7
    outbreak_flag: int = Field(default=0, ge=0, le=1)


@router.post("/predict")
async def predict_forecast(payload: ForecastRequest):
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.FORECAST_SERVICE_URL.rstrip('/')}/predict",
                json=payload.model_dump(),
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Forecasting service is unavailable. Start the forecasting service on port 8010.",
        ) from exc

    if response.status_code >= 400:
        detail = response.json().get("detail", "Forecasting service rejected the request")
        raise HTTPException(status_code=response.status_code, detail=detail)
    return response.json()


@router.get("/health")
async def forecast_health():
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.FORECAST_SERVICE_URL.rstrip('/')}/health")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail="Forecasting service is unavailable") from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=503, detail="Forecasting service health check failed")
    return response.json()


@router.get("/model-info")
async def forecast_model_info():
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.FORECAST_SERVICE_URL.rstrip('/')}/model/info")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail="Forecasting service is unavailable") from exc
    if response.status_code >= 400:
        detail = response.json().get("detail", "Forecast model information is unavailable")
        raise HTTPException(status_code=response.status_code, detail=detail)
    return response.json()
