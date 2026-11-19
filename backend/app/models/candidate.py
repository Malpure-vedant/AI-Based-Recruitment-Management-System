"""
Candidate model — a job applicant profile.
Unique email prevents duplicate candidate records.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, ForeignKey, Text, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Linked user account (optional — candidates may be imported without an account)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"),
        unique=True, nullable=True, index=True
    )

    # Identity — unique email is the deduplication key
    full_name = Column(String(200), nullable=False)
    email     = Column(String(255), unique=True, index=True, nullable=False)
    phone     = Column(String(50), index=True, nullable=True)

    # Professional snapshot
    current_title   = Column(String(200), nullable=True)
    current_company = Column(String(150), nullable=True)
    location        = Column(String(150), nullable=True)
    summary         = Column(Text, nullable=True)

    # Experience & Education
    experience_years = Column(Float, default=0.0, nullable=False)
    education_level  = Column(String(150), nullable=True)
    # e.g. "Bachelor's Degree", "Master's Degree", "PhD"

    # Online presence
    linkedin_url   = Column(String(255), nullable=True)
    github_url     = Column(String(255), nullable=True)
    portfolio_url  = Column(String(255), nullable=True)

    # Status in the talent pool
    status = Column(String(50), default="ACTIVE", nullable=False, index=True)
    # ACTIVE / PASSIVE / HIRED / ARCHIVED

    # UI / avatar
    avatar_url = Column(String(255), nullable=True)

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
    user         = relationship("User", back_populates="candidate_profile")
    skills       = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    resumes      = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")

    # ── Constraints & Indexes ────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint("experience_years >= 0.0", name="check_candidate_exp_non_negative"),
        CheckConstraint(
            "status IN ('ACTIVE','PASSIVE','HIRED','ARCHIVED')",
            name="check_candidate_valid_status"
        ),
        Index("ix_candidates_name", "full_name"),
    )

    def __repr__(self) -> str:
        return f"<Candidate id={self.id} name={self.full_name!r} email={self.email}>"
