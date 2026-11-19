"""
AI Screening endpoints — resume screening powered by Gemini AI.
"""
from __future__ import annotations

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User
from app.schemas.screening import ScreeningRequest, ScreeningResponse, ScreeningResult
from app.services.ai_scoring import gemini_screening_service
from app.services.resume_parser import resume_parser_service
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _job_to_dict(job: Job) -> Dict[str, Any]:
    """Convert a Job ORM row to the dict the screening service expects."""
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "location": job.location,
        "job_type": job.job_type,
        "experience_level": job.experience_level,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "scoring_weights": job.scoring_weights or {
            "skills": 0.40, "experience": 0.35, "education": 0.15, "domain": 0.10
        },
    }


def _save_screening_result(application: Application, result: ScreeningResult) -> None:
    """Persist ScreeningResult fields back onto the Application row."""
    application.overall_match_score = result.overall_score
    application.technical_score = result.technical_score
    application.experience_score = result.experience_score
    application.education_score = result.education_score
    application.domain_score = result.domain_score
    application.ai_verdict = result.verdict
    application.ai_summary = result.screening_summary
    application.matched_skills = result.matched_skills
    application.missing_skills = result.missing_skills
    application.strengths = result.strengths
    application.weaknesses = result.areas_for_improvement
    application.suggested_questions = result.suggested_interview_questions

    # Advance status only when still in initial state
    if application.status == "APPLIED":
        application.status = "SCREENING"


def _result_from_application(application: Application, candidate: Candidate) -> ScreeningResult:
    """Reconstruct a ScreeningResult from stored DB columns."""
    return ScreeningResult(
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
        technical_skills=[],
        matched_skills=application.matched_skills or [],
        missing_skills=application.missing_skills or [],
        overall_score=float(application.overall_match_score or 0),
        technical_score=float(application.technical_score or 0),
        experience_score=float(application.experience_score or 0),
        education_score=float(application.education_score or 0),
        domain_score=float(application.domain_score or 0),
        verdict=application.ai_verdict or "NOT_FIT",
        screening_summary=application.ai_summary or "",
        strengths=application.strengths or [],
        areas_for_improvement=application.weaknesses or [],
        suggested_interview_questions=application.suggested_questions or [],
        screened_at=application.updated_at,
    )


# ---------------------------------------------------------------------------
# POST /screening/screen
# ---------------------------------------------------------------------------

@router.post("/screen", response_model=ScreeningResponse)
def screen_application(
    body: ScreeningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Screen an existing application against its job description using Gemini AI.

    - Looks up the Application, Job, Candidate and Resume records.
    - Calls the Gemini screening service (or rubric fallback).
    - Persists scores back to the Application row.
    - Updates status from APPLIED → SCREENING.
    """
    # ── Fetch Application ────────────────────────────────────────────────
    application: Optional[Application] = db.query(Application).filter(
        Application.id == body.application_id
    ).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # ── Fetch Job ────────────────────────────────────────────────────────
    job: Optional[Job] = db.query(Job).filter(Job.id == body.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # ── Fetch Candidate ───────────────────────────────────────────────────
    candidate: Optional[Candidate] = db.query(Candidate).filter(
        Candidate.id == application.candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # ── Fetch Resume text ────────────────────────────────────────────────
    resume_text = ""
    if application.resume_id:
        resume: Optional[Resume] = db.query(Resume).filter(
            Resume.id == application.resume_id
        ).first()
        if resume:
            if resume.parsed_text:
                resume_text = resume.parsed_text
            elif resume.file_path and os.path.isfile(resume.file_path):
                try:
                    parsed = resume_parser_service.extract_text_from_pdf(resume.file_path)
                    resume_text = parsed.get("extracted_text", "")
                except Exception as exc:
                    logger.warning("Could not parse resume PDF: %s", exc)

    if not resume_text:
        resume_text = f"Candidate: {candidate.full_name}\nEmail: {candidate.email}"

    # ── Build job dict (inject recruiter override if provided) ───────────
    job_dict = _job_to_dict(job)
    if body.override_instructions:
        job_dict["description"] = (
            job_dict.get("description", "") + "\n\nRECRUITER NOTES: " + body.override_instructions
        )

    # ── Call screening service ───────────────────────────────────────────
    try:
        result: ScreeningResult = gemini_screening_service.screen_resume(job_dict, resume_text)
    except Exception as exc:
        logger.error("Screening service error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Screening failed: {str(exc)}"
        )

    # ── Persist scores ───────────────────────────────────────────────────
    _save_screening_result(application, result)
    db.commit()
    db.refresh(application)

    return ScreeningResponse(
        success=True,
        application_id=application.id,
        result=result,
        message=f"Screening completed using {result.engine_used} engine.",
    )


# ---------------------------------------------------------------------------
# GET /screening/result/{application_id}
# ---------------------------------------------------------------------------

@router.get("/result/{application_id}", response_model=ScreeningResponse)
def get_screening_result(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the stored AI screening result for an application."""
    application: Optional[Application] = db.query(Application).filter(
        Application.id == application_id
    ).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.overall_match_score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No screening result found for this application. Run /screen first."
        )

    candidate: Optional[Candidate] = db.query(Candidate).filter(
        Candidate.id == application.candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    result = _result_from_application(application, candidate)

    return ScreeningResponse(
        success=True,
        application_id=application.id,
        result=result,
        message="Stored screening result retrieved.",
    )


# ---------------------------------------------------------------------------
# POST /screening/screen-upload
# ---------------------------------------------------------------------------

@router.post("/screen-upload", response_model=ScreeningResult)
async def screen_upload(
    job_id: str = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ad-hoc screening: upload a PDF and screen it against a job — no existing
    application required. Useful for quick candidate assessments.
    """
    # ── Fetch Job ────────────────────────────────────────────────────────
    job: Optional[Job] = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # ── Validate file type ───────────────────────────────────────────────
    if resume_file.content_type not in ("application/pdf", "application/octet-stream"):
        filename_lower = (resume_file.filename or "").lower()
        if not filename_lower.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are accepted."
            )

    # ── Save file temporarily ────────────────────────────────────────────
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    try:
        content = await resume_file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit."
            )
        with open(file_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(exc)}"
        )

    # ── Parse PDF ────────────────────────────────────────────────────────
    try:
        parsed = resume_parser_service.extract_text_from_pdf(file_path)
        resume_text = parsed.get("extracted_text", "")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse PDF: {str(exc)}"
        )
    finally:
        # Clean up temp file
        try:
            os.remove(file_path)
        except OSError:
            pass

    if not resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded PDF appears to be empty or unreadable."
        )

    # ── Screen ────────────────────────────────────────────────────────────
    job_dict = _job_to_dict(job)
    try:
        result: ScreeningResult = gemini_screening_service.screen_resume(job_dict, resume_text)
    except Exception as exc:
        logger.error("Ad-hoc screening error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Screening failed: {str(exc)}"
        )

    return result


# ---------------------------------------------------------------------------
# GET /screening/jobs/{job_id}/rankings
# ---------------------------------------------------------------------------

@router.get("/jobs/{job_id}/rankings")
def get_job_rankings(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all applications for a job sorted by overall_match_score DESC.
    Returns candidate name, scores, verdict, and pipeline status.
    """
    job: Optional[Job] = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    applications: List[Application] = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .order_by(Application.overall_match_score.desc().nullslast())
        .all()
    )

    rankings = []
    for idx, app in enumerate(applications, start=1):
        candidate: Optional[Candidate] = db.query(Candidate).filter(
            Candidate.id == app.candidate_id
        ).first()
        rankings.append({
            "rank": idx,
            "application_id": app.id,
            "candidate_id": app.candidate_id,
            "candidate_name": candidate.full_name if candidate else "Unknown",
            "candidate_email": candidate.email if candidate else None,
            "overall_score": float(app.overall_match_score) if app.overall_match_score is not None else None,
            "technical_score": float(app.technical_score) if app.technical_score is not None else None,
            "experience_score": float(app.experience_score) if app.experience_score is not None else None,
            "education_score": float(app.education_score) if app.education_score is not None else None,
            "domain_score": float(app.domain_score) if app.domain_score is not None else None,
            "verdict": app.ai_verdict,
            "status": app.status,
            "is_shortlisted": app.is_shortlisted,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        })

    return {
        "job_id": job_id,
        "job_title": job.title,
        "total_applications": len(rankings),
        "rankings": rankings,
    }
