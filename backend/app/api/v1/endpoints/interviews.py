from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.api.deps import get_db, get_current_user, role_required
from app.models.interview import Interview
from app.models.interview_feedback import InterviewFeedback
from app.models.application import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.notification import Notification
from app.models.user import User
from app.models.candidate import Candidate
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    FeedbackCreate,
    FeedbackResponse,
    InterviewResponse,
    InterviewListResponse,
    NotificationResponse
)

router = APIRouter(prefix="/interviews", tags=["Interviews & Calendar"])


def _to_interview_response(int_obj: Interview) -> InterviewResponse:
    app = int_obj.application
    cand = app.candidate if app else None
    job = app.job if app else None

    feedback_res = None
    if int_obj.feedback:
        fb = int_obj.feedback
        feedback_res = FeedbackResponse(
            id=fb.id,
            overall_recommendation=fb.overall_recommendation,
            rating=fb.rating,
            technical_score=fb.technical_score,
            communication_score=fb.communication_score,
            problem_solving_score=fb.problem_solving_score,
            cultural_fit_score=fb.cultural_fit_score,
            strengths_noted=fb.strengths_noted,
            concerns_noted=fb.concerns_noted,
            detailed_feedback=fb.detailed_feedback,
            submitted_at=fb.submitted_at
        )

    return InterviewResponse(
        id=int_obj.id,
        application_id=int_obj.application_id,
        candidate_id=cand.id if cand else None,
        candidate_name=cand.full_name if cand else None,
        candidate_email=cand.email if cand else None,
        candidate_avatar=cand.avatar_url if cand else None,
        job_id=job.id if job else None,
        job_title=job.title if job else None,
        interviewer_id=int_obj.interviewer_id,
        interviewer_name=int_obj.interviewer_name or "Hiring Lead",
        interview_round=int_obj.interview_round,
        scheduled_at=int_obj.scheduled_at,
        duration_minutes=int_obj.duration_minutes,
        meeting_link=int_obj.meeting_link,
        meeting_platform=int_obj.meeting_platform or "Google Meet",
        location=int_obj.location,
        notes=int_obj.notes,
        status=int_obj.status,
        feedback=feedback_res,
        created_at=int_obj.created_at,
        updated_at=int_obj.updated_at
    )


@router.post("/", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def schedule_interview(
    interview_in: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """
    Schedules an interview round for a candidate application.
    Updates candidate stage to INTERVIEW_SCHEDULED and dispatches an in-app notification.
    """
    app = db.query(Application).filter(Application.id == interview_in.application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target application {interview_in.application_id} not found."
        )

    now = datetime.now(timezone.utc)
    interview = Interview(
        application_id=interview_in.application_id,
        interviewer_id=interview_in.interviewer_id or current_user.id,
        interviewer_name=interview_in.interviewer_name or current_user.full_name,
        interview_round=interview_in.interview_round,
        scheduled_at=interview_in.scheduled_at,
        duration_minutes=interview_in.duration_minutes or 60,
        meeting_link=interview_in.meeting_link or "https://meet.google.com/hiring-sync",
        meeting_platform=interview_in.meeting_platform or "Google Meet",
        location=interview_in.location,
        notes=interview_in.notes,
        status="SCHEDULED",
        created_at=now,
        updated_at=now
    )
    db.add(interview)
    db.flush()

    # Advance application stage to INTERVIEW
    old_stage = app.status
    app.status = "INTERVIEW"
    app.updated_at = now

    # Record application stage history
    history = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_stage,
        to_status="INTERVIEW_SCHEDULED",
        changed_by_id=current_user.id,
        changed_by_name=current_user.full_name,
        reason=f"Scheduled {interview_in.interview_round} on {interview_in.scheduled_at.strftime('%Y-%m-%d %H:%M UTC')}",
        created_at=now
    )
    db.add(history)

    # Dispatch In-App Notification to recruiter/interviewer
    cand_name = app.candidate.full_name if app.candidate else "Candidate"
    job_title = app.job.title if app.job else "Role"
    notif = Notification(
        user_id=current_user.id,
        title=f"Interview Scheduled: {cand_name}",
        message=f"{interview_in.interview_round} scheduled for {cand_name} ({job_title}) at {interview_in.scheduled_at.strftime('%b %d, %Y %H:%M')}.",
        notification_type="SUCCESS",
        related_entity_type="Interview",
        related_entity_id=interview.id,
        created_at=now
    )
    db.add(notif)

    db.commit()
    db.refresh(interview)
    return _to_interview_response(interview)


@router.get("/", response_model=InterviewListResponse)
def list_interviews(
    status: Optional[str] = Query(None, description="Filter by status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)"),
    search: Optional[str] = Query(None, description="Search candidate or interviewer name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists interviews with status filtering, search and chronology order."""
    query = db.query(Interview).join(Application, Interview.application_id == Application.id).join(Candidate, Application.candidate_id == Candidate.id)

    if isinstance(status, str) and status and status != "ALL":
        query = query.filter(Interview.status == status)

    if isinstance(search, str) and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Candidate.full_name.ilike(term),
                Interview.interviewer_name.ilike(term),
                Interview.interview_round.ilike(term)
            )
        )

    total = query.count()
    interviews = query.order_by(asc(Interview.scheduled_at)).offset(skip if isinstance(skip, int) else 0).limit(limit if isinstance(limit, int) else 50).all()

    return {
        "total": total,
        "items": [_to_interview_response(i) for i in interviews],
        "skip": skip if isinstance(skip, int) else 0,
        "limit": limit if isinstance(limit, int) else 50
    }


@router.get("/candidate/{candidate_id}/history", response_model=List[InterviewResponse])
def get_candidate_interview_history(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full cross-round interview history and scorecards for a candidate."""
    interviews = (
        db.query(Interview)
        .join(Application, Interview.application_id == Application.id)
        .filter(Application.candidate_id == candidate_id)
        .order_by(desc(Interview.scheduled_at))
        .all()
    )
    return [_to_interview_response(i) for i in interviews]


@router.get("/notifications/in-app", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves in-app recruitment activity notifications for the signed-in user."""
    safe_limit = limit if isinstance(limit, int) else 20
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(safe_limit)
        .all()
    )
    return [
        NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            created_at=n.created_at,
            related_entity_type=n.related_entity_type,
            related_entity_id=n.related_entity_id
        )
        for n in notifs
    ]


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks an in-app notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
    return {"success": True}


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches details for a single interview session including attached scorecard."""
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
    """Updates interview date/time, meeting link, notes, or status."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview {interview_id} not found."
        )

    now = datetime.now(timezone.utc)
    update_data = interview_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interview, field, value)

    interview.updated_at = now

    # If status changed, log notification
    if "status" in update_data and update_data["status"] != interview.status:
        cand_name = interview.application.candidate.full_name if interview.application and interview.application.candidate else "Candidate"
        notif = Notification(
            user_id=current_user.id,
            title=f"Interview Status Updated: {cand_name}",
            message=f"{interview.interview_round} for {cand_name} updated to {update_data['status']}.",
            notification_type="INFO",
            related_entity_type="Interview",
            related_entity_id=interview.id,
            created_at=now
        )
        db.add(notif)

    db.commit()
    db.refresh(interview)
    return _to_interview_response(interview)


@router.post("/{interview_id}/feedback", response_model=InterviewResponse)
def store_interview_feedback(
    interview_id: str,
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER", "INTERVIEWER"]))
):
    """
    Submits structured scorecard feedback (1-5 rating, dimension scores, notes).
    Marks interview as COMPLETED and advances candidate stage to INTERVIEW_COMPLETED.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview {interview_id} not found."
        )

    now = datetime.now(timezone.utc)

    # Check if feedback already exists or create new
    fb = db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview_id).first()
    if fb:
        fb.overall_recommendation = feedback_in.overall_recommendation
        fb.rating = feedback_in.rating
        fb.technical_score = feedback_in.technical_score
        fb.communication_score = feedback_in.communication_score
        fb.problem_solving_score = feedback_in.problem_solving_score
        fb.cultural_fit_score = feedback_in.cultural_fit_score
        fb.strengths_noted = feedback_in.strengths_noted
        fb.concerns_noted = feedback_in.concerns_noted
        fb.detailed_feedback = feedback_in.detailed_feedback
        fb.updated_at = now
    else:
        fb = InterviewFeedback(
            interview_id=interview_id,
            interviewer_id=current_user.id,
            overall_recommendation=feedback_in.overall_recommendation,
            rating=feedback_in.rating,
            technical_score=feedback_in.technical_score,
            communication_score=feedback_in.communication_score,
            problem_solving_score=feedback_in.problem_solving_score,
            cultural_fit_score=feedback_in.cultural_fit_score,
            strengths_noted=feedback_in.strengths_noted,
            concerns_noted=feedback_in.concerns_noted,
            detailed_feedback=feedback_in.detailed_feedback,
            submitted_at=now,
            updated_at=now
        )
        db.add(fb)

    # Mark interview as COMPLETED
    interview.status = "COMPLETED"
    interview.updated_at = now

    # Advance application stage to INTERVIEW
    app = interview.application
    if app:
        old_stage = app.status
        app.status = "INTERVIEW"
        app.updated_at = now

        history = ApplicationStatusHistory(
            application_id=app.id,
            from_status=old_stage,
            to_status="INTERVIEW_COMPLETED",
            changed_by_id=current_user.id,
            changed_by_name=current_user.full_name,
            reason=f"Interview round completed. Scorecard rating: {feedback_in.rating}/5 ({feedback_in.overall_recommendation}).",
            created_at=now
        )
        db.add(history)

    # Create notification
    cand_name = app.candidate.full_name if app and app.candidate else "Candidate"
    notif = Notification(
        user_id=current_user.id,
        title=f"Feedback Submitted: {cand_name}",
        message=f"{current_user.full_name} submitted scorecard for {cand_name} ({feedback_in.overall_recommendation}, {feedback_in.rating}★).",
        notification_type="SUCCESS",
        related_entity_type="Interview",
        related_entity_id=interview.id,
        created_at=now
    )
    db.add(notif)

    db.commit()
    db.refresh(interview)
    return _to_interview_response(interview)
