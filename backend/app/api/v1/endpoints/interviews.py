from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, role_required
from app.models.interview import Interview
from app.models.application import Application
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewFeedback,
    InterviewResponse,
    InterviewListResponse
)

router = APIRouter(prefix="/interviews", tags=["Interviews"])

def _to_interview_response(int_obj: Interview) -> InterviewResponse:
    app = int_obj.application
    return InterviewResponse(
        id=int_obj.id,
        application_id=int_obj.application_id,
        candidate_name=app.candidate.full_name if app and app.candidate else None,
        candidate_email=app.candidate.email if app and app.candidate else None,
        job_title=app.job.title if app and app.job else None,
        interviewer_name=int_obj.interviewer_name,
        interview_round=int_obj.interview_round,
        scheduled_at=int_obj.scheduled_at,
        duration_minutes=int_obj.duration_minutes,
        meeting_link=int_obj.meeting_link,
        status=int_obj.status,
        rating=int_obj.rating,
        feedback=int_obj.feedback,
        criteria_ratings=int_obj.criteria_ratings or {},
        created_at=int_obj.created_at,
        updated_at=int_obj.updated_at
    )

@router.post("/", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def schedule_interview(
    interview_in: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Schedules an evaluation round for a candidate application and advances stage to INTERVIEW."""
    app = db.query(Application).filter(Application.id == interview_in.application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target application {interview_in.application_id} not found."
        )

    interview = Interview(
        application_id=interview_in.application_id,
        interviewer_id=interview_in.interviewer_id or current_user.id,
        interviewer_name=interview_in.interviewer_name or current_user.full_name,
        interview_round=interview_in.interview_round,
        scheduled_at=interview_in.scheduled_at,
        duration_minutes=interview_in.duration_minutes or 60,
        meeting_link=interview_in.meeting_link or "https://meet.google.com",
        status="SCHEDULED"
    )
    db.add(interview)

    # Automatically advance application status to INTERVIEW if in prior stages
    if app.status in ["APPLIED", "SCREENING", "SHORTLISTED"]:
        app.status = "INTERVIEW"

    db.commit()
    db.refresh(interview)
    return _to_interview_response(interview)

@router.get("/", response_model=InterviewListResponse)
def list_interviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status (SCHEDULED, COMPLETED, CANCELLED)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists scheduled interviews with status filtering."""
    query = db.query(Interview)
    if status:
        query = query.filter(Interview.status == status)

    total = query.count()
    interviews = query.order_by(Interview.scheduled_at.asc()).offset(skip).limit(limit).all()

    items = [_to_interview_response(i) for i in interviews]
    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches details for a single interview round."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview {interview_id} not found."
        )
    return _to_interview_response(interview)

@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: str,
    interview_in: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates interview time, video meeting link, or status."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview {interview_id} not found."
        )

    update_data = interview_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interview, field, value)

    db.commit()
    db.refresh(interview)
    return _to_interview_response(interview)

@router.post("/{interview_id}/feedback", response_model=InterviewResponse)
def store_interview_feedback(
    interview_id: str,
    feedback_in: InterviewFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER", "INTERVIEWER"]))
):
    """Stores interviewer scorecard rating (1-5 stars) and qualitative evaluation notes."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview {interview_id} not found."
        )

    interview.rating = feedback_in.rating
    interview.feedback = feedback_in.feedback
    interview.criteria_ratings = feedback_in.criteria_ratings or {}
    interview.status = "COMPLETED"

    db.commit()
    db.refresh(interview)
    return _to_interview_response(interview)
