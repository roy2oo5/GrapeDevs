from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.api.routers.system import router as system_router
from app.api.routers.realtime import router as realtime_router
from app.core.config import get_settings
from app.core.lifespan import lifespan


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.APP_NAME,
        description=(
            "AI-powered medical supply forecasting, "
            "shortage intelligence, and MOU-aware redistribution."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    @application.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "error_type": type(exc).__name__, "traceback": traceback.format_exc()},
        )

    application.include_router(system_router)
    application.include_router(realtime_router)
    application.include_router(api_router)
    return application


app = create_app()