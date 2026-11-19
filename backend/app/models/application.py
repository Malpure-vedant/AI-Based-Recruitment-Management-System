"""
Application model — links a Candidate to a Job with AI scoring results.
UniqueConstraint prevents a candidate from applying to the same job twice.
Maintains relationship with ApplicationStatusHistory for full audit trail.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, Integer,
    ForeignKey, Numeric, JSON, UniqueConstraint, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    job_id       = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id    = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    # Pipeline status:
    # Standard stages: APPLIED, SCREENING, SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEW_COMPLETED, SELECTED, REJECTED
    # Backwards compatibility: INTERVIEW, OFFERED, HIRED
    status = Column(String(50), default="APPLIED", nullable=False, index=True)

    # Cover letter / notes from applicant
    cover_letter = Column(Text, nullable=True)

    # ── AI Scoring ──────────────────────────────────────────────────────────
    overall_match_score   = Column(Numeric(5, 2), nullable=True)   # 0–100
    technical_score       = Column(Numeric(5, 2), nullable=True)
    experience_score      = Column(Numeric(5, 2), nullable=True)
    education_score       = Column(Numeric(5, 2), nullable=True)
    domain_score          = Column(Numeric(5, 2), nullable=True)

    ai_verdict  = Column(String(50), nullable=True)   # STRONG_FIT / FIT / WEAK_FIT / NOT_FIT
    ai_summary  = Column(Text, nullable=True)

    # JSON arrays / objects stored as JSON columns
    matched_skills       = Column(JSON, nullable=True)   # ["Python","FastAPI",...]
    missing_skills       = Column(JSON, nullable=True)
    strengths            = Column(JSON, nullable=True)
    weaknesses           = Column(JSON, nullable=True)
    suggested_questions  = Column(JSON, nullable=True)

    # Screening flags
    is_shortlisted = Column(Boolean, default=False, nullable=False)
    shortlisted_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamps
    applied_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # ── Relationships ────────────────────────────────────────────────────────
    job            = relationship("Job", back_populates="applications")
    candidate      = relationship("Candidate", back_populates="applications")
    resume         = relationship("Resume", back_populates="applications")
    interviews     = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    status_history = relationship(
        "ApplicationStatusHistory",
        back_populates="application",
        order_by="desc(ApplicationStatusHistory.created_at)",
        cascade="all, delete-orphan"
    )

    # ── Constraints & Indexes ────────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("job_id", "candidate_id", name="uq_one_application_per_job"),
        CheckConstraint(
            "status IN ('APPLIED','SCREENING','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEW_COMPLETED','SELECTED','REJECTED','INTERVIEW','OFFERED','HIRED')",
            name="check_application_status"
        ),
        CheckConstraint(
            "ai_verdict IN ('STRONG_FIT','FIT','WEAK_FIT','NOT_FIT') OR ai_verdict IS NULL",
            name="check_ai_verdict"
        ),
        CheckConstraint(
            "overall_match_score IS NULL OR (overall_match_score >= 0 AND overall_match_score <= 100)",
            name="check_match_score_range"
        ),
        # Composite index: quickly find top candidates for a job ranked by score
        Index("ix_applications_job_score", "job_id", "overall_match_score"),
    )

    def __repr__(self) -> str:
        return f"<Application id={self.id} job={self.job_id} candidate={self.candidate_id} status={self.status}>"
