"""
Job model — a job requisition created by a Recruiter.
Linked to applications and scored candidates.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Numeric, Text, DateTime,
    ForeignKey, JSON, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Created by which recruiter profile (nullable so SQLite dev seeding always works)
    recruiter_id = Column(
        String(36), ForeignKey("recruiters.id", ondelete="SET NULL"),
        nullable=True, index=True
    )

    # Core job details
    title            = Column(String(200), nullable=False, index=True)
    department       = Column(String(100), nullable=False, index=True)
    location         = Column(String(150), default="Remote", nullable=False)
    job_type         = Column(String(50), default="Full-time", nullable=False)
    experience_level = Column(String(50), default="Senior", nullable=False)

    # Compensation
    min_salary      = Column(Numeric(12, 2), nullable=True)
    max_salary      = Column(Numeric(12, 2), nullable=True)
    salary_currency = Column(String(10), default="USD", nullable=False)

    # Headcount
    openings = Column(Integer, default=1, nullable=False)

    # Status lifecycle: DRAFT → OPEN → PAUSED → CLOSED
    status = Column(String(50), default="OPEN", nullable=False, index=True)

    # Content
    description     = Column(Text, nullable=False)
    responsibilities = Column(JSON, default=list, nullable=False)
    required_skills  = Column(JSON, default=list, nullable=False)
    preferred_skills = Column(JSON, default=list, nullable=False)

    # AI scoring weight configuration (must sum to 1.0)
    scoring_weights = Column(
        JSON,
        default=lambda: {
            "skills": 0.40,
            "experience": 0.35,
            "education": 0.15,
            "domain": 0.10,
        },
        nullable=False,
    )

    # Timestamps
    created_at = Column(
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
    recruiter    = relationship("Recruiter", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    # ── Constraints & Indexes ────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint("openings > 0", name="check_job_openings_positive"),
        CheckConstraint(
            "status IN ('DRAFT','OPEN','PAUSED','CLOSED')",
            name="check_job_valid_status"
        ),
        CheckConstraint(
            "job_type IN ('Full-time','Part-time','Contract','Remote','Internship')",
            name="check_job_valid_type"
        ),
        CheckConstraint(
            "experience_level IN ('Entry','Mid-Level','Senior','Lead','Executive')",
            name="check_job_valid_exp_level"
        ),
        Index("ix_jobs_status_department", "status", "department"),
    )

    def __repr__(self) -> str:
        return f"<Job id={self.id} title={self.title!r} status={self.status}>"
