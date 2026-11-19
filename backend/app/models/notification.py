"""
Notification model — in-app notification messages for any user.
Supports marking read/unread and linking to related entities.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text,
    ForeignKey, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Recipient
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Content
    title   = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    # Notification category
    notification_type = Column(String(50), default="INFO", nullable=False)
    # INFO / SUCCESS / WARNING / ALERT

    # Read state
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Optional link to a related object in the system
    related_entity_type = Column(String(50), nullable=True)   # e.g. 'Application', 'Interview', 'Job'
    related_entity_id   = Column(String(36), nullable=True)   # UUID of that entity

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # ── Relationships ────────────────────────────────────────────────────────
    user = relationship("User", back_populates="notifications")

    # ── Constraints & Indexes ────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint(
            "notification_type IN ('INFO','SUCCESS','WARNING','ALERT')",
            name="check_notification_type"
        ),
        # Fast lookups: unread notifications for a user, newest first
        Index("ix_notifications_user_unread", "user_id", "is_read"),
        Index("ix_notifications_created_desc", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user={self.user_id} type={self.notification_type} read={self.is_read}>"
