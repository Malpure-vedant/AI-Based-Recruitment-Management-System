import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rms_backend")

def seed_initial_data():
    """Initializes schema and seeds default administrative user and sample job if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if default recruiter exists
        admin = db.query(User).filter(User.email == "sarah.jenkins@hireai.enterprise").first()
        if not admin:
            admin = User(
                email="sarah.jenkins@hireai.enterprise",
                hashed_password=get_password_hash("admin123"),
                full_name="Sarah Jenkins",
                role="SUPER_ADMIN",
                department="Talent Acquisition",
                title="Lead Talent Partner & AI Hiring Manager",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logger.info("Default administrator seeded: sarah.jenkins@hireai.enterprise (password: admin123)")

        # Seed initial job if empty
        job_count = db.query(Job).count()
        if job_count == 0:
            job = Job(
                title="Senior AI / Machine Learning Engineer",
                department="Artificial Intelligence",
                location="San Francisco, CA (Hybrid)",
                job_type="Full-time",
                experience_level="Senior",
                salary_range="$165,000 - $210,000",
                openings=2,
                status="OPEN",
                description="We are seeking an experienced AI/ML Engineer to architect, fine-tune, and deploy large language models and agentic workflow systems.",
                responsibilities=[
                    "Architect scalable inference pipelines using FastAPI, Triton, and vLLM",
                    "Fine-tune state-of-the-art open models and integrate Gemini 1.5/2.0 API",
                    "Optimize vector similarity search using PostgreSQL and vector databases"
                ],
                required_skills=["Python", "PyTorch", "FastAPI", "LLMs", "Vector Databases", "Docker"],
                preferred_skills=["Kubernetes", "MLOps", "PostgreSQL"],
                scoring_weights={
                    "skills": 0.40,
                    "experience": 0.35,
                    "education": 0.15,
                    "domain": 0.10
                },
                created_by_id=admin.id
            )
            db.add(job)
            db.commit()
            logger.info("Default job requisition seeded.")
    except Exception as e:
        logger.error(f"Error during initial data seeding: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables
    logger.info("Starting AI Recruitment Management System Backend...")
    seed_initial_data()
    yield
    # Shutdown
    logger.info("Shutting down AI Recruitment Management System Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI-Powered Recruitment Management System (RMS) RESTful APIs with PyMuPDF resume parsing and Google Gemini scoring.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception for request {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please consult backend logs."}
    )

# Mount Modular v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
