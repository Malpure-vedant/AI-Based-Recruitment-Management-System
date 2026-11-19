from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class InterviewCreate(BaseModel):
    application_id: str
    interviewer_name: Optional[str] = "Hiring Lead"
    interviewer_id: Optional[str] = None
    interview_round: str = Field(default="Technical Round 1")
    scheduled_at: datetime
    duration_minutes: Optional[int] = Field(60, ge=15, le=180)
    meeting_link: Optional[str] = "https://meet.google.com"

class InterviewUpdate(BaseModel):
    interview_round: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = None

class InterviewFeedback(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="1 to 5 star rating")
    feedback: str = Field(..., min_length=5, description="Qualitative feedback notes")
    criteria_ratings: Optional[Dict[str, int]] = None

class InterviewResponse(BaseModel):
    id: str
    application_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    interviewer_name: str
    interview_round: str
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: str
    status: str
    rating: Optional[int] = None
    feedback: Optional[str] = None
    criteria_ratings: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InterviewListResponse(BaseModel):
    total: int
    items: List[InterviewResponse]
    skip: int
    limit: int
