"""
Interview model — scheduled interview session for an application.
One application can have multiple interview rounds.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Integer, ForeignKey,
    CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    application_id  = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_id  = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Interviewer info (allow external interviewers not in system)
    interviewer_name = Column(String(150), nullable=True)

    # Round details
    interview_round = Column(String(100), nullable=False, default="Round 1")

    # Scheduling
    scheduled_at      = Column(DateTime(timezone=True), nullable=False)
    duration_minutes  = Column(Integer, default=60, nullable=False)

    # Virtual meeting
    meeting_link     = Column(String(255), nullable=True)
    meeting_platform = Column(String(50), nullable=True)   # Zoom / Google Meet / MS Teams / In-Person

    # Location (for in-person interviews)
    location = Column(String(255), nullable=True)

    # Notes and status
    notes  = Column(String(1000), nullable=True)
    status = Column(String(50), default="SCHEDULED", nullable=False, index=True)

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
    application = relationship("Application", back_populates="interviews")
    interviewer = relationship("User", back_populates="interviews_conducted")
    feedback    = relationship(
        "InterviewFeedback",
        back_populates="interview",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # ── Constraints & Indexes ────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint(
            "status IN ('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW')",
            name="check_interview_status"
        ),
        CheckConstraint(
            "meeting_platform IN ('Zoom','Google Meet','Microsoft Teams','In-Person','Phone') OR meeting_platform IS NULL",
            name="check_meeting_platform"
        ),
        CheckConstraint(
            "duration_minutes > 0",
            name="check_duration_positive"
        ),
        Index("ix_interviews_interviewer_scheduled", "interviewer_id", "scheduled_at"),
    )

    def __repr__(self) -> str:
        return f"<Interview id={self.id} round={self.interview_round} status={self.status}>"
