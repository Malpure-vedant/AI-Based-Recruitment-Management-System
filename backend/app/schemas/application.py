from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class StatusHistoryResponse(BaseModel):
    id: str
    from_status: Optional[str] = None
    to_status: str
    changed_by_name: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationApply(BaseModel):
    job_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_file_name: Optional[str] = None

class ApplicationUpdateStatus(BaseModel):
    status: str = Field(..., description="Target pipeline stage")
    reason: Optional[str] = Field(None, description="Optional note or mandatory rejection reason")

class ApplicationShortlistRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Optional shortlisting notes")

class ApplicationRejectRequest(BaseModel):
    reason: str = Field(..., min_length=2, description="Reason for rejecting candidate")

class AIAnalysisResponse(BaseModel):
    match_score: float
    technical_score: float
    experience_score: float
    education_score: float
    domain_score: float
    verdict: str
    summary: Optional[str] = None
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    suggested_questions: List[str] = []

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    job_title: Optional[str] = None
    job_department: Optional[str] = None
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_avatar: Optional[str] = None
    candidate_skills: Optional[List[str]] = []
    status: str
    is_shortlisted: bool = False
    shortlisted_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    overall_match_score: float = 0.0
    technical_score: Optional[float] = 0.0
    experience_score: Optional[float] = 0.0
    education_score: Optional[float] = 0.0
    domain_score: Optional[float] = 0.0
    ai_verdict: Optional[str] = None
    ai_summary: Optional[str] = None
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    resume_file_name: Optional[str] = None
    applied_date: datetime
    updated_at: datetime
    ai_analysis: Optional[AIAnalysisResponse] = None
    status_history: Optional[List[StatusHistoryResponse]] = []

    class Config:
        from_attributes = True

class ApplicationListResponse(BaseModel):
    total: int
    items: List[ApplicationResponse]
    skip: int
    limit: int

class PipelineColumnResponse(BaseModel):
    id: str
    label: str
    count: int
    applications: List[ApplicationResponse]

class PipelineBoardResponse(BaseModel):
    total_candidates: int
    columns: List[PipelineColumnResponse]
