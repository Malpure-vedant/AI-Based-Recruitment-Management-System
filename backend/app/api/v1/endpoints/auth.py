from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import User
from app.models.recruiter import Recruiter
from app.schemas.user import UserCreate, UserResponse, UserLogin, TokenResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new platform user with encrypted credentials."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "RECRUITER",
        is_active=True
    )
    db.add(user)
    db.flush()

    if user.role in ("RECRUITER", "SUPER_ADMIN"):
        recruiter_profile = Recruiter(
            user_id=user.id,
            department=user_in.department or "Talent Acquisition",
            title=user_in.title or "Talent Acquisition Partner",
            hiring_quota=10
        )
        db.add(recruiter_profile)

    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user via JSON payload and generates a signed JWT access token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        role=user.role,
        expires_delta=access_token_expires
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_oauth2_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 standard form-compatible login endpoint for Swagger UI Authorization."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.id, role=user.role)
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Invalidates client authentication session."""
    return {"message": f"Successfully logged out user {current_user.email}"}

@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieves current authenticated user's profile and RBAC role."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates profile attributes or changes password."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.password is not None:
        current_user.hashed_password = get_password_hash(user_update.password)

    if current_user.recruiter_profile:
        if user_update.department is not None:
            current_user.recruiter_profile.department = user_update.department
        if user_update.title is not None:
            current_user.recruiter_profile.title = user_update.title

    db.commit()
    db.refresh(current_user)
    return current_user
