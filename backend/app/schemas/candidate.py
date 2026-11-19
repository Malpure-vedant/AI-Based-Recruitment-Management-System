from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class CandidateBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    total_experience_years: Optional[float] = 0.0
    highest_education: Optional[str] = None
    skills: Optional[List[str]] = []
    avatar_url: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    total_experience_years: Optional[float] = None
    highest_education: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None

class CandidateResponse(CandidateBase):
    id: str
    full_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CandidateListResponse(BaseModel):
    total: int
    items: List[CandidateResponse]
    skip: int
    limit: int
