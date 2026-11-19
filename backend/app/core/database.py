import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine active database URL with fallback
db_url = settings.DATABASE_URL

try:
    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        # PostgreSQL Engine with connection pooling and fast connect timeout
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 2}
        )
        # Test connection
        with engine.connect() as conn:
            pass
except Exception as e:
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    db_file = os.path.join(backend_dir, "recruitment.db")
    fallback_url = f"sqlite:///{db_file.replace(os.sep, '/')}"
    logger.warning(
        f"PostgreSQL connection at '{db_url}' failed: {e}. "
        f"Falling back to local SQLite database for development ('{fallback_url}')."
    )
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency that provides a transactional database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
