import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    location = Column(String(150), default="Remote")
    job_type = Column(String(50), default="Full-time")  # Full-time, Part-time, Contract, Remote
    experience_level = Column(String(50), default="Senior")  # Entry, Mid-Level, Senior, Lead, Executive
    salary_range = Column(String(100), default="$120,000 - $160,000")
    openings = Column(Integer, default=1)
    status = Column(String(50), default="OPEN", index=True)  # OPEN, DRAFT, PAUSED, CLOSED
    description = Column(Text, nullable=False)
    responsibilities = Column(JSON, default=list)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    scoring_weights = Column(JSON, default=lambda: {
        "skills": 0.40,
        "experience": 0.35,
        "education": 0.15,
        "domain": 0.10
    })
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    created_by = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
