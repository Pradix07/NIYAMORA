from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.compliance import Rule, RuleVersion, RuleSource
from app.schemas.compliance import RuleRead, RuleVersionRead, RuleSourceRead
from app.rules.engine import ComplianceEngine

router = APIRouter(prefix="/rules", tags=["Statutory Rule Library"])

@router.get("", response_model=List[RuleRead])
def list_rules(
    category: Optional[str] = None,
    domain: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns verified statutory rules from the Legal Metrology and packaging standards catalog.
    """
    ComplianceEngine.ensure_rules_seeded(db)

    query = db.query(Rule).filter(Rule.is_active == True)
    if category and category != "ALL":
        query = query.filter(Rule.category.ilike(f"%{category}%"))
    if domain:
        query = query.filter(Rule.domain == domain)
    if search:
        query = query.filter(
            (Rule.title.ilike(f"%{search}%")) |
            (Rule.rule_code.ilike(f"%{search}%")) |
            (Rule.description.ilike(f"%{search}%"))
        )

    rules = query.order_by(Rule.rule_code.asc()).all()
    return rules

@router.get("/sources", response_model=List[RuleSourceRead])
def list_rule_sources(db: Session = Depends(get_db)):
    """
    Returns official Department of Consumer Affairs (DCA) and gazette source documents.
    """
    ComplianceEngine.ensure_rules_seeded(db)
    sources = db.query(RuleSource).order_by(RuleSource.publication_date.asc()).all()
    return sources

@router.get("/{rule_id_or_code}", response_model=RuleRead)
def get_rule(rule_id_or_code: str, db: Session = Depends(get_db)):
    ComplianceEngine.ensure_rules_seeded(db)
    rule = db.query(Rule).filter(
        (Rule.id == rule_id_or_code) | (Rule.rule_code == rule_id_or_code)
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Statutory rule not found.")
    return rule
