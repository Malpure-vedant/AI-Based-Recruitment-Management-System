import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    interviewer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    interviewer_name = Column(String(150), default="Hiring Manager")
    
    interview_round = Column(String(100), default="Technical Round 1")
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    meeting_link = Column(String(255), default="https://meet.google.com")
    status = Column(String(50), default="SCHEDULED", index=True)  # SCHEDULED, COMPLETED, CANCELLED
    
    # Feedback & Scorecard
    rating = Column(Integer, nullable=True)  # 1 to 5 stars
    feedback = Column(Text, nullable=True)
    criteria_ratings = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="interviews")
