from fastapi import APIRouter

from app.api.routers import agreements, auth, dashboard, data, forecast, health, hospitals, inventory, marketplace, operations, transfers


api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(hospitals.router)
api_router.include_router(inventory.router)
api_router.include_router(transfers.router)
api_router.include_router(marketplace.router)
api_router.include_router(agreements.router)
api_router.include_router(operations.router)
api_router.include_router(forecast.router)
api_router.include_router(data.router)