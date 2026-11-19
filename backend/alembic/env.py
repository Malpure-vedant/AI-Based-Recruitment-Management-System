"""
Alembic migration environment.
Uses SQLite for local dev (no PostgreSQL running).
Reads DATABASE_URL from app settings; falls back to SQLite automatically.
All 10 ORM models are imported so their tables are included in autogenerate.
"""
import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Add backend/ to path ─────────────────────────────────────────────────────
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# ── Import all models so metadata is populated ───────────────────────────────
import app.models  # noqa: F401 — registers all 10 ORM models
from app.core.database import Base

# ── Resolve database URL ──────────────────────────────────────────────────────
# Try to get the app setting; fall back to SQLite for local dev
SQLITE_URL = "sqlite:///./recruitment.db"

try:
    from app.core.config import settings
    db_url = settings.DATABASE_URL
    # Test reachability: if postgres is in URL, try a quick connect
    if "postgresql" in db_url:
        import psycopg2
        try:
            # Quick connect test (timeout 2s)
            test_url = db_url
            if db_url.startswith("postgresql+"):
                test_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
            import urllib.parse
            parsed = urllib.parse.urlparse(test_url)
            psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,
                password=parsed.password,
                dbname=parsed.path.lstrip("/"),
                connect_timeout=2,
            ).close()
        except Exception:
            db_url = SQLITE_URL
    DATABASE_URL = db_url
except Exception:
    DATABASE_URL = SQLITE_URL

# Alembic Config object (gives access to alembic.ini values)
config = context.config

# Override sqlalchemy.url
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ── Offline migrations ────────────────────────────────────────────────────────
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online migrations ─────────────────────────────────────────────────────────
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            # Render check constraints in autogenerate
            render_as_batch=DATABASE_URL.startswith("sqlite"),
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
