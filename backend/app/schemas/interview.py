from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class FeedbackCreate(BaseModel):
    overall_recommendation: str = Field(default="HIRE", description="STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE")
    rating: int = Field(..., ge=1, le=5, description="1 to 5 star rating")
    technical_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    problem_solving_score: Optional[int] = Field(None, ge=1, le=5)
    cultural_fit_score: Optional[int] = Field(None, ge=1, le=5)
    strengths_noted: Optional[str] = None
    concerns_noted: Optional[str] = None
    detailed_feedback: Optional[str] = Field(None, description="Detailed feedback narrative")

class FeedbackResponse(BaseModel):
    id: str
    overall_recommendation: str
    rating: int
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    problem_solving_score: Optional[int] = None
    cultural_fit_score: Optional[int] = None
    strengths_noted: Optional[str] = None
    concerns_noted: Optional[str] = None
    detailed_feedback: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True

class InterviewCreate(BaseModel):
    application_id: str
    interviewer_name: Optional[str] = "Lead Interviewer"
    interviewer_id: Optional[str] = None
    interview_round: str = Field(default="Technical Round 1")
    scheduled_at: datetime
    duration_minutes: Optional[int] = Field(60, ge=15, le=240)
    meeting_link: Optional[str] = "https://meet.google.com"
    meeting_platform: Optional[str] = "Google Meet"
    location: Optional[str] = None
    notes: Optional[str] = None

class InterviewUpdate(BaseModel):
    interview_round: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    meeting_platform: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, description="SCHEDULED, COMPLETED, CANCELLED, NO_SHOW")

class InterviewResponse(BaseModel):
    id: str
    application_id: str
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_avatar: Optional[str] = None
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    interviewer_id: Optional[str] = None
    interviewer_name: Optional[str] = None
    interview_round: str
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: Optional[str] = None
    meeting_platform: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: str
    feedback: Optional[FeedbackResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InterviewListResponse(BaseModel):
    total: int
    items: List[InterviewResponse]
    skip: int
    limit: int

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None

    class Config:
        from_attributes = True
