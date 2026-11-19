"""
InterviewFeedback model — detailed scorecard submitted after an interview.
One-to-one with Interview (each interview has at most one feedback record).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Integer, Text,
    ForeignKey, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    interview_id  = Column(String(36), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, unique=True)
    interviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Overall decision
    overall_recommendation = Column(String(50), nullable=False)
    # STRONG_HIRE / HIRE / NO_HIRE / STRONG_NO_HIRE
    rating = Column(Integer, nullable=False)   # 1–5

    # Dimension ratings (each 1–5)
    technical_score        = Column(Integer, nullable=True)
    communication_score    = Column(Integer, nullable=True)
    problem_solving_score  = Column(Integer, nullable=True)
    cultural_fit_score     = Column(Integer, nullable=True)

    # Qualitative feedback
    strengths_noted  = Column(Text, nullable=True)
    concerns_noted   = Column(Text, nullable=True)
    detailed_feedback = Column(Text, nullable=True)

    # Timestamps
    submitted_at = Column(
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
    interview   = relationship("Interview", back_populates="feedback")
    interviewer = relationship("User", back_populates="feedbacks_given")

    # ── Constraints ──────────────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint(
            "overall_recommendation IN ('STRONG_HIRE','HIRE','NO_HIRE','STRONG_NO_HIRE')",
            name="check_recommendation"
        ),
        CheckConstraint("rating BETWEEN 1 AND 5", name="check_rating_range"),
        CheckConstraint(
            "technical_score IS NULL OR technical_score BETWEEN 1 AND 5",
            name="check_technical_score"
        ),
        CheckConstraint(
            "communication_score IS NULL OR communication_score BETWEEN 1 AND 5",
            name="check_communication_score"
        ),
        CheckConstraint(
            "problem_solving_score IS NULL OR problem_solving_score BETWEEN 1 AND 5",
            name="check_problem_solving_score"
        ),
        CheckConstraint(
            "cultural_fit_score IS NULL OR cultural_fit_score BETWEEN 1 AND 5",
            name="check_cultural_fit_score"
        ),
    )

    def __repr__(self) -> str:
        return f"<InterviewFeedback id={self.id} rec={self.overall_recommendation} rating={self.rating}>"
