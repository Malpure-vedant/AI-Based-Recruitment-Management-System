"""
Central import point for all SQLAlchemy ORM models.
Import this module to ensure all tables are registered with Base.metadata
before calling Base.metadata.create_all() or running Alembic migrations.
"""
from app.core.database import Base  # noqa: F401 — exposes Base for Alembic env.py

from app.models.user                       import User                       # noqa: F401
from app.models.recruiter                  import Recruiter                  # noqa: F401
from app.models.candidate                  import Candidate                  # noqa: F401
from app.models.candidate_skill            import CandidateSkill             # noqa: F401
from app.models.job                        import Job                        # noqa: F401
from app.models.resume                     import Resume                     # noqa: F401
from app.models.application                import Application                # noqa: F401
from app.models.application_status_history import ApplicationStatusHistory   # noqa: F401
from app.models.interview                  import Interview                  # noqa: F401
from app.models.interview_feedback         import InterviewFeedback          # noqa: F401
from app.models.notification               import Notification               # noqa: F401

__all__ = [
    "Base",
    "User",
    "Recruiter",
    "Candidate",
    "CandidateSkill",
    "Job",
    "Resume",
    "Application",
    "ApplicationStatusHistory",
    "Interview",
    "InterviewFeedback",
    "Notification",
]
