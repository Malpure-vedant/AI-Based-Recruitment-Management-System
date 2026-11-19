from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, role_required
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobListResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Creates a new job opening with custom AI scoring weightings."""
    weights = job_in.scoring_weights.model_dump() if job_in.scoring_weights else {
        "skills": 0.40,
        "experience": 0.35,
        "education": 0.15,
        "domain": 0.10
    }

    job = Job(
        title=job_in.title,
        department=job_in.department,
        location=job_in.location or "Remote",
        job_type=job_in.job_type or "Full-time",
        experience_level=job_in.experience_level or "Senior",
        salary_range=job_in.salary_range or "$120,000 - $160,000",
        openings=job_in.openings or 1,
        status=job_in.status or "OPEN",
        description=job_in.description,
        responsibilities=job_in.responsibilities or [],
        required_skills=job_in.required_skills or [],
        preferred_skills=job_in.preferred_skills or [],
        scoring_weights=weights,
        created_by_id=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    resp = JobResponse.model_validate(job)
    resp.applicants_count = len(job.applications)
    return resp

@router.get("/", response_model=JobListResponse)
def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status (OPEN, PAUSED, CLOSED)"),
    search: Optional[str] = Query(None, description="Search by title"),
    db: Session = Depends(get_db)
):
    """Lists jobs with pagination and status/department filters."""
    query = db.query(Job)

    if department:
        query = query.filter(Job.department == department)
    if status:
        query = query.filter(Job.status == status)
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))

    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for j in jobs:
        resp = JobResponse.model_validate(j)
        resp.applicants_count = len(j.applications)
        items.append(resp)

    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    """Fetches details for a single job opening."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition {job_id} not found."
        )
    resp = JobResponse.model_validate(job)
    resp.applicants_count = len(job.applications)
    return resp

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: str,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Updates job specifications or transitions status (e.g. PAUSED or CLOSED)."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition {job_id} not found."
        )

    update_data = job_in.model_dump(exclude_unset=True)
    if "scoring_weights" in update_data and update_data["scoring_weights"]:
        update_data["scoring_weights"] = update_data["scoring_weights"]

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    resp = JobResponse.model_validate(job)
    resp.applicants_count = len(job.applications)
    return resp

@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN"]))
):
    """Deletes a job requisition."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job requisition {job_id} not found."
        )

    db.delete(job)
    db.commit()
    return {"message": f"Job {job_id} successfully deleted."}
