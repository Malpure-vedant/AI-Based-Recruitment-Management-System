from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    candidates,
    jobs,
    applications,
    resumes,
    interviews,
    screening,
    analytics
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(candidates.router)
api_router.include_router(jobs.router)
api_router.include_router(applications.router)
api_router.include_router(resumes.router)
api_router.include_router(interviews.router)
api_router.include_router(screening.router, prefix="/screening", tags=["AI Screening"])
api_router.include_router(analytics.router)
