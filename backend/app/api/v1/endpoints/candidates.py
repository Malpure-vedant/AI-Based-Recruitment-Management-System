from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_user, role_required
from app.models.candidate import Candidate
from app.models.candidate_skill import CandidateSkill
from app.models.user import User
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateResponse, CandidateListResponse

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    candidate_in: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new candidate record."""
    existing = db.query(Candidate).filter(Candidate.email == candidate_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate with email {candidate_in.email} already exists."
        )

    full_name = f"{candidate_in.first_name} {candidate_in.last_name}".strip()
    candidate = Candidate(
        full_name=full_name,
        email=candidate_in.email,
        phone=candidate_in.phone,
        location=candidate_in.location,
        current_title=candidate_in.headline,
        linkedin_url=candidate_in.linkedin_url,
        github_url=candidate_in.github_url,
        portfolio_url=candidate_in.portfolio_url,
        experience_years=candidate_in.total_experience_years or 0.0,
        education_level=candidate_in.highest_education,
        avatar_url=candidate_in.avatar_url
    )
    if candidate_in.skills:
        for sk in candidate_in.skills:
            candidate.skills.append(CandidateSkill(skill_name=sk))

    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate

@router.get("/", response_model=CandidateListResponse)
def get_candidates(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    location: Optional[str] = Query(None, description="Filter by location"),
    min_experience: Optional[float] = Query(None, description="Filter by minimum experience years"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves candidates with pagination and criteria filtering."""
    query = db.query(Candidate)

    if location:
        query = query.filter(Candidate.location.ilike(f"%{location}%"))
    if min_experience is not None:
        query = query.filter(Candidate.experience_years >= min_experience)

    total = query.count()
    items = query.order_by(Candidate.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/search", response_model=CandidateListResponse)
def search_candidates(
    q: str = Query(..., min_length=1, description="Search term matching name, email, or headline"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Searches candidates across name, email, and headline."""
    term = f"%{q}%"
    query = db.query(Candidate).filter(
        or_(
            Candidate.full_name.ilike(term),
            Candidate.email.ilike(term),
            Candidate.current_title.ilike(term),
            Candidate.location.ilike(term)
        )
    )
    total = query.count()
    items = query.order_by(Candidate.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches details for a single candidate by ID."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found."
        )
    return candidate

@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: str,
    candidate_in: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Updates candidate profile details."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found."
        )

    update_data = candidate_in.model_dump(exclude_unset=True)
    if "first_name" in update_data or "last_name" in update_data:
        first = update_data.get("first_name", candidate.first_name)
        last = update_data.get("last_name", candidate.last_name)
        candidate.full_name = f"{first} {last}".strip()
    if "headline" in update_data:
        candidate.current_title = update_data["headline"]
    if "total_experience_years" in update_data:
        candidate.experience_years = update_data["total_experience_years"] or 0.0
    if "highest_education" in update_data:
        candidate.education_level = update_data["highest_education"]

    for field in ("email", "phone", "location", "linkedin_url", "github_url", "portfolio_url", "avatar_url"):
        if field in update_data:
            setattr(candidate, field, update_data[field])

    db.commit()
    db.refresh(candidate)
    return candidate

@router.delete("/{candidate_id}", status_code=status.HTTP_200_OK)
def delete_candidate(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["SUPER_ADMIN", "RECRUITER"]))
):
    """Deletes a candidate and associated application records."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found."
        )

    db.delete(candidate)
    db.commit()
    return {"message": f"Candidate {candidate_id} successfully deleted."}
