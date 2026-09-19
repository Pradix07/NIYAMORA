from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.inspection import Inspection
from backend.app.models.compliance import Evaluation, Finding, Evidence, HumanReview, RuleVersion
from backend.app.models.company import Company
from backend.app.schemas.compliance import (
    EvaluationRead,
    FindingRead,
    EvidenceRead,
    HumanReviewCreate,
    HumanReviewRead
)
from backend.app.api.deps import get_current_company, verify_inspection_ownership

router = APIRouter(tags=["Compliance Evaluations & Review"])

@router.get("/inspections/{inspection_id}/evaluations", response_model=List[EvaluationRead])
def get_inspection_evaluations(
    inspection_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Returns deterministic compliance evaluations for a given inspection run.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    verify_inspection_ownership(inspection, company, db)

    evaluations = db.query(Evaluation).filter(Evaluation.inspection_id == inspection_id).all()
    results = []
    for ev in evaluations:
        rv = db.query(RuleVersion).filter(RuleVersion.id == ev.rule_version_id).first()
        results.append(EvaluationRead(
            id=ev.id,
            inspection_id=ev.inspection_id,
            rule_version_id=ev.rule_version_id,
            rule_code=rv.rule_code if rv else "LMPC-RULE",
            rule_title=rv.title if rv else "Statutory Rule",
            source_reference=rv.source_reference if rv else "",
            source_url=rv.source_url if rv else "",
            status=ev.status,
            observed_value=ev.observed_value,
            expected_condition=ev.expected_condition,
            explanation=ev.explanation,
            evidence_id=ev.evidence_id,
            evidence=ev.evidence,
            evaluated_at=ev.evaluated_at
        ))
    return results

@router.get("/inspections/{inspection_id}/findings", response_model=List[FindingRead])
def get_inspection_findings(
    inspection_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Returns actionable finding items (ISSUE or REVIEW) for an inspection.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    verify_inspection_ownership(inspection, company, db)

    findings = db.query(Finding).filter(Finding.inspection_id == inspection_id).all()
    return findings

@router.get("/inspections/{inspection_id}/evidence", response_model=List[EvidenceRead])
def get_inspection_evidence(
    inspection_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Returns spatial and extracted evidence records for an inspection.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    verify_inspection_ownership(inspection, company, db)

    evidences = db.query(Evidence).filter(Evidence.inspection_id == inspection_id).all()
    return evidences

@router.post("/reviews", response_model=HumanReviewRead, status_code=201)
def submit_human_review(
    payload: HumanReviewCreate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Records a human specialist review decision without mutating the underlying machine evaluation record.
    """
    inspection = db.query(Inspection).filter(Inspection.id == payload.inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    verify_inspection_ownership(inspection, company, db)

    review = HumanReview(
        inspection_id=payload.inspection_id,
        finding_id=payload.finding_id,
        reviewer_name=payload.reviewer_name,
        decision=payload.decision,
        notes=payload.notes
    )
    db.add(review)

    # If finding is referenced, update its status
    if payload.finding_id:
        finding = db.query(Finding).filter(Finding.id == payload.finding_id).first()
        if finding:
            finding.status = "REVIEWED"

    db.commit()
    db.refresh(review)
    return review

@router.get("/reviews", response_model=List[HumanReviewRead])
def list_human_reviews(
    inspection_id: Optional[str] = None,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    query = db.query(HumanReview).join(Inspection).filter(Inspection.product.has(company_id=company.id))
    if inspection_id:
        query = query.filter(HumanReview.inspection_id == inspection_id)
    reviews = query.order_by(HumanReview.created_at.desc()).all()
    return reviews
