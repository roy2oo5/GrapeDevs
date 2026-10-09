from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = SERVER_DIR.parent


class Settings(BaseSettings):
    APP_NAME: str = "PulseGrid AI"
    APP_ENV: str = "development"

    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    DATABASE_URL: str = ""
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://grape-devs.vercel.app"
    )
    AUTH_TOKEN_SECRET: str = ""
    AUTH_TOKEN_TTL_MINUTES: int = 60
    FORECAST_SERVICE_URL: str = "https://modeling-dopk.onrender.com"

    model_config = SettingsConfigDict(
        env_file=[SERVER_DIR / ".env", PROJECT_ROOT / ".env"],
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()