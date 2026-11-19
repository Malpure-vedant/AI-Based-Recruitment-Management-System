"""
Resume model — metadata for an uploaded resume file.
Stores filesystem path (never binary), SHA-256 hash for deduplication.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, Text,
    DateTime, ForeignKey, JSON, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Linked candidate
    candidate_id = Column(
        String(36), ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # File metadata (path on disk / object storage — NEVER binary content)
    file_path         = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes   = Column(Integer, nullable=False)
    mime_type         = Column(String(100), default="application/pdf", nullable=False)

    # SHA-256 hex digest for deduplication & integrity checks
    file_hash = Column(String(128), index=True, nullable=True)

    # Only one resume per candidate should be marked primary
    is_primary = Column(Boolean, default=True, nullable=False)

    # PyMuPDF parsed content (populated after upload)
    parsed_text     = Column(Text, nullable=True)
    parsed_metadata = Column(JSON, default=dict, nullable=False)
    # e.g. {"pages": 2, "word_count": 850, "has_contact": True}

    # Processing status
    upload_status = Column(String(50), default="PENDING", nullable=False)
    # PENDING / PROCESSING / COMPLETED / FAILED

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
    candidate    = relationship("Candidate", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")

    # ── Constraints & Indexes ────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint("file_size_bytes > 0", name="check_resume_filesize_positive"),
        CheckConstraint(
            "upload_status IN ('PENDING','PROCESSING','COMPLETED','FAILED')",
            name="check_resume_upload_status"
        ),
        Index("ix_resumes_file_hash", "file_hash"),
        Index("ix_resumes_candidate_id", "candidate_id"),
    )

    def __repr__(self) -> str:
        return f"<Resume id={self.id} file={self.original_filename!r} primary={self.is_primary}>"
