"""
Seed script — populates all 10 database tables with realistic sample data.

Run from the backend/ directory:
    python db/seed.py

Idempotent: existing records (detected by email/unique key) are skipped.
"""
import sys
import os
from datetime import datetime, timezone, timedelta

# Add backend/ to path so app imports work
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
import app.models  # noqa — registers all models

from app.models.user               import User
from app.models.recruiter          import Recruiter
from app.models.candidate          import Candidate
from app.models.candidate_skill    import CandidateSkill
from app.models.job                import Job
from app.models.resume             import Resume
from app.models.application        import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.interview          import Interview
from app.models.interview_feedback import InterviewFeedback
from app.models.notification       import Notification

# ── Ensure tables exist ───────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

NOW   = datetime.now(timezone.utc)
PAST  = lambda days: NOW - timedelta(days=days)   # noqa: E731
FUTURE = lambda days: NOW + timedelta(days=days)  # noqa: E731


def seed():
    db = SessionLocal()
    try:
        print("🌱  Starting seed…")

        # ── 1. USERS ──────────────────────────────────────────────────────────
        users_data = [
            {
                "email": "sarah.jenkins@hireai.enterprise",
                "full_name": "Sarah Jenkins",
                "role": "SUPER_ADMIN",
                "password": "admin123",
            },
            {
                "email": "mike.chen@hireai.enterprise",
                "full_name": "Mike Chen",
                "role": "RECRUITER",
                "password": "recruiter123",
            },
            {
                "email": "priya.sharma@hireai.enterprise",
                "full_name": "Priya Sharma",
                "role": "INTERVIEWER",
                "password": "interviewer123",
            },
        ]

        users = {}
        for ud in users_data:
            existing = db.query(User).filter(User.email == ud["email"]).first()
            if not existing:
                u = User(
                    email=ud["email"],
                    hashed_password=get_password_hash(ud["password"]),
                    full_name=ud["full_name"],
                    role=ud["role"],
                    is_active=True,
                )
                db.add(u)
                db.flush()
                users[ud["email"]] = u
                print(f"  ✔ User: {ud['email']} ({ud['role']})")
            else:
                users[ud["email"]] = existing
                print(f"  ⏭ User already exists: {ud['email']}")
        db.commit()

        # ── 2. RECRUITERS ─────────────────────────────────────────────────────
        recruiters_data = [
            {
                "user": users["sarah.jenkins@hireai.enterprise"],
                "department": "Talent Acquisition",
                "title": "Lead Talent Partner & AI Hiring Manager",
                "hiring_quota": 20,
            },
            {
                "user": users["mike.chen@hireai.enterprise"],
                "department": "Engineering",
                "title": "Technical Recruiter",
                "hiring_quota": 15,
            },
        ]

        recruiters = {}
        for rd in recruiters_data:
            existing = db.query(Recruiter).filter(
                Recruiter.user_id == rd["user"].id
            ).first()
            if not existing:
                r = Recruiter(
                    user_id=rd["user"].id,
                    department=rd["department"],
                    title=rd["title"],
                    hiring_quota=rd["hiring_quota"],
                )
                db.add(r)
                db.flush()
                recruiters[rd["user"].email] = r
                print(f"  ✔ Recruiter: {rd['user'].full_name}")
            else:
                recruiters[rd["user"].email] = existing
                print(f"  ⏭ Recruiter already exists: {rd['user'].full_name}")
        db.commit()

        # ── 3. CANDIDATES ─────────────────────────────────────────────────────
        candidates_data = [
            {
                "email": "alex.morgan@gmail.com",
                "full_name": "Alex Morgan",
                "phone": "+1-415-555-0192",
                "location": "San Francisco, CA",
                "current_title": "Senior Software Engineer",
                "current_company": "TechCorp Inc.",
                "experience_years": 7,
                "education_level": "Master's Degree",
                "summary": (
                    "Experienced software engineer specializing in distributed systems, "
                    "API design, and ML pipeline integration."
                ),
            },
            {
                "email": "jasmine.patel@outlook.com",
                "full_name": "Jasmine Patel",
                "phone": "+1-650-555-0217",
                "location": "Palo Alto, CA",
                "current_title": "ML Research Engineer",
                "current_company": "DeepAI Labs",
                "experience_years": 5,
                "education_level": "PhD",
                "summary": (
                    "AI researcher with expertise in NLP, transformers, and production ML systems."
                ),
            },
            {
                "email": "carlos.rivera@yahoo.com",
                "full_name": "Carlos Rivera",
                "phone": "+1-512-555-0183",
                "location": "Austin, TX",
                "current_title": "Backend Developer",
                "current_company": "StartupXYZ",
                "experience_years": 3,
                "education_level": "Bachelor's Degree",
                "summary": "Backend developer with strong Python and cloud infrastructure skills.",
            },
        ]

        candidates = {}
        for cd in candidates_data:
            existing = db.query(Candidate).filter(Candidate.email == cd["email"]).first()
            if not existing:
                c = Candidate(
                    email=cd["email"],
                    full_name=cd["full_name"],
                    phone=cd["phone"],
                    location=cd["location"],
                    current_title=cd["current_title"],
                    current_company=cd["current_company"],
                    experience_years=cd["experience_years"],
                    education_level=cd["education_level"],
                    summary=cd["summary"],
                    status="ACTIVE",
                )
                db.add(c)
                db.flush()
                candidates[cd["email"]] = c
                print(f"  ✔ Candidate: {cd['full_name']}")
            else:
                candidates[cd["email"]] = existing
                print(f"  ⏭ Candidate already exists: {cd['full_name']}")
        db.commit()

        # ── 4. CANDIDATE SKILLS ───────────────────────────────────────────────
        skills_data = [
            # Alex Morgan
            ("alex.morgan@gmail.com", "Python",     "EXPERT",        7),
            ("alex.morgan@gmail.com", "FastAPI",    "ADVANCED",      4),
            ("alex.morgan@gmail.com", "PostgreSQL", "ADVANCED",      5),
            ("alex.morgan@gmail.com", "Docker",     "INTERMEDIATE",  3),
            # Jasmine Patel
            ("jasmine.patel@outlook.com", "Python",    "EXPERT",    5),
            ("jasmine.patel@outlook.com", "PyTorch",   "EXPERT",    4),
            ("jasmine.patel@outlook.com", "LLMs",      "EXPERT",    3),
            ("jasmine.patel@outlook.com", "FastAPI",   "ADVANCED",  2),
            # Carlos Rivera
            ("carlos.rivera@yahoo.com", "Python",     "ADVANCED",  3),
            ("carlos.rivera@yahoo.com", "FastAPI",    "INTERMEDIATE", 2),
            ("carlos.rivera@yahoo.com", "Docker",     "BEGINNER",  1),
        ]

        for (email, skill_name, proficiency, years) in skills_data:
            candidate = candidates.get(email)
            if not candidate:
                continue
            existing_skill = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate.id,
                CandidateSkill.skill_name == skill_name,
            ).first()
            if not existing_skill:
                db.add(CandidateSkill(
                    candidate_id=candidate.id,
                    skill_name=skill_name,
                    proficiency=proficiency,
                    years_of_experience=years,
                    is_verified=True,
                ))
        db.commit()
        print(f"  ✔ CandidateSkills seeded")

        # ── 5. JOBS ───────────────────────────────────────────────────────────
        recruiter_sarah = recruiters.get("sarah.jenkins@hireai.enterprise")
        recruiter_mike  = recruiters.get("mike.chen@hireai.enterprise")

        jobs_data = [
            {
                "title": "Senior AI / Machine Learning Engineer",
                "department": "Artificial Intelligence",
                "location": "San Francisco, CA (Hybrid)",
                "job_type": "Full-time",
                "experience_level": "Senior",
                "min_salary": 165000, "max_salary": 210000,
                "openings": 2,
                "status": "OPEN",
                "recruiter_id": recruiter_sarah.id if recruiter_sarah else None,
                "description": "Build and deploy AI/ML systems powering TalentPulse.",
                "required_skills": ["Python", "PyTorch", "FastAPI", "LLMs", "Docker"],
                "preferred_skills": ["Kubernetes", "MLOps", "Vector Databases"],
            },
            {
                "title": "Full-Stack Engineer (React + FastAPI)",
                "department": "Engineering",
                "location": "Remote",
                "job_type": "Full-time",
                "experience_level": "Mid-Level",
                "min_salary": 120000, "max_salary": 160000,
                "openings": 3,
                "status": "OPEN",
                "recruiter_id": recruiter_mike.id if recruiter_mike else None,
                "description": "Develop and maintain our recruitment platform frontend and backend.",
                "required_skills": ["Python", "FastAPI", "React", "PostgreSQL"],
                "preferred_skills": ["Docker", "Redis", "Tailwind CSS"],
            },
            {
                "title": "Data Scientist — People Analytics",
                "department": "People Operations",
                "location": "New York, NY",
                "job_type": "Full-time",
                "experience_level": "Mid-Level",
                "min_salary": 110000, "max_salary": 145000,
                "openings": 1,
                "status": "DRAFT",
                "recruiter_id": recruiter_sarah.id if recruiter_sarah else None,
                "description": "Drive insights from HR data using statistical models and BI tools.",
                "required_skills": ["Python", "SQL", "Statistics", "Data Visualization"],
                "preferred_skills": ["Tableau", "Power BI", "R"],
            },
        ]

        jobs = {}
        for jd in jobs_data:
            existing = db.query(Job).filter(Job.title == jd["title"]).first()
            if not existing:
                j = Job(
                    title=jd["title"],
                    department=jd["department"],
                    location=jd["location"],
                    job_type=jd["job_type"],
                    experience_level=jd["experience_level"],
                    min_salary=jd["min_salary"],
                    max_salary=jd["max_salary"],
                    openings=jd["openings"],
                    status=jd["status"],
                    recruiter_id=jd["recruiter_id"],
                    description=jd["description"],
                    responsibilities=["Lead architecture decisions", "Collaborate across teams"],
                    required_skills=jd["required_skills"],
                    preferred_skills=jd["preferred_skills"],
                    scoring_weights={
                        "skills": 0.40, "experience": 0.35,
                        "education": 0.15, "domain": 0.10
                    },
                )
                db.add(j)
                db.flush()
                jobs[jd["title"]] = j
                print(f"  ✔ Job: {jd['title']}")
            else:
                jobs[jd["title"]] = existing
                print(f"  ⏭ Job already exists: {jd['title']}")
        db.commit()

        # ── 6. RESUMES ────────────────────────────────────────────────────────
        resumes_data = [
            {
                "candidate_email": "alex.morgan@gmail.com",
                "file_path": "uploads/resumes/alex_morgan_resume.pdf",
                "original_filename": "Alex_Morgan_Resume_2025.pdf",
                "file_hash": "sha256:a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
                "file_size_bytes": 245760,
            },
            {
                "candidate_email": "jasmine.patel@outlook.com",
                "file_path": "uploads/resumes/jasmine_patel_resume.pdf",
                "original_filename": "Jasmine_Patel_CV_2025.pdf",
                "file_hash": "sha256:b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
                "file_size_bytes": 198144,
            },
        ]

        resumes = {}
        for rd in resumes_data:
            candidate = candidates.get(rd["candidate_email"])
            if not candidate:
                continue
            existing = db.query(Resume).filter(Resume.file_hash == rd["file_hash"]).first()
            if not existing:
                r = Resume(
                    candidate_id=candidate.id,
                    file_path=rd["file_path"],
                    original_filename=rd["original_filename"],
                    file_hash=rd["file_hash"],
                    file_size_bytes=rd["file_size_bytes"],
                    mime_type="application/pdf",
                    is_primary=True,
                    parsed_text="[Sample parsed resume text — populated by PyMuPDF on actual upload]",
                    parsed_metadata={"pages": 2, "word_count": 850, "has_contact": True},
                    upload_status="COMPLETED",
                )
                db.add(r)
                db.flush()
                resumes[rd["candidate_email"]] = r
                print(f"  ✔ Resume: {rd['original_filename']}")
            else:
                resumes[rd["candidate_email"]] = existing
                print(f"  ⏭ Resume already exists: {rd['original_filename']}")
        db.commit()

        # ── 7. APPLICATIONS ───────────────────────────────────────────────────
        ai_job = jobs.get("Senior AI / Machine Learning Engineer")
        fs_job = jobs.get("Full-Stack Engineer (React + FastAPI)")

        alex    = candidates.get("alex.morgan@gmail.com")
        jasmine = candidates.get("jasmine.patel@outlook.com")
        carlos  = candidates.get("carlos.rivera@yahoo.com")
        alex_resume    = resumes.get("alex.morgan@gmail.com")
        jasmine_resume = resumes.get("jasmine.patel@outlook.com")

        apps = {}
        applications_data = [
            {
                "key": "jasmine_ai",
                "job": ai_job, "candidate": jasmine, "resume": jasmine_resume,
                "status": "SHORTLISTED",
                "overall_match_score": 94.5, "technical_score": 97.0,
                "experience_score": 92.0, "education_score": 98.0, "domain_score": 91.0,
                "ai_verdict": "STRONG_FIT",
                "ai_summary": (
                    "Jasmine is an outstanding match for this AI/ML role. "
                    "Her PhD and 5 years of hands-on LLM/PyTorch experience exceed requirements."
                ),
                "matched_skills": ["Python", "PyTorch", "LLMs", "FastAPI"],
                "missing_skills": ["Docker"],
                "is_shortlisted": True,
            },
            {
                "key": "alex_ai",
                "job": ai_job, "candidate": alex, "resume": alex_resume,
                "status": "INTERVIEW",
                "overall_match_score": 78.0, "technical_score": 80.0,
                "experience_score": 85.0, "education_score": 70.0, "domain_score": 72.0,
                "ai_verdict": "FIT",
                "ai_summary": "Alex has strong engineering fundamentals but limited ML depth.",
                "matched_skills": ["Python", "FastAPI", "Docker"],
                "missing_skills": ["PyTorch", "LLMs"],
                "is_shortlisted": True,
            },
            {
                "key": "carlos_fs",
                "job": fs_job, "candidate": carlos, "resume": None,
                "status": "SCREENING",
                "overall_match_score": 61.0, "technical_score": 65.0,
                "experience_score": 55.0, "education_score": 60.0, "domain_score": 58.0,
                "ai_verdict": "WEAK_FIT",
                "ai_summary": "Carlos meets basic criteria but lacks React and PostgreSQL depth.",
                "matched_skills": ["Python", "FastAPI"],
                "missing_skills": ["React", "PostgreSQL"],
                "is_shortlisted": False,
            },
        ]

        for ad in applications_data:
            if not ad["job"] or not ad["candidate"]:
                continue
            existing = db.query(Application).filter(
                Application.job_id == ad["job"].id,
                Application.candidate_id == ad["candidate"].id,
            ).first()
            if not existing:
                app_obj = Application(
                    job_id=ad["job"].id,
                    candidate_id=ad["candidate"].id,
                    resume_id=ad["resume"].id if ad["resume"] else None,
                    status=ad["status"],
                    overall_match_score=ad["overall_match_score"],
                    technical_score=ad["technical_score"],
                    experience_score=ad["experience_score"],
                    education_score=ad["education_score"],
                    domain_score=ad["domain_score"],
                    ai_verdict=ad["ai_verdict"],
                    ai_summary=ad["ai_summary"],
                    matched_skills=ad["matched_skills"],
                    missing_skills=ad["missing_skills"],
                    is_shortlisted=ad["is_shortlisted"],
                    shortlisted_at=NOW if ad["is_shortlisted"] else None,
                )
                db.add(app_obj)
                db.flush()
                apps[ad["key"]] = app_obj
                print(f"  ✔ Application: {ad['candidate'].full_name} → {ad['job'].title}")
            else:
                apps[ad["key"]] = existing
                print(f"  ⏭ Application already exists")
        for k, app_inst in apps.items():
            hist_count = db.query(ApplicationStatusHistory).filter(
                ApplicationStatusHistory.application_id == app_inst.id
            ).count()
            if hist_count == 0:
                h1 = ApplicationStatusHistory(
                    application_id=app_inst.id,
                    from_status=None,
                    to_status="APPLIED",
                    changed_by_name="Candidate Portal",
                    reason="Candidate submitted resume and profile",
                    created_at=PAST(14)
                )
                h2 = ApplicationStatusHistory(
                    application_id=app_inst.id,
                    from_status="APPLIED",
                    to_status="SCREENING",
                    changed_by_name="PyMuPDF + Gemini AI",
                    reason=f"Automated AI screening completed: {app_inst.overall_match_score}% relevance",
                    created_at=PAST(12)
                )
                db.add(h1)
                db.add(h2)
                if app_inst.status in ["SHORTLISTED", "INTERVIEW", "INTERVIEW_SCHEDULED"]:
                    h3 = ApplicationStatusHistory(
                        application_id=app_inst.id,
                        from_status="SCREENING",
                        to_status="SHORTLISTED",
                        changed_by_name="Sarah Jenkins",
                        reason="Shortlisted due to top percentile qualification match",
                        created_at=PAST(8)
                    )
                    db.add(h3)
                if app_inst.status in ["INTERVIEW", "INTERVIEW_SCHEDULED"]:
                    h4 = ApplicationStatusHistory(
                        application_id=app_inst.id,
                        from_status="SHORTLISTED",
                        to_status="INTERVIEW_SCHEDULED",
                        changed_by_name="Sarah Jenkins",
                        reason="Scheduled Technical Round 1 with Priya Sharma",
                        created_at=PAST(4)
                    )
                    db.add(h4)
        db.commit()
        interviewer = users.get("priya.sharma@hireai.enterprise")
        alex_app    = apps.get("alex_ai")

        interviews = {}
        if alex_app:
            existing_iv = db.query(Interview).filter(
                Interview.application_id == alex_app.id
            ).first()
            if not existing_iv:
                iv = Interview(
                    application_id=alex_app.id,
                    interviewer_id=interviewer.id if interviewer else None,
                    interviewer_name="Priya Sharma",
                    interview_round="Technical Round 1",
                    scheduled_at=FUTURE(3),
                    duration_minutes=60,
                    meeting_link="https://meet.google.com/abc-defg-hij",
                    meeting_platform="Google Meet",
                    status="SCHEDULED",
                    notes="Focus on system design and ML fundamentals",
                )
                db.add(iv)
                db.flush()
                interviews["alex_tech1"] = iv
                print("  ✔ Interview: Alex Morgan — Technical Round 1")
            else:
                interviews["alex_tech1"] = existing_iv
                print("  ⏭ Interview already exists")

        # Second interview (completed) for Jasmine
        jasmine_app = apps.get("jasmine_ai")
        if jasmine_app:
            existing_iv2 = db.query(Interview).filter(
                Interview.application_id == jasmine_app.id
            ).first()
            if not existing_iv2:
                iv2 = Interview(
                    application_id=jasmine_app.id,
                    interviewer_id=interviewer.id if interviewer else None,
                    interviewer_name="Priya Sharma",
                    interview_round="Technical Round 1",
                    scheduled_at=PAST(5),
                    duration_minutes=90,
                    meeting_link="https://zoom.us/j/12345678",
                    meeting_platform="Zoom",
                    status="COMPLETED",
                    notes="Deep dive into LLM fine-tuning and production deployment",
                )
                db.add(iv2)
                db.flush()
                interviews["jasmine_tech1"] = iv2
                print("  ✔ Interview: Jasmine Patel — Technical Round 1 (completed)")
            else:
                interviews["jasmine_tech1"] = existing_iv2
                print("  ⏭ Interview (Jasmine) already exists")
        db.commit()

        # ── 9. INTERVIEW FEEDBACK ─────────────────────────────────────────────
        jasmine_iv = interviews.get("jasmine_tech1")
        if jasmine_iv:
            existing_fb = db.query(InterviewFeedback).filter(
                InterviewFeedback.interview_id == jasmine_iv.id
            ).first()
            if not existing_fb:
                fb = InterviewFeedback(
                    interview_id=jasmine_iv.id,
                    interviewer_id=interviewer.id if interviewer else None,
                    overall_recommendation="STRONG_HIRE",
                    rating=5,
                    technical_score=5,
                    communication_score=4,
                    problem_solving_score=5,
                    cultural_fit_score=5,
                    strengths_noted=(
                        "Exceptional depth in LLM architectures. Practical experience with "
                        "PyTorch training loops and model optimization."
                    ),
                    concerns_noted="Limited Docker/DevOps exposure, but willing to learn.",
                    detailed_feedback=(
                        "Jasmine demonstrated outstanding technical ability and clear "
                        "communication. She solved the system design problem efficiently and "
                        "showed strong first-principles thinking. Strongly recommend hiring."
                    ),
                )
                db.add(fb)
                db.commit()
                print("  ✔ InterviewFeedback: Jasmine Patel — STRONG_HIRE")
            else:
                print("  ⏭ InterviewFeedback already exists")

        # ── 10. NOTIFICATIONS ──────────────────────────────────────────────────
        admin_user = users.get("sarah.jenkins@hireai.enterprise")
        mike_user  = users.get("mike.chen@hireai.enterprise")

        notifications_data = [
            {
                "user": admin_user,
                "title": "New Strong Candidate Identified",
                "message": "Jasmine Patel scored 94.5% match for Senior AI Engineer role. Review now.",
                "type": "SUCCESS",
                "related_entity_type": "Application",
            },
            {
                "user": admin_user,
                "title": "Interview Scheduled",
                "message": "Technical Round 1 scheduled with Alex Morgan for the AI Engineer role.",
                "type": "INFO",
                "related_entity_type": "Interview",
            },
            {
                "user": mike_user,
                "title": "New Application Received",
                "message": "Carlos Rivera applied for Full-Stack Engineer position.",
                "type": "INFO",
                "related_entity_type": "Application",
            },
        ]

        for nd in notifications_data:
            if not nd["user"]:
                continue
            # Check if this exact notification already exists
            existing_n = db.query(Notification).filter(
                Notification.user_id == nd["user"].id,
                Notification.title == nd["title"],
            ).first()
            if not existing_n:
                n = Notification(
                    user_id=nd["user"].id,
                    title=nd["title"],
                    message=nd["message"],
                    notification_type=nd["type"],
                    is_read=False,
                    related_entity_type=nd["related_entity_type"],
                )
                db.add(n)
                print(f"  ✔ Notification: {nd['title']}")
            else:
                print(f"  ⏭ Notification already exists: {nd['title']}")
        db.commit()

        print("\n✅  Seed completed successfully!")
        print("=" * 55)
        print("  Admin login: sarah.jenkins@hireai.enterprise / admin123")
        print("  Recruiter:   mike.chen@hireai.enterprise / recruiter123")
        print("  Interviewer: priya.sharma@hireai.enterprise / interviewer123")
        print("=" * 55)

    except Exception as exc:
        db.rollback()
        print(f"\n❌  Seed failed: {exc}")
        import traceback; traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
