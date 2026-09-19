from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.inspection import Inspection
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.product import Product
from backend.app.models.company import Company
from backend.app.schemas.inspection import InspectionRead, InspectionCreate
from backend.app.services.pipeline import InspectionPipelineService
from backend.app.api.deps import get_current_company, verify_product_ownership, verify_inspection_ownership

from typing import List, Optional

router = APIRouter(prefix="/inspections", tags=["Inspections"])

@router.get("")
def list_inspections(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    inspections = (
        db.query(Inspection)
        .join(Product)
        .filter(Product.company_id == company.id)
        .order_by(Inspection.created_at.desc())
        .limit(20)
        .all()
    )
    results = []
    for insp in inspections:
        version = db.query(ArtworkVersion).filter(ArtworkVersion.id == insp.artwork_version_id).first()
        product = db.query(Product).filter(Product.id == insp.product_id).first()
        results.append({
            "id": insp.id,
            "product_id": insp.product_id,
            "product_name": product.name if product else "Packaging Artwork",
            "brand": product.brand if product else "",
            "artwork_version_id": insp.artwork_version_id,
            "version_label": version.version_label if version else "V01",
            "original_filename": version.original_filename if version else "",
            "status": insp.status,
            "current_stage": insp.current_stage,
            "quality_verdict": insp.quality_verdict,
            "quality_score": insp.quality_score,
            "quality_details": insp.quality_details,
            "extracted_data": insp.extracted_data,
            "compliance_verdict": insp.compliance_verdict,
            "compliance_score": insp.compliance_score,
            "findings_summary": insp.findings_summary,
            "preview_url": f"/api/files/preview/{version.id}" if version else None,
            "error_message": insp.error_message,
            "created_at": insp.created_at,
            "completed_at": insp.completed_at
        })
    return results

@router.post("", response_model=InspectionRead, status_code=201)
def trigger_inspection(
    payload: InspectionCreate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    verify_product_ownership(product, company)

    version = db.query(ArtworkVersion).filter(ArtworkVersion.id == payload.artwork_version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Artwork version not found.")

    inspection = Inspection(
        product_id=payload.product_id,
        artwork_version_id=payload.artwork_version_id,
        status="QUEUED",
        current_stage="INITIALIZING"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    InspectionPipelineService.execute_inspection(db, inspection.id)
    db.refresh(inspection)
    return inspection

@router.get("/{inspection_id}")
def get_inspection(
    inspection_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    verify_inspection_ownership(inspection, company, db)

    version = db.query(ArtworkVersion).filter(ArtworkVersion.id == inspection.artwork_version_id).first()
    product = db.query(Product).filter(Product.id == inspection.product_id).first()

    return {
        "id": inspection.id,
        "product_id": inspection.product_id,
        "product_name": product.name if product else "Packaging Artwork",
        "brand": product.brand if product else "",
        "artwork_version_id": inspection.artwork_version_id,
        "version_label": version.version_label if version else "V01",
        "original_filename": version.original_filename if version else "",
        "status": inspection.status,
        "current_stage": inspection.current_stage,
        "quality_verdict": inspection.quality_verdict,
        "quality_score": inspection.quality_score,
        "quality_details": inspection.quality_details,
        "extracted_data": inspection.extracted_data,
        "compliance_verdict": inspection.compliance_verdict,
        "compliance_score": inspection.compliance_score,
        "findings_summary": inspection.findings_summary,
        "preview_url": f"/api/files/preview/{version.id}" if version else None,
        "error_message": inspection.error_message,
        "created_at": inspection.created_at,
        "completed_at": inspection.completed_at
    }
