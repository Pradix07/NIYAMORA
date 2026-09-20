from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.product import Product
from backend.app.models.company import Company
from backend.app.schemas.suggested_design import (
    ComparisonResultRead,
    RegressionResultRead,
    SimulationRequest,
    SimulationResponse,
    RiskMapResponse,
)
from backend.app.services.comparison_engine import ComparisonEngine
from backend.app.services.regression_engine import RegressionEngine
from backend.app.services.simulator_service import SimulatorService
from backend.app.services.risk_map_service import RiskMapService
from backend.app.api.deps import get_current_company, verify_product_ownership

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
