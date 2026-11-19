"""
TalentPulse AI — Backend Entrypoint
FastAPI ASGI application with lifespan event handler for DB init & seeding.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash

# Import all models so Base.metadata is fully populated before create_all()
import app.models  # noqa: F401 — registers all 10 ORM models

from app.models.user      import User
from app.models.recruiter import Recruiter
from app.models.job       import Job

from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rms_backend")


def seed_initial_data() -> None:
    """Create all tables and seed a default admin + recruiter profile + sample job."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Seed default super-admin user ────────────────────────────────────
        admin = db.query(User).filter(
            User.email == "sarah.jenkins@hireai.enterprise"
        ).first()

        if not admin:
            admin = User(
                email="sarah.jenkins@hireai.enterprise",
                hashed_password=get_password_hash("admin123"),
                full_name="Sarah Jenkins",
                role="SUPER_ADMIN",
                is_active=True,
            )
            db.add(admin)
            db.flush()   # get admin.id without committing yet

            # ── Seed recruiter profile linked to admin ───────────────────────
            recruiter_profile = Recruiter(
                user_id=admin.id,
                department="Talent Acquisition",
                title="Lead Talent Partner & AI Hiring Manager",
                hiring_quota=20,
            )
            db.add(recruiter_profile)
            db.commit()
            db.refresh(admin)
            logger.info(
                "Default administrator seeded: sarah.jenkins@hireai.enterprise / admin123"
            )

        # ── Seed sample job requisition ──────────────────────────────────────
        job_count = db.query(Job).count()
        if job_count == 0:
            # Find recruiter profile to attach the job
            recruiter = db.query(Recruiter).filter(
                Recruiter.user_id == admin.id
            ).first()

            job = Job(
                title="Senior AI / Machine Learning Engineer",
                department="Artificial Intelligence",
                location="San Francisco, CA (Hybrid)",
                job_type="Full-time",
                experience_level="Senior",
                min_salary=165000,
                max_salary=210000,
                openings=2,
                status="OPEN",
                description=(
                    "We are seeking an experienced AI/ML Engineer to architect, "
                    "fine-tune, and deploy large language models and agentic workflow systems."
                ),
                responsibilities=[
                    "Architect scalable inference pipelines using FastAPI, Triton, and vLLM",
                    "Fine-tune open models and integrate Google Gemini API",
                    "Optimize vector similarity search with PostgreSQL + pgvector",
                ],
                required_skills=["Python", "PyTorch", "FastAPI", "LLMs", "Docker"],
                preferred_skills=["Kubernetes", "MLOps", "PostgreSQL", "Vector Databases"],
                scoring_weights={
                    "skills": 0.40,
                    "experience": 0.35,
                    "education": 0.15,
                    "domain": 0.10,
                },
                recruiter_id=recruiter.id,
            )
            db.add(job)
            db.commit()
            logger.info("Sample job requisition seeded.")

    except Exception as exc:
        logger.error("Error during initial data seeding: %s", exc, exc_info=True)
        db.rollback()
    finally:
        db.close()


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TalentPulse AI Backend…")
    seed_initial_data()
    yield
    logger.info("TalentPulse AI Backend shut down.")


# ── Application ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Enterprise AI-Powered Recruitment Management System REST APIs — "
        "PyMuPDF resume parsing · Google Gemini AI scoring · JWT auth · RBAC"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception — %s %s: %s", request.method, request.url, exc, exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Check backend logs."},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)


# ── Health endpoints ──────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# ── Dev entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn, sys, os

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, app_dir=backend_dir)
