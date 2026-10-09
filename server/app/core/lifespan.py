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
                "Database migrations are incomplete. Missing: %s. "
                "Run the required migrations in server/supabase/migrations/.",
                ", ".join(missing_columns),
            )
    else:
        logger.warning("Supabase PostgreSQL is not connected!")
    yield
    logger.info("Shutting down PulseGrid AI Backend...")