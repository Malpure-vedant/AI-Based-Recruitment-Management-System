"""
Pydantic v2 schemas for AI resume screening.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Nested item schemas
# ---------------------------------------------------------------------------

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None


class WorkExperienceItem(BaseModel):
    title: str
    company: str
    duration: Optional[str] = None
    highlights: List[str] = []


class ProjectItem(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = []


# ---------------------------------------------------------------------------
# Core result schema
# ---------------------------------------------------------------------------

class ScreeningResult(BaseModel):
    candidate_name: str = "Unknown"
    candidate_email: Optional[str] = None

    technical_skills: List[str] = []
    education: List[EducationItem] = []
    work_experience: List[WorkExperienceItem] = []
    projects: List[ProjectItem] = []

    matched_skills: List[str] = []
    missing_skills: List[str] = []

    overall_score: float = Field(default=0.0, ge=0, le=100)
    technical_score: float = Field(default=0.0, ge=0, le=100)
    experience_score: float = Field(default=0.0, ge=0, le=100)
    education_score: float = Field(default=0.0, ge=0, le=100)
    domain_score: float = Field(default=0.0, ge=0, le=100)

    # STRONG_FIT | FIT | WEAK_FIT | NOT_FIT
    verdict: str = "NOT_FIT"

    screening_summary: str = ""
    strengths: List[str] = []
    areas_for_improvement: List[str] = []
    suggested_interview_questions: List[str] = []

    # HIGH | MEDIUM | LOW
    confidence_level: str = "MEDIUM"

    disclaimer: str = (
        "AI-generated screening. Must be reviewed by a human recruiter before making any hiring decisions."
    )

    screened_at: Optional[datetime] = None

    # gemini | rubric_fallback
    engine_used: str = "gemini"


# ---------------------------------------------------------------------------
# Request / Response schemas for API
# ---------------------------------------------------------------------------

class ScreeningRequest(BaseModel):
    application_id: str
    job_id: Optional[str] = None
    # Recruiter can inject additional context into the Gemini prompt
    override_instructions: Optional[str] = None


class ScreeningResponse(BaseModel):
    success: bool
    application_id: str
    result: ScreeningResult
    message: str = ""
