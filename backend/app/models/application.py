import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False, index=True)
    status = Column(String(50), default="APPLIED", index=True)  # APPLIED, SCREENING, SHORTLISTED, INTERVIEW, OFFERED, HIRED, REJECTED
    
    # AI Scoring Breakdown
    overall_match_score = Column(Float, default=0.0, index=True)
    technical_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    domain_score = Column(Float, default=0.0)
    ai_verdict = Column(String(50), default="PENDING")  # STRONG_FIT, MODERATE_FIT, LOW_FIT, NO_FIT
    ai_summary = Column(Text, nullable=True)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    suggested_questions = Column(JSON, default=list)
    
    # Resume Document Data
    resume_file_name = Column(String(255), nullable=True)
    resume_file_path = Column(String(500), nullable=True)
    resume_raw_text = Column(Text, nullable=True)
    
    applied_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
