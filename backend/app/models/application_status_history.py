"""
ApplicationStatusHistory model — tracks every transition of an application
through the recruitment pipeline with timestamps, actor, and reasons.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    application_id = Column(
        String(36),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False, index=True)

    changed_by_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    changed_by_name = Column(String(150), nullable=True)

    reason = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    application = relationship("Application", back_populates="status_history")
    changed_by = relationship("User")

    __table_args__ = (
        Index("ix_app_history_app_created", "application_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<ApplicationStatusHistory id={self.id} app={self.application_id} {self.from_status}->{self.to_status}>"
