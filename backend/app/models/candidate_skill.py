import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), default="Technical", nullable=False)
    years_of_experience = Column(Float, default=0.0, nullable=False)
    proficiency = Column(String(50), default="INTERMEDIATE", nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    candidate = relationship("Candidate", back_populates="skills")

    __table_args__ = (
        UniqueConstraint("candidate_id", "skill_name", name="uq_candidate_skill_name"),
        CheckConstraint(
            "proficiency IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')",
            name="check_valid_proficiency"
        ),
        CheckConstraint("years_of_experience >= 0.0", name="check_skill_exp_positive"),
    )
