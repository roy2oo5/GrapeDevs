import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.services.database import check_database, check_logistics_schema


logger = logging.getLogger("pulsegrid")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("Starting PulseGrid AI Backend...")
    if check_database():
        logger.info("Supabase PostgreSQL connected successfully!")
        missing_columns = check_logistics_schema()
        if missing_columns:
            logger.error(
                "Database migration 007 is incomplete. Missing: %s. "
                "Run server/supabase/migrations/007_internal_logistics.sql.",
                ", ".join(missing_columns),
            )
    else:
        logger.warning("Supabase PostgreSQL is not connected!")
    yield
    logger.info("Shutting down PulseGrid AI Backend...")