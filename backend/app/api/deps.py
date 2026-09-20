from typing import Optional, List
from fastapi import Header, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.inspection import Inspection
from app.core.security import decode_access_token

security_bearer = HTTPBearer(auto_error=False)

def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Returns the authenticated user if a valid Bearer token is provided, else None.
    """
    if not auth or not auth.credentials:
        return None
    
    payload = decode_access_token(auth.credentials)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """
    Enforces authentication. Requires a valid JWT bearer token.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    payload = decode_access_token(auth.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user

def require_role(allowed_roles: List[str]):
    """
    RBAC dependency factory. Ensures current user possesses one of the allowed roles.
    """
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: User role '{user.role}' is not authorized for this operation. Required: {allowed_roles}"
            )
        return user
    return role_checker

def get_current_company(
    x_company_id: Optional[str] = Header(None, alias="X-Company-ID"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
) -> Company:
    """
    Resolves the company tenancy boundary:
    1. If user is authenticated via JWT token, enforces user.company_id.
    2. If explicit X-Company-ID header is provided (e.g., test fixtures / explicit tenant switch), resolves it.
    3. Falls back to default development company if neither is supplied.
    """
    if current_user and current_user.company_id:
        # If user is authenticated, ensure they can only access their own company
        if x_company_id and x_company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Cannot access resources belonging to a different company."
            )
        company = db.query(Company).filter(Company.id == current_user.company_id).first()
        if company:
            return company

    if x_company_id:
        company = db.query(Company).filter(Company.id == x_company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail=f"Company with ID '{x_company_id}' not found.")
        return company

    # Default development company context
    company = db.query(Company).first()
    if not company:
        company = Company(name="NIYAMORA Primary Workspace")
        db.add(company)
        db.commit()
        db.refresh(company)
    return company

def verify_product_ownership(product: Product, company: Company) -> None:
    if product.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot access product belonging to another company."
        )

def verify_inspection_ownership(inspection: Inspection, company: Company, db: Session) -> None:
    product = db.query(Product).filter(Product.id == inspection.product_id).first()
    if not product or product.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot access inspection belonging to another company."
        )
