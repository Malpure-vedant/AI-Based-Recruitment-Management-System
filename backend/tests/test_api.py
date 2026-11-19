import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app, seed_initial_data
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def test_full_api_workflow():
    print("\n--- Starting Full API Verification ---")
    
    # 1. Health Checks
    res = client.get("/")
    assert res.status_code == 200
    print("✓ Health root endpoint: OK")

    res = client.get("/health")
    assert res.status_code == 200
    print("✓ Health check endpoint: OK")

    # 2. Authentication: Login with seeded admin
    login_payload = {
        "email": "sarah.jenkins@hireai.enterprise",
        "password": "admin123"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Auth login & JWT generation: OK")

    # 3. User Profile (/auth/me)
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "sarah.jenkins@hireai.enterprise"
    print("✓ Auth /me profile: OK")

    # 4. Job Requisition CRUD
    job_payload = {
        "title": "Lead Cloud DevOps Architect",
        "department": "Infrastructure & SRE",
        "location": "Austin, TX (Remote)",
        "job_type": "Full-time",
        "experience_level": "Lead",
        "salary_range": "$175,000 - $220,000",
        "openings": 2,
        "description": "Lead multi-region Kubernetes scaling and automated CI/CD security.",
        "required_skills": ["Kubernetes", "Terraform", "AWS", "Docker", "Python"],
        "preferred_skills": ["Go", "Helm"],
        "scoring_weights": {
            "skills": 0.45,
            "experience": 0.35,
            "education": 0.10,
            "domain": 0.10
        }
    }
    res = client.post("/api/v1/jobs/", json=job_payload, headers=headers)
    assert res.status_code == 201, f"Job creation failed: {res.text}"
    job_id = res.json()["id"]
    print(f"✓ Job created (ID: {job_id}): OK")

    res = client.get("/api/v1/jobs/")
    assert res.status_code == 200
    assert res.json()["total"] >= 1
    print("✓ List jobs with pagination: OK")

    # 5. Candidate CRUD & Search
    cand_payload = {
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": f"marcus.vance.{job_id[:4]}@example.com",
        "phone": "+1 (555) 234-5678",
        "location": "New York, NY",
        "headline": "Staff Cloud Systems Architect",
        "total_experience_years": 8.5,
        "highest_education": "M.S. in Computer Engineering",
        "skills": ["Kubernetes", "AWS", "Terraform", "Python", "Docker"]
    }
    res = client.post("/api/v1/candidates/", json=cand_payload, headers=headers)
    assert res.status_code == 201, f"Candidate creation failed: {res.text}"
    candidate_id = res.json()["id"]
    print(f"✓ Candidate created (ID: {candidate_id}): OK")

    # Search candidates
    res = client.get("/api/v1/candidates/search?q=Marcus", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["items"]) >= 1
    print("✓ Candidate search: OK")

    # 6. Application Submission & AI Scoring
    apply_payload = {
        "job_id": job_id,
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": cand_payload["email"],
        "phone": cand_payload["phone"],
        "resume_file_name": "Marcus_Vance_Resume.pdf"
    }
    res = client.post("/api/v1/applications/apply", json=apply_payload)
    assert res.status_code == 201, f"Application submission failed: {res.text}"
    app_id = res.json()["id"]
    score = res.json()["overall_match_score"]
    print(f"✓ Application submitted (ID: {app_id}, AI Match Score: {score}%): OK")

    # Update Application Status (advance stage)
    res = client.patch(
        f"/api/v1/applications/{app_id}/status",
        json={"status": "SHORTLISTED", "remarks": "Top tier score"},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "SHORTLISTED"
    print("✓ Application stage advanced to SHORTLISTED: OK")

    # 7. Interview Scheduling & Feedback
    interview_payload = {
        "application_id": app_id,
        "interviewer_name": "Sarah Jenkins",
        "interview_round": "Technical Round 1",
        "scheduled_at": "2026-11-25T14:00:00Z",
        "duration_minutes": 60,
        "meeting_link": "https://meet.google.com/test-room"
    }
    res = client.post("/api/v1/interviews/", json=interview_payload, headers=headers)
    assert res.status_code == 201, f"Interview schedule failed: {res.text}"
    interview_id = res.json()["id"]
    print(f"✓ Interview scheduled (ID: {interview_id}): OK")

    # Store Interview Feedback
    feedback_payload = {
        "rating": 5,
        "feedback": "Outstanding architectural depth, solved the distributed consensus question cleanly.",
        "criteria_ratings": {
            "technicalCompetence": 5,
            "problemSolving": 5,
            "communication": 5
        }
    }
    res = client.post(f"/api/v1/interviews/{interview_id}/feedback", json=feedback_payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "COMPLETED"
    assert res.json()["rating"] == 5
    print("✓ Interview scorecard & rating stored: OK")

    # 8. PyMuPDF Layout Parsing Test
    import fitz
    test_pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_resume.pdf")
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (50, 72),
        "John Doe\nEmail: john.doe@cloudtech.dev\nPhone: (555) 123-4567\nSkills: Python, FastAPI, Docker, Kubernetes, PostgreSQL"
    )
    doc.save(test_pdf_path)
    doc.close()

    with open(test_pdf_path, "rb") as f:
        res = client.post("/api/v1/resumes/extract-text", files={"file": ("sample_resume.pdf", f, "application/pdf")})
    assert res.status_code == 200, f"Extract text failed: {res.text}"
    extracted = res.json()
    assert extracted["detected_email"] == "john.doe@cloudtech.dev"
    assert "FastAPI" in extracted["detected_skills"]
    assert "Docker" in extracted["detected_skills"]
    print("✓ PyMuPDF resume layout parsing & entity extraction: OK")

    # Clean up test artifact
    if os.path.exists(test_pdf_path):
        os.remove(test_pdf_path)

    print("\n--- ALL BACKEND TEST SUITES PASSED CLEANLY! ---")

if __name__ == "__main__":
    test_full_api_workflow()
