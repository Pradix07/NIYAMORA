import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.company import Company
from backend.app.models.suggested_design import AuditEvent
from backend.app.schemas.auth import UserSignup, UserLogin, UserResponse, TokenResponse
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & User Access"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    """
    Registers a new company and user account with secure password hashing and returns JWT token.
    """
    # Check if user with email already exists
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Find or create company
    company = db.query(Company).filter(Company.name == payload.company_name.strip()).first()
    if not company:
        company = Company(
            id=str(uuid.uuid4()),
            name=payload.company_name.strip()
        )
        db.add(company)
        db.flush()

    # Create new user
    allowed_roles = ["COMPANY_USER", "REVIEWER", "INSPECTOR", "ADMIN"]
    user_role = payload.role if payload.role in allowed_roles else "COMPANY_USER"

    user = User(
        id=str(uuid.uuid4()),
        company_id=company.id,
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        role=user_role,
        password_hash=hash_password(payload.password)
    )
    db.add(user)

    # Log audit event
    audit = AuditEvent(
        id=str(uuid.uuid4()),
        company_id=company.id,
        user_id=user.id,
        action="AUTH_SIGNUP",
        entity_type="USER",
        entity_id=user.id,
        details={"email": user.email, "company": company.name, "role": user.role}
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    # Generate JWT access token
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "company_id": company.id, "role": user.role})

    user_resp = UserResponse(
        id=user.id,
        company_id=user.company_id,
        company_name=company.name,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates user with email and password, returning JWT access token.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        # Record failed login attempt audit event if user exists
        if user:
            audit = AuditEvent(
                id=str(uuid.uuid4()),
                company_id=user.company_id,
                user_id=user.id,
                action="AUTH_LOGIN_FAILED",
                entity_type="USER",
                entity_id=user.id,
                details={"email": payload.email, "reason": "Invalid password"}
            )
            db.add(audit)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    company = db.query(Company).filter(Company.id == user.company_id).first()
    company_name = company.name if company else "Company"

    # Log successful login
    audit = AuditEvent(
        id=str(uuid.uuid4()),
        company_id=user.company_id,
        user_id=user.id,
        action="AUTH_LOGIN_SUCCESS",
        entity_type="USER",
        entity_id=user.id,
        details={"email": user.email, "company": company_name}
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": user.id, "email": user.email, "company_id": user.company_id, "role": user.role})

    user_resp = UserResponse(
        id=user.id,
        company_id=user.company_id,
        company_name=company_name,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns current authenticated user and company context.
    """
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    return UserResponse(
        id=current_user.id,
        company_id=current_user.company_id,
        company_name=company.name if company else "Company",
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Logs out user session and records audit trail.
    """
    audit = AuditEvent(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="AUTH_LOGOUT",
        entity_type="USER",
        entity_id=current_user.id,
        details={"email": current_user.email}
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out."}
