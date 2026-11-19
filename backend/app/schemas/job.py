from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field

class ScoringWeightsSchema(BaseModel):
    skills: float = Field(0.40, ge=0.0, le=1.0)
    experience: float = Field(0.35, ge=0.0, le=1.0)
    education: float = Field(0.15, ge=0.0, le=1.0)
    domain: float = Field(0.10, ge=0.0, le=1.0)

class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    department: str = Field(..., min_length=2, max_length=100)
    location: Optional[str] = "Remote"
    job_type: Optional[str] = "Full-time"
    experience_level: Optional[str] = "Senior"
    salary_range: Optional[str] = "$120,000 - $160,000"
    openings: Optional[int] = Field(1, ge=1)
    status: Optional[str] = "OPEN"
    description: str = Field(..., min_length=10)
    responsibilities: Optional[List[str]] = []
    required_skills: Optional[List[str]] = []
    preferred_skills: Optional[List[str]] = []
    scoring_weights: Optional[ScoringWeightsSchema] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    openings: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    scoring_weights: Optional[ScoringWeightsSchema] = None

class JobResponse(JobBase):
    id: str
    created_by_id: Optional[str] = None
    applicants_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JobListResponse(BaseModel):
    total: int
    items: List[JobResponse]
    skip: int
    limit: int
