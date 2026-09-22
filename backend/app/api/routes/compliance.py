from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.inspection import Inspection
from app.models.compliance import Evaluation, Finding, Evidence, HumanReview, RuleVersion
from app.models.company import Company
from app.schemas.compliance import (
    EvaluationRead,
    FindingRead,
    EvidenceRead,
    HumanReviewCreate,
    HumanReviewRead
)
from app.api.deps import get_current_company, verify_inspection_ownership

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

    # If finding is referenced, update its status and associated evaluation
    norm_decision = payload.decision.upper()
    if payload.finding_id:
        finding = db.query(Finding).filter(Finding.id == payload.finding_id).first()
        if finding:
            evaluation = db.query(Evaluation).filter(Evaluation.id == finding.evaluation_id).first() if finding.evaluation_id else None
            if not evaluation:
                evaluation = (
                    db.query(Evaluation)
                    .join(RuleVersion, Evaluation.rule_version_id == RuleVersion.id)
                    .filter(Evaluation.inspection_id == payload.inspection_id, RuleVersion.rule_code == finding.rule_code)
                    .first()
                )

            if norm_decision in ("APPROVED_PASS", "CONFIRM_PASS", "PASS"):
                finding.status = "RESOLVED"
                if evaluation:
                    evaluation.status = "PASS"
                    evaluation.explanation = f"Specialist confirmation: {payload.notes or 'Manually verified as compliant.'}"
            elif norm_decision in ("CONFIRMED_ISSUE", "MARK_AS_ISSUE", "ISSUE"):
                finding.status = "OPEN"
                if evaluation:
                    evaluation.status = "ISSUE"
                    evaluation.explanation = f"Specialist confirmation: {payload.notes or 'Identified non-compliance.'}"
            elif norm_decision in ("NEW_IMAGE_REQUESTED", "REQUEST_CLEARER_IMAGE"):
                finding.status = "IMAGE_REQUESTED"
                if evaluation:
                    evaluation.status = "REVIEW"
            else:
                finding.status = "REVIEWED"

    # Dynamically recalculate inspection summary counts & compliance score
    evals = db.query(Evaluation).filter(Evaluation.inspection_id == payload.inspection_id).all()
    pass_cnt = sum(1 for e in evals if e.status == "PASS")
    issue_cnt = sum(1 for e in evals if e.status == "ISSUE")
    review_cnt = sum(1 for e in evals if e.status == "REVIEW")
    na_cnt = sum(1 for e in evals if e.status == "N/A")
    total_cnt = len(evals)

    inspection.findings_summary = {
        "total": total_cnt,
        "pass_count": pass_cnt,
        "issue_count": issue_cnt,
        "review_count": review_cnt,
        "na_count": na_cnt
    }
    inspection.compliance_score = round((pass_cnt / total_cnt * 100), 1) if total_cnt > 0 else 0.0
    inspection.compliance_verdict = (
        "NON_COMPLIANT" if issue_cnt > 0
        else ("NEEDS_REVIEW" if review_cnt > 0 else "COMPLIANT")
    )

    db.commit()
    db.refresh(inspection)
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
