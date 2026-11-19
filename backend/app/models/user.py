import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="RECRUITER", nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    recruiter_profile = relationship("Recruiter", back_populates="user", uselist=False, cascade="all, delete-orphan")
    candidate_profile = relationship("Candidate", back_populates="user", uselist=False)
    interviews_conducted = relationship("Interview", back_populates="interviewer")
    feedbacks_given = relationship("InterviewFeedback", back_populates="interviewer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    @property
    def department(self) -> str:
        if self.recruiter_profile and self.recruiter_profile.department:
            return self.recruiter_profile.department
        return "Talent Acquisition"

    @property
    def title(self) -> str:
        if self.recruiter_profile and self.recruiter_profile.title:
            return self.recruiter_profile.title
        return "Lead Recruiter"

    __table_args__ = (
        CheckConstraint(
            "role IN ('SUPER_ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE')",
            name="check_user_valid_role"
        ),
    )
