from typing import Optional
from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.company import Company
from backend.app.models.product import Product
from backend.app.models.inspection import Inspection

def get_current_company(
    x_company_id: Optional[str] = Header(None, alias="X-Company-ID"),
    db: Session = Depends(get_db)
) -> Company:
    """
    Resolves the company tenancy boundary from the X-Company-ID header.
    Falls back to the default workspace company if no header is supplied in development.
    """
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
            status_code=403,
            detail="Forbidden: Cannot access product belonging to another company."
        )

def verify_inspection_ownership(inspection: Inspection, company: Company, db: Session) -> None:
    product = db.query(Product).filter(Product.id == inspection.product_id).first()
    if not product or product.company_id != company.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cannot access inspection belonging to another company."
        )
