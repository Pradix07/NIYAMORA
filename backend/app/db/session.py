import os
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

def validate_database_configuration(db_url: Optional[str] = None, environment: Optional[str] = None) -> None:
    """
    Ensures production environments strictly connect to PostgreSQL and fail fast if SQLite or empty URL is given.
    """
    env = (environment if environment is not None else (os.getenv("ENVIRONMENT") or settings.ENVIRONMENT)).lower().strip()
    url = (db_url if db_url is not None else (os.getenv("DATABASE_URL") or settings.DATABASE_URL)).strip()
    if env == "production":
        if not url or url.lower().startswith("sqlite"):
            raise RuntimeError(
                "Critical Database Configuration Error: Production environment requires a valid PostgreSQL DATABASE_URL. SQLite database fallback is strictly prohibited in production."
            )

validate_database_configuration()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
