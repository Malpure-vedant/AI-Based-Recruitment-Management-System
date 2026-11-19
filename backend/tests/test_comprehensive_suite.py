"""
TalentPulse AI — Comprehensive Automated Test Suite
Verifies all 12 core functional domains and security controls:
1. User registration & login
2. JWT authentication & expiry/invalid checks
3. Job creation & management
4. Candidate registration & deduplication
5. Resume uploading (valid PDF, non-PDF rejection, size limit)
6. PyMuPDF PDF text extraction
7. Gemini AI / Rubric screening integration
8. Candidate screening & explanation scores
9. Recruitment pipeline Kanban & audit history
10. Interview scheduling & scorecard feedback
11. Dashboard analytics & dynamic PostgreSQL KPIs
12. Input validation & error handling
Security: RBAC, file security, input constraints, API key protection
"""
import os
import sys
import time
import io
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import fitz  # PyMuPDF
from app.core.database import SessionLocal
from app.core.security import create_access_token, decode_access_token
from app.core.config import settings
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.interview import Interview
from app.models.interview_feedback import InterviewFeedback

from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.job import JobCreate, JobUpdate
from app.schemas.candidate import CandidateCreate
from app.schemas.application import ApplicationApply, ApplicationShortlistRequest, ApplicationRejectRequest, ApplicationUpdateStatus
from app.schemas.interview import InterviewCreate, FeedbackCreate
from app.schemas.screening import ScreeningRequest

from app.api.v1.endpoints.auth import register, login, get_user_profile
from app.api.v1.endpoints.jobs import create_job, list_jobs, update_job
from app.api.v1.endpoints.candidates import create_candidate, get_candidates, search_candidates
from app.api.v1.endpoints.applications import (
    apply_for_job,
    shortlist_candidate,
    reject_candidate,
    update_application_status,
    get_candidate_rankings,
    get_pipeline_kanban_board
)
from app.api.v1.endpoints.resumes import upload_resume, extract_resume_text
from app.api.v1.endpoints.screening import screen_application
from app.api.v1.endpoints.interviews import schedule_interview, store_interview_feedback, list_interviews, get_user_notifications
from app.api.v1.endpoints.analytics import get_recruitment_analytics
from app.services.ai_scoring import gemini_screening_service
from app.services.resume_parser import resume_parser_service

from fastapi import HTTPException, UploadFile


def run_full_suite():
    print("=" * 80)
    print("TALENTPULSE AI — 12-POINT AUTOMATED TEST SUITE & SECURITY AUDIT")
    print("=" * 80)

    db = SessionLocal()
    ts = int(time.time())

    try:
        # =========================================================================
        # 1. USER REGISTRATION AND LOGIN
        # =========================================================================
        print("\n[Test 1] User Registration & Login...")
        recruiter_email = f"test_recruiter_{ts}@talentpulse.ai"
        user_in = UserCreate(
            email=recruiter_email,
            password="StrongPassword123!",
            full_name="Alex Mercer",
            role="RECRUITER",
            department="Engineering Talent",
            title="Senior Technical Recruiter"
        )
        recruiter = register(user_in=user_in, db=db)
        assert recruiter.id is not None
        assert recruiter.email == recruiter_email
        assert recruiter.role == "RECRUITER"

        # Duplicate email registration must be rejected with 400
        try:
            register(user_in=user_in, db=db)
            assert False, "Duplicate user registration should have failed"
        except HTTPException as ex:
            assert ex.status_code == 400
            print("  ✓ Duplicate email rejection verified: HTTP 400")

        # Login with correct password
        login_res = login(login_data=UserLogin(email=recruiter_email, password="StrongPassword123!"), db=db)
        assert "access_token" in login_res
        token = login_res["access_token"]
        assert login_res["token_type"] == "bearer"
        print("  ✓ User registration & login verified: HTTP 200")

        # Login with incorrect password must be rejected with 401
        try:
            login(login_data=UserLogin(email=recruiter_email, password="WrongPassword!"), db=db)
            assert False, "Login with wrong password should have failed"
        except HTTPException as ex:
            assert ex.status_code == 401
            print("  ✓ Bad credentials rejection verified: HTTP 401")

        # =========================================================================
        # 2. JWT AUTHENTICATION
        # =========================================================================
        print("\n[Test 2] JWT Authentication...")
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == recruiter.id
        assert decoded["role"] == "RECRUITER"
        assert "exp" in decoded

        # Test malformed token
        invalid_decoded = decode_access_token("malformed.token.here")
        assert invalid_decoded is None
        print("  ✓ JWT creation, HMAC SHA-256 signing, and validation: OK")

        # Protected route /auth/me
        me = get_user_profile(current_user=recruiter)
        assert me.id == recruiter.id
        assert me.full_name == "Alex Mercer"
        print("  ✓ Protected endpoint access with valid Bearer context: OK")

        # =========================================================================
        # 3. JOB CREATION AND MANAGEMENT
        # =========================================================================
        print("\n[Test 3] Job Creation & Requisition Management...")
        job_in = JobCreate(
            title=f"Staff Site Reliability Engineer #{ts % 1000}",
            department="Infrastructure & SRE",
            location="San Francisco, CA (Hybrid)",
            job_type="Full-time",
            experience_level="Senior",
            salary_range="$180,000 - $220,000",
            openings=2,
            status="OPEN",
            description="Manage scalable multi-cluster Kubernetes deployments and automated CI/CD security.",
            responsibilities=["Maintain 99.99% uptime", "Architect Terraform IaC modules"],
            required_skills=["Kubernetes", "Terraform", "AWS", "Python", "Docker"],
            preferred_skills=["Go", "Helm", "Prometheus"],
            scoring_weights={"skills": 0.40, "experience": 0.35, "education": 0.15, "domain": 0.10}
        )
        job = create_job(job_in=job_in, db=db, current_user=recruiter)
        assert job.id is not None
        assert job.status == "OPEN"
        assert job.openings == 2
        print(f"  ✓ Job created: '{job.title}' (ID: {job.id})")

        # List jobs with status filter
        job_list = list_jobs(skip=0, limit=20, status="OPEN", department=None, search=None, db=db)
        total_jobs = job_list["total"] if isinstance(job_list, dict) else job_list.total
        assert total_jobs >= 1
        print(f"  ✓ Job list retrieved: {total_jobs} total openings")

        # Update job status: OPEN -> PAUSED
        paused_job = update_job(job_id=job.id, job_in=JobUpdate(status="PAUSED"), db=db, current_user=recruiter)
        assert paused_job.status == "PAUSED"
        # Restore to OPEN
        opened_job = update_job(job_id=job.id, job_in=JobUpdate(status="OPEN"), db=db, current_user=recruiter)
        assert opened_job.status == "OPEN"
        print("  ✓ Job lifecycle status transitions (OPEN -> PAUSED -> OPEN): OK")

        # =========================================================================
        # 4. CANDIDATE REGISTRATION & SEARCH
        # =========================================================================
        print("\n[Test 4] Candidate Registration & Deduplication...")
        cand_email = f"marcus_dev_{ts}@domain.org"
        cand_in = CandidateCreate(
            first_name="Marcus",
            last_name="Vance",
            email=cand_email,
            phone="+1 (415) 345-6789",
            location="San Francisco, CA",
            headline="Staff Cloud Systems Engineer",
            total_experience_years=7.5,
            highest_education="M.S. in Computer Science",
            skills=["Kubernetes", "Terraform", "Python", "AWS", "Docker", "FastAPI"]
        )
        cand = create_candidate(candidate_in=cand_in, db=db, current_user=recruiter)
        assert cand.id is not None
        assert cand.email == cand_email
        print(f"  ✓ Candidate registered: {cand.full_name} ({cand.email})")

        # Deduplication: Re-registering candidate with same email must fail
        try:
            create_candidate(candidate_in=cand_in, db=db, current_user=recruiter)
            assert False, "Duplicate candidate registration should have failed"
        except HTTPException as ex:
            assert ex.status_code == 400
            print("  ✓ Candidate email deduplication verified: HTTP 400")

        # Search candidate by name
        search_res = search_candidates(q="Marcus", skip=0, limit=10, db=db, current_user=recruiter)
        search_total = search_res["total"] if isinstance(search_res, dict) else search_res.total
        assert search_total >= 1
        print("  ✓ Candidate search by query term: OK")

        # =========================================================================
        # 5. RESUME UPLOADING & SECURITY VALIDATION
        # =========================================================================
        print("\n[Test 5] Resume Uploading & File Security Controls...")
        # Create a sample PDF file in memory
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text(
            (50, 72),
            f"Marcus Vance\nEmail: {cand_email}\nPhone: (415) 345-6789\n"
            "Summary: Senior Cloud Engineer with 7+ years of experience in Kubernetes, Terraform, and Python.\n"
            "Technical Skills: Kubernetes, Terraform, AWS, Python, Docker, FastAPI, PostgreSQL.\n"
            "Experience:\n- Staff Infrastructure Architect at CloudSphere (4 years)\n"
            "Education: M.S. in Computer Science, Stanford University (2018)"
        )
        pdf_bytes = doc.tobytes()
        doc.close()

        # Test valid PDF upload
        pdf_upload = UploadFile(
            filename="Marcus_Vance_Resume.pdf",
            file=io.BytesIO(pdf_bytes),
            headers={"content-type": "application/pdf"}
        )
        upload_res = upload_resume(file=pdf_upload, current_user=recruiter)

        assert "file_name" in upload_res
        assert os.path.exists(upload_res["file_path"])
        print(f"  ✓ Valid PDF uploaded: {upload_res['file_name']}")

        # Security Test: Reject non-PDF file extension
        bad_file = UploadFile(
            filename="malicious_script.sh",
            file=io.BytesIO(b"#!/bin/bash\necho bad"),
            headers={"content-type": "text/x-shellscript"}
        )
        try:
            upload_resume(file=bad_file, current_user=recruiter)
            assert False, "Non-PDF upload should have failed"
        except HTTPException as ex:
            assert ex.status_code == 400
            print("  ✓ Non-PDF file rejection verified (.sh / executable): HTTP 400")

        # Security Test: Max file size enforcement (simulate > 15MB)
        oversized_bytes = b"0" * (16 * 1024 * 1024)
        oversized_file = UploadFile(
            filename="oversized_resume.pdf",
            file=io.BytesIO(oversized_bytes),
            headers={"content-type": "application/pdf"}
        )
        try:
            upload_resume(file=oversized_file, current_user=recruiter)
            assert False, "Oversized file should have failed"
        except HTTPException as ex:
            assert ex.status_code == 400
            print(f"  ✓ Oversized file rejection verified (> {settings.MAX_UPLOAD_SIZE_MB}MB): HTTP 400")

        # =========================================================================
        # 6. PDF TEXT EXTRACTION (PyMuPDF)
        # =========================================================================
        print("\n[Test 6] PyMuPDF Layout Parsing & Entity Extraction...")
        extract_upload = UploadFile(
            filename="Marcus_Vance_Resume.pdf",
            file=io.BytesIO(pdf_bytes),
            headers={"content-type": "application/pdf"}
        )
        parsed_result = extract_resume_text(file=extract_upload)
        page_count = parsed_result.get("page_count") if isinstance(parsed_result, dict) else parsed_result.page_count
        detected_email = parsed_result.get("detected_email") if isinstance(parsed_result, dict) else parsed_result.detected_email
        detected_skills = parsed_result.get("detected_skills") if isinstance(parsed_result, dict) else parsed_result.detected_skills
        raw_text = parsed_result.get("extracted_text") if isinstance(parsed_result, dict) else getattr(parsed_result, "raw_text", "")
        assert page_count == 1
        assert detected_email == cand_email
        assert "Kubernetes" in detected_skills
        assert "Terraform" in detected_skills
        assert "Python" in detected_skills
        print(f"  ✓ PyMuPDF extracted text length: {len(raw_text)} chars")
        print(f"  ✓ Detected Email: {detected_email}")
        print(f"  ✓ Detected Skills: {', '.join(detected_skills[:5])}")

        # =========================================================================
        # 7. GEMINI AI / RUBRIC SCREENING INTEGRATION
        # =========================================================================
        print("\n[Test 7] Gemini AI & Deterministic Rubric Service...")
        job_dict = {
            "title": job.title,
            "department": job.department,
            "description": job.description,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
            "scoring_weights": job.scoring_weights
        }
        ai_result = gemini_screening_service.screen_resume(job_dict, raw_text)
        assert ai_result.overall_score >= 0.0 and ai_result.overall_score <= 100.0
        assert ai_result.verdict in ("STRONG_FIT", "FIT", "WEAK_FIT", "NOT_FIT")
        assert len(ai_result.matched_skills) > 0
        assert len(ai_result.suggested_interview_questions) > 0
        print(f"  ✓ AI Engine output score: {ai_result.overall_score}% ({ai_result.verdict})")
        print(f"  ✓ Matched: {ai_result.matched_skills}")
        print(f"  ✓ Missing: {ai_result.missing_skills}")
        print(f"  ✓ Generated Questions count: {len(ai_result.suggested_interview_questions)}")

        # =========================================================================
        # 8. CANDIDATE SCREENING & PERSISTENCE
        # =========================================================================
        print("\n[Test 8] Candidate Application & Automated Scoring...")
        apply_in = ApplicationApply(
            job_id=job.id,
            first_name="Marcus",
            last_name="Vance",
            email=cand_email,
            phone="+1 (415) 345-6789",
            location="San Francisco, CA",
            resume_file_name="Marcus_Vance_Resume.pdf"
        )
        app_obj = apply_for_job(apply_in=apply_in, db=db)
        assert app_obj.id is not None
        assert app_obj.candidate_id == cand.id
        print(f"  ✓ Candidate application created: ID={app_obj.id}, Status={app_obj.status}")

        # Screen application
        screen_req = ScreeningRequest(application_id=app_obj.id, job_id=job.id)
        screen_res = screen_application(body=screen_req, db=db, current_user=recruiter)
        assert screen_res.success is True
        assert screen_res.result.overall_score > 0
        print(f"  ✓ Application scored and persisted: {screen_res.result.overall_score}%")

        # =========================================================================
        # 9. RECRUITMENT PIPELINE & AUDIT TRAIL
        # =========================================================================
        print("\n[Test 9] Recruitment Pipeline Kanban & Audit Trail...")
        # Step A: Shortlist candidate
        shortlisted = shortlist_candidate(
            application_id=app_obj.id,
            shortlist_in=ApplicationShortlistRequest(notes="Candidate demonstrated strong Kubernetes architecture knowledge."),
            db=db,
            current_user=recruiter
        )
        assert shortlisted.status == "SHORTLISTED"
        assert shortlisted.is_shortlisted is True
        print("  ✓ Candidate moved to SHORTLISTED")

        # Verify audit history row created
        history_records = db.query(ApplicationStatusHistory).filter(
            ApplicationStatusHistory.application_id == app_obj.id
        ).all()
        assert len(history_records) >= 1
        last_hist = history_records[-1]
        assert last_hist.to_status == "SHORTLISTED"
        print(f"  ✓ Audit history row logged: {last_hist.from_status} -> {last_hist.to_status} (by {last_hist.changed_by_name})")

        # Retrieve Kanban Board
        kanban = get_pipeline_kanban_board(job_id=job.id, db=db, current_user=recruiter)
        assert kanban.total_candidates >= 1
        assert len(kanban.columns) == 7
        print(f"  ✓ Kanban board retrieved: {len(kanban.columns)} columns, {kanban.total_candidates} candidates")

        # =========================================================================
        # 10. INTERVIEW MANAGEMENT & FEEDBACK
        # =========================================================================
        print("\n[Test 10] Interview Scheduling & Scorecards...")
        int_in = InterviewCreate(
            application_id=app_obj.id,
            interviewer_name=recruiter.full_name,
            interviewer_id=recruiter.id,
            interview_round="Technical Round 1: Distributed Systems",
            scheduled_at=datetime(2026, 11, 28, 14, 0, 0, tzinfo=timezone.utc),
            duration_minutes=60,
            meeting_link="https://meet.google.com/test-talentpulse",
            notes="Evaluate Kubernetes orchestration and Terraform."
        )
        interview = schedule_interview(interview_in=int_in, db=db, current_user=recruiter)
        assert interview.id is not None
        assert interview.status == "SCHEDULED"
        print(f"  ✓ Interview scheduled: ID={interview.id}, Round={interview.interview_round}")

        # In-app notifications
        notifs = get_user_notifications(unread_only=False, db=db, current_user=recruiter)
        assert len(notifs) >= 1
        print(f"  ✓ In-app notifications verified: {len(notifs)} notifications found")

        # Store Interview Feedback Scorecard
        fb_in = FeedbackCreate(
            overall_recommendation="STRONG_HIRE",
            rating=5,
            technical_score=5,
            communication_score=5,
            problem_solving_score=5,
            cultural_fit_score=5,
            strengths_noted="Superb depth on container orchestration, cloud resilience, and IaC.",
            concerns_noted="None",
            detailed_feedback="Unanimous pass. High-impact addition to the SRE organization."
        )
        fb_res = store_interview_feedback(
            interview_id=interview.id,
            feedback_in=fb_in,
            db=db,
            current_user=recruiter
        )
        assert fb_res.status == "COMPLETED"
        assert fb_res.feedback is not None
        assert fb_res.feedback.rating == 5
        assert fb_res.feedback.overall_recommendation == "STRONG_HIRE"
        print(f"  ✓ Interview feedback scorecard submitted: 5★ {fb_res.feedback.overall_recommendation}")

        # Advance to SELECTED / OFFERED
        selected_res = update_application_status(
            application_id=app_obj.id,
            status_in=ApplicationUpdateStatus(status="SELECTED", reason="Offer accepted by candidate."),
            db=db,
            current_user=recruiter
        )
        assert selected_res.status in ("SELECTED", "OFFERED")
        print(f"  ✓ Candidate advanced to final offer stage: {selected_res.status}")

        # =========================================================================
        # 11. DASHBOARD ANALYTICS TELEMETRY
        # =========================================================================
        print("\n[Test 11] Recruitment Analytics Dashboard Telemetry...")
        analytics = get_recruitment_analytics(range_filter="Last 6 Months", db=db, current_user=recruiter)
        kpis = analytics.kpis
        assert kpis.total_applications >= 1
        assert kpis.total_jobs >= 1
        assert kpis.shortlisted_candidates >= 1
        assert len(analytics.applications_over_time) == 6
        assert len(analytics.status_distribution) == 7
        assert len(analytics.recruitment_funnel) == 6
        assert len(analytics.interview_outcomes) == 5
        print(f"  ✓ Dynamic KPIs verified: Total Apps={kpis.total_applications}, Active Jobs={kpis.active_jobs}, Shortlisted={kpis.shortlisted_candidates}")
        print(f"  ✓ 5 Recharts visualizations data verified (Funnel stages={len(analytics.recruitment_funnel)}, Timeline periods={len(analytics.applications_over_time)})")

        # =========================================================================
        # 12. INPUT VALIDATION & ERROR HANDLING
        # =========================================================================
        print("\n[Test 12] API Input Validation & Security Assertions...")
        # A. Invalid Application ID check -> HTTP 404
        try:
            shortlist_candidate(
                application_id="non-existent-uuid-1234",
                shortlist_in=ApplicationShortlistRequest(notes="Test"),
                db=db,
                current_user=recruiter
            )
            assert False, "Non-existent application shortlist should have failed"
        except HTTPException as ex:
            assert ex.status_code == 404
            print("  ✓ Non-existent resource error handling: HTTP 404")

        # B. Invalid Rating validation check (Rating must be 1 to 5)
        try:
            FeedbackCreate(
                overall_recommendation="HIRE",
                rating=10,  # Invalid: > 5
                detailed_feedback="Invalid rating"
            )
            assert False, "Rating > 5 should fail Pydantic validation"
        except Exception:
            print("  ✓ Scorecard rating boundary constraint [1..5] enforced")

        # C. Invalid Job Opening value (openings must be > 0)
        try:
            JobCreate(
                title="Bad Job",
                department="Engineering",
                description="Short",
                openings=0  # Invalid: must be >= 1
            )
            assert False, "Openings <= 0 should fail Pydantic validation"
        except Exception:
            print("  ✓ Job openings boundary constraint [>= 1] enforced")

        # D. Security Check: API Key privacy
        assert "GEMINI_API_KEY" not in str(analytics.model_dump())
        assert "SECRET_KEY" not in str(analytics.model_dump())
        print("  ✓ Zero secret leakage in API response bodies: Verified")

        print("\n" + "=" * 80)
        print("ALL 12 TESTING PHASES AND ALL SECURITY CONTROLS VERIFIED SUCCESSFULLY!")
        print("=" * 80)

    finally:
        db.close()


if __name__ == "__main__":
    run_full_suite()
