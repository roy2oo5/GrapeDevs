from functools import lru_cache
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

@lru_cache
def get_engine():
    database_url = get_settings().DATABASE_URL

    if not database_url or not database_url.strip():
        raise RuntimeError(
            "DATABASE_URL is missing or empty. "
            "Add your Supabase PostgreSQL connection string to .env."
        )

    url = make_url(database_url)
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+psycopg")
    if url.drivername == "postgresql+psycopg":
        query = dict(url.query)
        query.setdefault("sslmode", "require")
        url = url.set(query=query)

    return create_engine(
        url,
        pool_size=5,
        max_overflow=0,
        pool_pre_ping=True,
        pool_recycle=1800,
    )


@lru_cache
def get_session_factory():
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()