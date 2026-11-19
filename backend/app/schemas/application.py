from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

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
    status: str = Field(..., pattern="^(APPLIED|SCREENING|SHORTLISTED|INTERVIEW|OFFERED|HIRED|REJECTED)$")
    remarks: Optional[str] = None

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
    status: str
    overall_match_score: float
    ai_verdict: Optional[str] = None
    ai_summary: Optional[str] = None
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    resume_file_name: Optional[str] = None
    applied_date: datetime
    updated_at: datetime
    ai_analysis: Optional[AIAnalysisResponse] = None

    class Config:
        from_attributes = True

class ApplicationListResponse(BaseModel):
    total: int
    items: List[ApplicationResponse]
    skip: int
    limit: int
