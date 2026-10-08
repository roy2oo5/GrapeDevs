import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.services.database import check_database


logger = logging.getLogger("pulsegrid")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("Starting PulseGrid AI Backend...")
    if check_database():
        logger.info("Supabase PostgreSQL connected successfully!")
    else:
        logger.warning("Supabase PostgreSQL is not connected!")
    yield
    logger.info("Shutting down PulseGrid AI Backend...")