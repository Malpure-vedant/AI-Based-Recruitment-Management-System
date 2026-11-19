from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, role_required
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User
from app.schemas.application import (
    ApplicationApply,
    ApplicationUpdateStatus,
    ApplicationResponse,
    ApplicationListResponse,
    AIAnalysisResponse
)
from app.services.ai_scoring import ai_scoring_service

router = APIRouter(prefix="/applications", tags=["Applications"])

def _to_application_response(app: Application) -> ApplicationResponse:
    analysis = None
    if app.overall_match_score is not None:
        analysis = AIAnalysisResponse(
            match_score=app.overall_match_score,
            technical_score=app.technical_score or 0.0,
            experience_score=app.experience_score or 0.0,
            education_score=app.education_score or 0.0,
            domain_score=app.domain_score or 0.0,
            verdict=app.ai_verdict or "PENDING",
            summary=app.ai_summary,
            matched_skills=app.matched_skills or [],
            missing_skills=app.missing_skills or [],
            strengths=app.strengths or [],
            weaknesses=app.weaknesses or [],
            suggested_questions=app.suggested_questions or []
        )

    return ApplicationResponse(
        id=app.id,
        job_id=app.job_id,
        job_title=app.job.title if app.job else None,
        job_department=app.job.department if app.job else None,
        candidate_id=app.candidate_id,
        candidate_name=app.candidate.full_name if app.candidate else None,
        candidate_email=app.candidate.email if app.candidate else None,
        candidate_avatar=app.candidate.avatar_url if app.candidate else None,
        status=app.status,
        overall_match_score=app.overall_match_score or 0.0,
        ai_verdict=app.ai_verdict,
        ai_summary=app.ai_summary,
        matched_skills=app.matched_skills or [],
        missing_skills=app.missing_skills or [],
        resume_file_name=app.resume_file_name,
        applied_date=app.applied_date,
        updated_at=app.updated_at,
        ai_analysis=analysis
    )

@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    apply_in: ApplicationApply,
    db: Session = Depends(get_db)
):
    """Submits a candidate application for an active job, triggering automated AI rubric evaluation."""
    job = db.query(Job).filter(Job.id == apply_in.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target job requisition {apply_in.job_id} not found."
        )

    # Find or create candidate
    candidate = db.query(Candidate).filter(Candidate.email == apply_in.email).first()
    if not candidate:
        candidate = Candidate(
            first_name=apply_in.first_name,
            last_name=apply_in.last_name,
            email=apply_in.email,
            phone=apply_in.phone,
            location=apply_in.location,
            linkedin_url=apply_in.linkedin_url,
            portfolio_url=apply_in.portfolio_url
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.job_id == job.id,
        Application.candidate_id == candidate.id
    ).first()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate has already submitted an application for this job requisition."
        )

    # Perform AI evaluation
    sample_resume_context = f"{candidate.full_name} - Skills: {', '.join(job.required_skills[:3])}. Senior engineering candidate."
    evaluation = ai_scoring_service.evaluate_candidate(
        job_title=job.title,
        job_description=job.description,
        required_skills=job.required_skills or [],
        scoring_weights=job.scoring_weights or {},
        resume_text=sample_resume_context
    )

    application = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        status="SCREENING",
        overall_match_score=evaluation["match_score"],
        technical_score=evaluation["technical_score"],
        experience_score=evaluation["experience_score"],
        education_score=evaluation["education_score"],
        domain_score=evaluation["domain_score"],
        ai_verdict=evaluation["verdict"],
        ai_summary=evaluation["summary"],
        matched_skills=evaluation["matched_skills"],
        missing_skills=evaluation["missing_skills"],
        strengths=evaluation["strengths"],
        weaknesses=evaluation["weaknesses"],
        suggested_questions=evaluation["suggested_questions"],
        resume_file_name=apply_in.resume_file_name or "Resume.pdf",
        resume_raw_text=sample_resume_context
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return _to_application_response(application)

@router.get("/", response_model=ApplicationListResponse)
def list_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    job_id: Optional[str] = Query(None, description="Filter by job requisition"),
    status: Optional[str] = Query(None, description="Filter by stage status"),
    min_score: Optional[float] = Query(None, description="Filter by minimum AI score"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists applications with criteria filtering and pagination."""
    query = db.query(Application)

    if job_id:
        query = query.filter(Application.job_id == job_id)
    if status:
        query = query.filter(Application.status == status)
    if min_score is not None:
        query = query.filter(Application.overall_match_score >= min_score)

    total = query.count()
    apps = query.order_by(Application.overall_match_score.desc()).offset(skip).limit(limit).all()

    items = [_to_application_response(a) for a in apps]
    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves single application record including AI scorecard."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )
    return _to_application_response(app)

@router.get("/{application_id}/status")
def track_application_status(application_id: str, db: Session = Depends(get_db)):
    """Public tracking endpoint for candidates to query their hiring progression."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )
    return {
        "application_id": app.id,
        "job_title": app.job.title if app.job else "Unknown",
        "status": app.status,
        "applied_date": app.applied_date,
        "last_updated": app.updated_at
    }

@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: str,
    status_in: ApplicationUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Advances candidate application to next hiring stage in the recruitment pipeline."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )

    app.status = status_in.status
    db.commit()
    db.refresh(app)
    return _to_application_response(app)
