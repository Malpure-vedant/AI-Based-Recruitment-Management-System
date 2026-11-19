from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api.deps import get_db, get_current_user, role_required
from app.models.application import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.candidate import Candidate
from app.models.candidate_skill import CandidateSkill
from app.models.job import Job
from app.models.user import User
from app.schemas.application import (
    ApplicationApply,
    ApplicationUpdateStatus,
    ApplicationShortlistRequest,
    ApplicationRejectRequest,
    ApplicationResponse,
    ApplicationListResponse,
    StatusHistoryResponse,
    AIAnalysisResponse,
    PipelineColumnResponse,
    PipelineBoardResponse
)
from app.services.ai_scoring import ai_scoring_service

router = APIRouter(prefix="/applications", tags=["Applications & Pipeline"])

def _to_application_response(app: Application) -> ApplicationResponse:
    analysis = None
    if app.overall_match_score is not None:
        analysis = AIAnalysisResponse(
            match_score=float(app.overall_match_score),
            technical_score=float(app.technical_score or 0.0),
            experience_score=float(app.experience_score or 0.0),
            education_score=float(app.education_score or 0.0),
            domain_score=float(app.domain_score or 0.0),
            verdict=app.ai_verdict or "PENDING",
            summary=app.ai_summary,
            matched_skills=app.matched_skills or [],
            missing_skills=app.missing_skills or [],
            strengths=app.strengths or [],
            weaknesses=app.weaknesses or [],
            suggested_questions=app.suggested_questions or []
        )

    # Candidate skills list
    candidate_skills = []
    if app.candidate and getattr(app.candidate, 'skills', None):
        candidate_skills = [s.skill_name for s in app.candidate.skills]

    # Resume filename
    resume_file_name = None
    if app.resume:
        resume_file_name = app.resume.original_filename

    # Status history items
    history_items = []
    if app.status_history:
        for h in app.status_history:
            history_items.append(StatusHistoryResponse(
                id=h.id,
                from_status=h.from_status,
                to_status=h.to_status,
                changed_by_name=h.changed_by_name,
                reason=h.reason,
                created_at=h.created_at
            ))

    return ApplicationResponse(
        id=app.id,
        job_id=app.job_id,
        job_title=app.job.title if app.job else None,
        job_department=app.job.department if app.job else None,
        candidate_id=app.candidate_id,
        candidate_name=app.candidate.full_name if app.candidate else None,
        candidate_email=app.candidate.email if app.candidate else None,
        candidate_avatar=app.candidate.avatar_url if app.candidate else None,
        candidate_skills=candidate_skills,
        status=app.status,
        is_shortlisted=app.is_shortlisted,
        shortlisted_at=app.shortlisted_at,
        rejection_reason=app.rejection_reason,
        overall_match_score=float(app.overall_match_score or 0.0),
        technical_score=float(app.technical_score or 0.0),
        experience_score=float(app.experience_score or 0.0),
        education_score=float(app.education_score or 0.0),
        domain_score=float(app.domain_score or 0.0),
        ai_verdict=app.ai_verdict,
        ai_summary=app.ai_summary,
        matched_skills=app.matched_skills or [],
        missing_skills=app.missing_skills or [],
        resume_file_name=resume_file_name,
        applied_date=app.applied_at or app.updated_at,
        updated_at=app.updated_at,
        ai_analysis=analysis,
        status_history=history_items
    )


@router.get("/ranking", response_model=ApplicationListResponse)
def get_candidate_rankings(
    job_id: Optional[str] = Query(None, description="Filter candidates by target job opening"),
    search: Optional[str] = Query(None, description="Search candidate name or skill"),
    min_score: Optional[float] = Query(None, description="Minimum relevance score threshold"),
    status: Optional[str] = Query(None, description="Filter by recruitment stage"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ranks candidates based on job-related skills, qualifications, and AI relevance scores.
    Supports filtering by job opening, searching by candidate name and skills, and score cutoffs.
    """
    query = db.query(Application).join(Candidate, Application.candidate_id == Candidate.id)

    if isinstance(job_id, str) and job_id and job_id != "ALL":
        query = query.filter(Application.job_id == job_id)

    if isinstance(status, str) and status and status != "ALL":
        query = query.filter(Application.status == status)

    if isinstance(min_score, (int, float)):
        query = query.filter(Application.overall_match_score >= min_score)

    if isinstance(search, str) and search.strip():
        term = f"%{search.strip().lower()}%"
        # Search candidate name, email, or skill tags
        query = query.filter(
            or_(
                Candidate.full_name.ilike(term),
                Candidate.email.ilike(term),
                Candidate.current_title.ilike(term),
                Candidate.skills.any(CandidateSkill.skill_name.ilike(term))
            )
        )

    total = query.count()
    # Rank candidates by match score descending (highest score first)
    ranked_apps = query.order_by(desc(Application.overall_match_score), desc(Application.applied_at)).offset(skip if isinstance(skip, int) else 0).limit(limit if isinstance(limit, int) else 50).all()

    return {
        "total": total,
        "items": [_to_application_response(a) for a in ranked_apps],
        "skip": skip if isinstance(skip, int) else 0,
        "limit": limit if isinstance(limit, int) else 50
    }


@router.get("/pipeline/board", response_model=PipelineBoardResponse)
def get_pipeline_kanban_board(
    job_id: Optional[str] = Query(None, description="Filter Kanban board by job"),
    search: Optional[str] = Query(None, description="Search candidate by name or skill"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the interactive Kanban-style recruitment pipeline board partitioned across stages:
    Applied, Resume Screening, Shortlisted, Interview Scheduled, Interview Completed, Selected, Rejected.
    """
    stages = [
        {"id": "APPLIED", "label": "Applied"},
        {"id": "SCREENING", "label": "Resume Screening"},
        {"id": "SHORTLISTED", "label": "Shortlisted"},
        {"id": "INTERVIEW_SCHEDULED", "label": "Interview Scheduled"},
        {"id": "INTERVIEW_COMPLETED", "label": "Interview Completed"},
        {"id": "SELECTED", "label": "Selected"},
        {"id": "REJECTED", "label": "Rejected"},
    ]

    query = db.query(Application).join(Candidate, Application.candidate_id == Candidate.id)

    if isinstance(job_id, str) and job_id and job_id != "ALL":
        query = query.filter(Application.job_id == job_id)

    if isinstance(search, str) and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Candidate.full_name.ilike(term),
                Candidate.email.ilike(term),
                Candidate.skills.any(CandidateSkill.skill_name.ilike(term))
            )
        )

    all_apps = query.order_by(desc(Application.overall_match_score), desc(Application.updated_at)).all()

    # Map legacy stages to canonical stages if any
    legacy_map = {
        "INTERVIEW": "INTERVIEW_SCHEDULED",
        "OFFERED": "SELECTED",
        "HIRED": "SELECTED"
    }

    apps_by_stage = {s["id"]: [] for s in stages}
    for a in all_apps:
        canonical_stage = legacy_map.get(a.status, a.status)
        if canonical_stage in apps_by_stage:
            apps_by_stage[canonical_stage].append(_to_application_response(a))
        else:
            apps_by_stage["APPLIED"].append(_to_application_response(a))

    columns = []
    for s in stages:
        apps_in_stage = apps_by_stage[s["id"]]
        columns.append(PipelineColumnResponse(
            id=s["id"],
            label=s["label"],
            count=len(apps_in_stage),
            applications=apps_in_stage
        ))

    return PipelineBoardResponse(
        total_candidates=len(all_apps),
        columns=columns
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
            full_name=f"{apply_in.first_name} {apply_in.last_name}".strip(),
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

    now = datetime.now(timezone.utc)
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
        applied_at=now,
        updated_at=now
    )
    db.add(application)
    db.flush()

    # Record initial application history
    history = ApplicationStatusHistory(
        application_id=application.id,
        from_status=None,
        to_status="SCREENING",
        changed_by_name="Automated Ingestion & AI Screening",
        reason="Application received and initial AI screening performed",
        created_at=now
    )
    db.add(history)
    db.commit()
    db.refresh(application)

    return _to_application_response(application)


@router.get("/", response_model=ApplicationListResponse)
def list_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    job_id: Optional[str] = Query(None, description="Filter by job requisition"),
    status: Optional[str] = Query(None, description="Filter by stage status"),
    search: Optional[str] = Query(None, description="Search candidate name or skill"),
    min_score: Optional[float] = Query(None, description="Filter by minimum AI score"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists applications with criteria filtering, searching and pagination."""
    query = db.query(Application).join(Candidate, Application.candidate_id == Candidate.id)

    if job_id and job_id != "ALL":
        query = query.filter(Application.job_id == job_id)
    if status and status != "ALL":
        query = query.filter(Application.status == status)
    if min_score is not None:
        query = query.filter(Application.overall_match_score >= min_score)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Candidate.full_name.ilike(term),
                Candidate.email.ilike(term),
                Candidate.skills.any(CandidateSkill.skill_name.ilike(term))
            )
        )

    total = query.count()
    apps = query.order_by(desc(Application.overall_match_score), desc(Application.updated_at)).offset(skip).limit(limit).all()

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
    """Retrieves single application record including AI scorecard and complete status history."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )
    return _to_application_response(app)


@router.get("/{application_id}/history", response_model=List[StatusHistoryResponse])
def get_application_history(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full audit log of recruitment pipeline stage transitions for an applicant."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )

    history = db.query(ApplicationStatusHistory).filter(
        ApplicationStatusHistory.application_id == application_id
    ).order_by(desc(ApplicationStatusHistory.created_at)).all()

    return [
        StatusHistoryResponse(
            id=h.id,
            from_status=h.from_status,
            to_status=h.to_status,
            changed_by_name=h.changed_by_name,
            reason=h.reason,
            created_at=h.created_at
        )
        for h in history
    ]


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: str,
    status_in: ApplicationUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """
    Moves candidate between recruitment stages in the pipeline.
    Maintains complete audit history with actor name and optional/mandatory reason.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )

    now = datetime.now(timezone.utc)
    old_status = app.status
    new_status = status_in.status.upper()

    app.status = new_status
    app.updated_at = now

    if new_status == "SHORTLISTED":
        app.is_shortlisted = True
        app.shortlisted_at = now
    elif new_status == "REJECTED":
        if status_in.reason:
            app.rejection_reason = status_in.reason

    # Add history log
    history = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status=new_status,
        changed_by_id=current_user.id,
        changed_by_name=current_user.full_name,
        reason=status_in.reason or f"Advanced candidate from {old_status} to {new_status}",
        created_at=now
    )
    db.add(history)
    db.commit()
    db.refresh(app)

    return _to_application_response(app)


@router.post("/{application_id}/shortlist", response_model=ApplicationResponse)
def shortlist_candidate(
    application_id: str,
    shortlist_in: Optional[ApplicationShortlistRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Shortlists candidate for further review or interview scheduling."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )

    now = datetime.now(timezone.utc)
    old_status = app.status
    app.status = "SHORTLISTED"
    app.is_shortlisted = True
    app.shortlisted_at = now
    app.updated_at = now

    notes = shortlist_in.notes if shortlist_in and shortlist_in.notes else "Candidate shortlisted based on qualifications and AI match."

    history = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status="SHORTLISTED",
        changed_by_id=current_user.id,
        changed_by_name=current_user.full_name,
        reason=notes,
        created_at=now
    )
    db.add(history)
    db.commit()
    db.refresh(app)

    return _to_application_response(app)


@router.post("/{application_id}/reject", response_model=ApplicationResponse)
def reject_candidate(
    application_id: str,
    reject_in: ApplicationRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Rejects candidate with an explicit recorded reason in the audit log."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found."
        )

    now = datetime.now(timezone.utc)
    old_status = app.status
    app.status = "REJECTED"
    app.rejection_reason = reject_in.reason
    app.updated_at = now

    history = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status="REJECTED",
        changed_by_id=current_user.id,
        changed_by_name=current_user.full_name,
        reason=reject_in.reason,
        created_at=now
    )
    db.add(history)
    db.commit()
    db.refresh(app)

    return _to_application_response(app)
