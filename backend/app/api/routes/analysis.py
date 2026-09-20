from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.product import Product
from app.models.company import Company
from app.schemas.suggested_design import (
    ComparisonResultRead,
    RegressionResultRead,
    SimulationRequest,
    SimulationResponse,
    RiskMapResponse,
)
from app.services.comparison_engine import ComparisonEngine
from app.services.regression_engine import RegressionEngine
from app.services.simulator_service import SimulatorService
from app.services.risk_map_service import RiskMapService
from app.api.deps import get_current_company, verify_product_ownership

router = APIRouter(tags=["Compliance Diff, Regression & Simulation"])

@router.get("/products/{product_id}/compare", response_model=ComparisonResultRead)
def compare_product_versions(
    product_id: str,
    version_a_id: Optional[str] = Query(None, description="Baseline version ID (e.g. V01)"),
    version_b_id: Optional[str] = Query(None, description="Compared version ID (e.g. V02)"),
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Compliance-Aware Design Diff: compares statutory compliance evaluations
    and visual differences between two artwork versions.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    verify_product_ownership(product, company)

    try:
        return ComparisonEngine.compare_artwork_versions(
            db=db,
            product_id=product_id,
            version_a_id=version_a_id,
            version_b_id=version_b_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Comparison failed: {str(e)}")

@router.get("/products/{product_id}/regression", response_model=RegressionResultRead)
def get_compliance_regression(
    product_id: str,
    version_a_id: Optional[str] = Query(None, description="Baseline version ID"),
    version_b_id: Optional[str] = Query(None, description="Compared version ID"),
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Compliance Regression Engine: detects whether pre-press dieline modifications
    fixed prior issues or accidentally introduced new statutory violations.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    verify_product_ownership(product, company)

    try:
        return RegressionEngine.analyze_regression(
            db=db,
            product_id=product_id,
            version_a_id=version_a_id,
            version_b_id=version_b_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Regression analysis failed: {str(e)}")

@router.post("/products/{product_id}/simulate", response_model=SimulationResponse)
def simulate_compliance_rule(
    product_id: str,
    payload: SimulationRequest,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    What-If Packaging Rule Simulator: evaluates hypothetical parameter values
    deterministically without mutating product records or artwork files.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    verify_product_ownership(product, company)

    try:
        return SimulatorService.simulate(
            db=db,
            product_id=product_id,
            request=payload
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")

@router.get("/products/{product_id}/risk-map", response_model=RiskMapResponse)
def get_design_risk_map(
    product_id: str,
    inspection_id: Optional[str] = Query(None, description="Target inspection ID"),
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Design Risk Map: spatial concentration of compliance risk across packaging dielines
    derived strictly from actual findings and evidence bounding boxes.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    verify_product_ownership(product, company)

    try:
        return RiskMapService.generate_risk_map(
            db=db,
            product_id=product_id,
            inspection_id=inspection_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Risk map generation failed: {str(e)}")

@router.get("/products/{product_id}/passport")
def get_product_label_passport(
    product_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Label Passport: aggregates complete immutable provenance, artwork versions,
    inspection evaluations, human reviews, and audit events for a product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    verify_product_ownership(product, company)

    # 1. Versions
    from app.models.artwork import Artwork
    from app.models.artwork_version import ArtworkVersion
    from app.models.inspection import Inspection
    from app.models.compliance import Evaluation, Finding, HumanReview
    from app.models.suggested_design import AuditEvent

    artworks = db.query(Artwork).filter(Artwork.product_id == product_id).all()
    artwork_ids = [a.id for a in artworks]

    versions = db.query(ArtworkVersion).filter(ArtworkVersion.artwork_id.in_(artwork_ids)).order_by(ArtworkVersion.version_number.asc()).all() if artwork_ids else []
    version_items = [
        {
            "version_id": v.id,
            "version_number": v.version_number,
            "version_label": v.version_label or f"V{v.version_number:02d}",
            "file_path": v.file_path,
            "original_filename": v.original_filename,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "processing_status": v.processing_status or "READY"
        }
        for v in versions
    ]

    # 2. Inspections
    inspections = db.query(Inspection).filter(Inspection.product_id == product_id).order_by(Inspection.created_at.desc()).all()
    inspection_items = []
    inspection_ids = [i.id for i in inspections]

    for insp in inspections:
        evals = db.query(Evaluation).filter(Evaluation.inspection_id == insp.id).all()
        p_cnt = sum(1 for e in evals if e.status == "PASS")
        i_cnt = sum(1 for e in evals if e.status == "ISSUE")
        r_cnt = sum(1 for e in evals if e.status == "REVIEW")
        na_cnt = sum(1 for e in evals if e.status == "N/A")
        inspection_items.append({
            "inspection_id": insp.id,
            "version_label": insp.artwork_version.version_label if insp.artwork_version else "V01",
            "status": insp.status,
            "created_at": insp.created_at.isoformat() if insp.created_at else None,
            "completed_at": insp.completed_at.isoformat() if insp.completed_at else None,
            "pass_count": p_cnt,
            "issue_count": i_cnt,
            "review_count": r_cnt,
            "na_count": na_cnt
        })

    # 3. Human Reviews
    reviews = db.query(HumanReview).filter(HumanReview.inspection_id.in_(inspection_ids)).order_by(HumanReview.created_at.desc()).all() if inspection_ids else []
    review_items = [
        {
            "id": r.id,
            "inspection_id": r.inspection_id,
            "finding_id": r.finding_id,
            "reviewer_name": r.reviewer_name,
            "decision": r.decision,
            "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reviews
    ]

    # 4. Audit Events
    audit_filter_ids = [product_id] + artwork_ids + inspection_ids
    audit_events = db.query(AuditEvent).filter(
        AuditEvent.entity_id.in_(audit_filter_ids)
    ).order_by(AuditEvent.created_at.desc()).limit(50).all() if audit_filter_ids else []

    audit_items = [
        {
            "id": a.id,
            "action": a.action,
            "user_id": a.user_id,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "details": a.details,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in audit_events
    ]

    return {
        "product_id": product.id,
        "product_name": product.name,
        "brand": product.brand,
        "sku": product.sku,
        "category": product.category,
        "packaging_type": product.packaging_type,
        "net_quantity": product.net_quantity,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "versions": version_items,
        "inspections": inspection_items,
        "human_reviews": review_items,
        "audit_events": audit_items,
        "disclaimer": "Label Passport is a NIYAMORA internal provenance ledger and product history record. It is not a government certificate or official legal approval."
    }

