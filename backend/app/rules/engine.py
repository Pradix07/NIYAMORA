import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.compliance import RuleSource, Rule, RuleVersion, Evidence, Evaluation, Finding
from backend.app.models.inspection import Inspection
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.product import Product
from backend.app.rules.definitions import VERIFIED_RULE_SOURCES, VERIFIED_RULES_CATALOG
from backend.app.rules.evaluators.mfg_evaluator import ManufacturerAddressEvaluator
from backend.app.rules.evaluators.generic_name_evaluator import GenericNameEvaluator
from backend.app.rules.evaluators.net_quantity_evaluator import NetQuantityEvaluator
from backend.app.rules.evaluators.date_evaluator import DateDeclarationEvaluator
from backend.app.rules.evaluators.mrp_evaluator import MRPEvaluator
from backend.app.rules.evaluators.usp_evaluator import UnitSalePriceEvaluator
from backend.app.rules.evaluators.consumer_care_evaluator import ConsumerCareEvaluator
from backend.app.rules.evaluators.country_origin_evaluator import CountryOfOriginEvaluator

logger = logging.getLogger("niyamora.compliance_engine")

EVALUATOR_REGISTRY = {
    "LMPC-DECL-MFG-ADDR": ManufacturerAddressEvaluator(),
    "LMPC-DECL-COMMODITY-NAME": GenericNameEvaluator(),
    "LMPC-DECL-NET-QTY": NetQuantityEvaluator(),
    "LMPC-DECL-DATE": DateDeclarationEvaluator(),
    "LMPC-DECL-MRP": MRPEvaluator(),
    "LMPC-DECL-USP": UnitSalePriceEvaluator(),
    "LMPC-DECL-CONSUMER-CARE": ConsumerCareEvaluator(),
    "LMPC-DECL-COUNTRY-ORIGIN": CountryOfOriginEvaluator(),
}

class ComplianceEngine:
    """
    Deterministic Compliance Evaluation Engine.
    Executes versioned statutory rule checks on extracted packaging declarations.
    """

    @classmethod
    def ensure_rules_seeded(cls, db: Session) -> None:
        """Ensures all verified DCA rule sources and rule versions exist in the database."""
        # 1. Seed Rule Sources
        for src_data in VERIFIED_RULE_SOURCES:
            src = db.query(RuleSource).filter(RuleSource.id == src_data["id"]).first()
            if not src:
                src = RuleSource(**src_data)
                db.add(src)
        db.commit()

        # 2. Seed Rules & Rule Versions
        for r_entry in VERIFIED_RULES_CATALOG:
            rule = db.query(Rule).filter(Rule.id == r_entry["rule_id"]).first()
            if not rule:
                rule = Rule(
                    id=r_entry["rule_id"],
                    domain=r_entry["domain"],
                    rule_code=r_entry["rule_code"],
                    title=r_entry["title"],
                    category=r_entry["category"],
                    severity=r_entry["severity"],
                    description=r_entry["description"],
                    is_active=True
                )
                db.add(rule)
                db.commit()
                db.refresh(rule)

            ver_data = r_entry["version"]
            rv = db.query(RuleVersion).filter(RuleVersion.id == ver_data["version_id"]).first()
            if not rv:
                rv = RuleVersion(
                    id=ver_data["version_id"],
                    rule_id=rule.id,
                    rule_code=rule.rule_code,
                    version_number=ver_data["version_number"],
                    title=ver_data["title"],
                    requirement_text=ver_data["requirement_text"],
                    source_id=ver_data["source_id"],
                    source_reference=ver_data["source_reference"],
                    source_url=ver_data["source_url"],
                    effective_from=ver_data["effective_from"],
                    effective_to=ver_data["effective_to"],
                    applicability=ver_data["applicability"],
                    evaluation_type=ver_data["evaluation_type"],
                    parameters=ver_data["parameters"],
                    status="ACTIVE"
                )
                db.add(rv)
        db.commit()

    @classmethod
    def run_compliance_evaluation(
        cls,
        db: Session,
        inspection: Inspection,
        version: ArtworkVersion,
        product: Optional[Product]
    ) -> Dict[str, Any]:
        """
        Executes deterministic evaluation across all active verified rule versions for the inspection.
        Creates Evidence, Evaluation, and Finding records.
        """
        cls.ensure_rules_seeded(db)

        # Clear any prior evaluations/findings for idempotency
        db.query(Finding).filter(Finding.inspection_id == inspection.id).delete()
        db.query(Evaluation).filter(Evaluation.inspection_id == inspection.id).delete()
        db.query(Evidence).filter(Evidence.inspection_id == inspection.id).delete()
        db.commit()

        extracted_data = inspection.extracted_data or {}
        extracted_fields = extracted_data.get("fields", {})
        raw_text = extracted_data.get("raw_text", "")
        blocks = extracted_data.get("blocks", [])

        product_context = {
            "name": product.name if product else "",
            "brand": product.brand if product else "",
            "category": product.category if product else "",
            "packaging_type": product.packaging_type if product else "",
            "net_quantity": product.net_quantity if product else "",
            "description": product.description if product else "",
            "is_imported": False
        }

        # Query all active rule versions
        rule_versions = db.query(RuleVersion).filter(RuleVersion.status == "ACTIVE").all()

        pass_count = 0
        issue_count = 0
        review_count = 0
        na_count = 0

        evaluations_list = []

        for rv in rule_versions:
            evaluator = EVALUATOR_REGISTRY.get(rv.rule_code)
            if not evaluator:
                logger.warning(f"No evaluator registered for rule_code {rv.rule_code}")
                continue

            status, obs_val, exp_cond, explanation, evidence_info, action = evaluator.evaluate(
                rule_version=rv,
                extracted_fields=extracted_fields,
                raw_text=raw_text,
                blocks=blocks,
                product_context=product_context
            )

            # 1. Create Evidence record if evidence data is present
            evidence_rec = None
            if evidence_info:
                evidence_rec = Evidence(
                    inspection_id=inspection.id,
                    source_type=evidence_info.get("source_type", "OCR"),
                    panel_id=version.panels[0].id if version.panels else None,
                    page_number=1,
                    bbox=evidence_info.get("bbox"),
                    observed_text=evidence_info.get("observed_text"),
                    extracted_value=evidence_info.get("extracted_value"),
                    evidence_quality=evidence_info.get("evidence_quality", "HIGH")
                )
                db.add(evidence_rec)
                db.commit()
                db.refresh(evidence_rec)

            # 2. Create Evaluation record
            eval_rec = Evaluation(
                inspection_id=inspection.id,
                rule_version_id=rv.id,
                status=status,
                observed_value=obs_val,
                expected_condition=exp_cond,
                explanation=explanation,
                evidence_id=evidence_rec.id if evidence_rec else None
            )
            db.add(eval_rec)
            db.commit()
            db.refresh(eval_rec)

            # 3. Create Finding record if ISSUE or REVIEW
            if status in ["ISSUE", "REVIEW"]:
                finding_rec = Finding(
                    inspection_id=inspection.id,
                    evaluation_id=eval_rec.id,
                    rule_code=rv.rule_code,
                    severity="CRITICAL" if status == "ISSUE" else "REVIEW",
                    status="OPEN",
                    title=f"{rv.title} ({status})",
                    summary=explanation,
                    observed_value=obs_val or "Not Detected",
                    requirement=rv.requirement_text,
                    suggested_action=action or "Verify compliance on the packaging artwork dieline.",
                    evidence_id=evidence_rec.id if evidence_rec else None
                )
                db.add(finding_rec)
                db.commit()

            # Tally counts
            if status == "PASS":
                pass_count += 1
            elif status == "ISSUE":
                issue_count += 1
            elif status == "REVIEW":
                review_count += 1
            elif status == "N/A":
                na_count += 1

            evaluations_list.append({
                "evaluation_id": eval_rec.id,
                "rule_code": rv.rule_code,
                "rule_title": rv.title,
                "status": status,
                "source_reference": rv.source_reference,
                "observed_value": obs_val,
                "explanation": explanation
            })

        # Deterministic Aggregate Verdict Policy:
        # If any applicable rule is ISSUE -> ISSUE
        # Else if any applicable rule is REVIEW -> REVIEW
        # Else if all applicable rules are PASS -> PASS
        # Else -> N/A
        if issue_count > 0:
            overall_verdict = "ISSUE"
        elif review_count > 0:
            overall_verdict = "REVIEW"
        elif pass_count > 0:
            overall_verdict = "PASS"
        else:
            overall_verdict = "N/A"

        evaluable_rules = pass_count + issue_count + review_count
        compliance_score = round((pass_count / max(1, evaluable_rules)) * 100.0, 1)

        findings_summary = {
            "total_rules": len(rule_versions),
            "evaluable_rules": evaluable_rules,
            "pass_count": pass_count,
            "issue_count": issue_count,
            "review_count": review_count,
            "na_count": na_count,
            "verdict": overall_verdict,
            "score": compliance_score,
            "disclaimer": "Statutory pre-print compliance check under verified Legal Metrology (Packaged Commodities) Rules, 2011. Not a substitute for official government certification."
        }

        # Update inspection record
        inspection.compliance_verdict = overall_verdict
        inspection.compliance_score = compliance_score
        inspection.findings_summary = findings_summary
        db.commit()
        db.refresh(inspection)

        return findings_summary
