import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.compliance import RuleSource, Rule, RuleVersion, Evidence, Evaluation, Finding
from app.models.inspection import Inspection
from app.models.artwork_version import ArtworkVersion
from app.models.product import Product
from app.rules.definitions import VERIFIED_RULE_SOURCES, VERIFIED_RULES_CATALOG
from app.rules.evaluators.mfg_evaluator import ManufacturerAddressEvaluator
from app.rules.evaluators.generic_name_evaluator import GenericNameEvaluator
from app.rules.evaluators.net_quantity_evaluator import NetQuantityEvaluator
from app.rules.evaluators.date_evaluator import DateDeclarationEvaluator
from app.rules.evaluators.mrp_evaluator import MRPEvaluator
from app.rules.evaluators.usp_evaluator import UnitSalePriceEvaluator
from app.rules.evaluators.consumer_care_evaluator import ConsumerCareEvaluator
from app.rules.evaluators.country_origin_evaluator import CountryOfOriginEvaluator
from app.rules.evaluators.language_evaluator import LanguageDeclarationEvaluator

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
    "LMPC-DECL-LANG": LanguageDeclarationEvaluator(),
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
            else:
                src.title = src_data["title"]
                src.status = src_data["status"]
                src.source_url = src_data["source_url"]
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
            else:
                rule.title = r_entry["title"]
                rule.description = r_entry["description"]
                rule.category = r_entry["category"]
                rule.severity = r_entry["severity"]

            versions_list = r_entry.get("versions") or [r_entry.get("version")]
            for ver_data in versions_list:
                if not ver_data:
                    continue
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
                        status=ver_data.get("status", "ACTIVE")
                    )
                    db.add(rv)
                else:
                    rv.status = ver_data.get("status", rv.status)
                    rv.effective_from = ver_data["effective_from"]
                    rv.effective_to = ver_data.get("effective_to")
                    rv.requirement_text = ver_data["requirement_text"]
                    rv.source_reference = ver_data["source_reference"]
        db.commit()

    @classmethod
    def run_compliance_evaluation(
        cls,
        db: Session,
        inspection: Inspection,
        version: ArtworkVersion,
        product: Optional[Product],
        inspection_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes deterministic evaluation across active verified rule versions effective as of inspection date.
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

        # Default inspection date to today (YYYY-MM-DD) if not specified
        effective_date_filter = inspection_date or (inspection.created_at.strftime("%Y-%m-%d") if inspection.created_at else "2026-09-19")

        product_context = {
            "name": product.name if product else "",
            "brand": product.brand if product else "",
            "category": product.category if product else "",
            "packaging_type": product.packaging_type if product else "",
            "net_quantity": product.net_quantity if product else "",
            "description": product.description if product else "",
            "is_imported": False,
            "inspection_date": effective_date_filter
        }

        # Query all active rule versions applicable to physical packaging
        all_active_versions = db.query(RuleVersion).filter(RuleVersion.status == "ACTIVE").all()

        # Filter by effective date and packaging scope
        evaluable_rule_versions = []
        for rv in all_active_versions:
            if rv.applicability == "ECOMMERCE_LISTINGS_ONLY":
                # E-commerce listing features (e.g. Rule 6(10A)) are out of physical artwork scope
                continue
            if rv.effective_from and rv.effective_from > effective_date_filter:
                # Future effective rule
                continue
            if rv.effective_to and rv.effective_to < effective_date_filter:
                # Superseded rule
                continue
            evaluable_rule_versions.append(rv)

        pass_count = 0
        issue_count = 0
        review_count = 0
        na_count = 0

        evaluations_list = []

        for rv in evaluable_rule_versions:
            evaluator = EVALUATOR_REGISTRY.get(rv.rule_code)
            if not evaluator:
                logger.warning(f"No evaluator registered for rule_code {rv.rule_code}")
                continue

            # Rule 26 Statutory Exemptions check based on net quantity / package weight
            pkg_weight = product_context.get("package_weight_value")
            pkg_unit = product_context.get("package_weight_unit")
            if pkg_weight is None:
                nq_raw = str(product_context.get("net_quantity") or "")
                if not nq_raw and isinstance(extracted_fields.get("net_quantity"), dict):
                    nq_raw = str(extracted_fields["net_quantity"].get("extracted_value") or "")
                elif not nq_raw and hasattr(extracted_fields.get("net_quantity"), "extracted_value"):
                    nq_raw = str(extracted_fields["net_quantity"].extracted_value or "")
                import re
                m = re.search(r"(\d+(?:\.\d+)?)\s*(g|gm|gms|ml)\b", nq_raw, re.IGNORECASE)
                if m:
                    try:
                        pkg_weight = float(m.group(1))
                        pkg_unit = m.group(2).lower()
                    except ValueError:
                        pass

            is_exempt_full = False
            is_exempt_partial = False
            if pkg_weight is not None and pkg_unit in ("g", "gm", "gms", "ml"):
                if pkg_weight <= 10:
                    is_exempt_full = True
                elif pkg_weight <= 20 and rv.rule_code not in ("LMPC-DECL-MRP", "LMPC-DECL-NET-QTY"):
                    is_exempt_partial = True

            if is_exempt_full:
                status = "N/A"
                obs_val = f"Package Weight/Volume: {pkg_weight}{pkg_unit}"
                exp_cond = "Exempt from mandatory declarations under Rule 26 (<= 10g or 10ml)"
                explanation = f"Statutory exemption under Rule 26 of Legal Metrology Rules, 2011: Packages with net quantity <= 10g or 10ml are exempt from mandatory packaging declarations."
                evidence_info = None
                action = None
            elif is_exempt_partial:
                status = "N/A"
                obs_val = f"Package Weight/Volume: {pkg_weight}{pkg_unit}"
                exp_cond = "Exempt from declarations other than MRP & Net Qty under Rule 26 (<= 20g or 20ml)"
                explanation = f"Statutory exemption under Rule 26 of Legal Metrology Rules, 2011: Packages with net quantity <= 20g or 20ml are exempt from declarations other than MRP and Net Quantity."
                evidence_info = None
                action = None
            else:
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
                matched_panel_id = None
                bbox_data = evidence_info.get("bbox")
                if isinstance(bbox_data, dict):
                    # Direct panel_id or panel_type
                    req_pid = evidence_info.get("panel_id") or bbox_data.get("panel_id")
                    req_ptype = evidence_info.get("panel_type") or bbox_data.get("panel_type")
                    if req_pid and version.panels:
                        for p in version.panels:
                            if p.id == req_pid:
                                matched_panel_id = p.id
                                break
                    if not matched_panel_id and req_ptype and version.panels:
                        norm_type = str(req_ptype).strip().upper()
                        for p in version.panels:
                            if p.panel_type.upper() == norm_type:
                                matched_panel_id = p.id
                                break
                    if not matched_panel_id and version.panels:
                        lbl = str(bbox_data.get("label", "")).upper()
                        for p in version.panels:
                            if f"[{p.panel_type.upper()}]" in lbl:
                                matched_panel_id = p.id
                                break

                if not matched_panel_id and version.panels:
                    matched_panel_id = version.panels[0].id

                # Ensure bbox dictionary is enriched with panel info
                if isinstance(bbox_data, dict) and matched_panel_id:
                    matched_panel = next((p for p in version.panels if p.id == matched_panel_id), None)
                    if matched_panel:
                        bbox_data["panel_id"] = matched_panel.id
                        bbox_data["panel_type"] = matched_panel.panel_type

                evidence_rec = Evidence(
                    inspection_id=inspection.id,
                    source_type=evidence_info.get("source_type", "OCR"),
                    panel_id=matched_panel_id,
                    page_number=1,
                    bbox=bbox_data,
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
        pass_ratio_pct = round((pass_count / max(1, evaluable_rules)) * 100.0, 1)

        findings_summary = {
            "total_rules": len(evaluable_rule_versions),
            "evaluable_rules": evaluable_rules,
            "pass_count": pass_count,
            "issue_count": issue_count,
            "review_count": review_count,
            "na_count": na_count,
            "verdict": overall_verdict,
            "score": pass_ratio_pct,
            "pass_ratio": f"{pass_count} of {evaluable_rules} verified checks passed",
            "disclaimer": "Verified statutory pre-print assessment under Legal Metrology (Packaged Commodities) Rules, 2011. Assisted pre-print verification tool — not a substitute for statutory authority certification."
        }

        # Update inspection record
        inspection.compliance_verdict = overall_verdict
        inspection.compliance_score = pass_ratio_pct
        inspection.findings_summary = findings_summary
        db.commit()
        db.refresh(inspection)

        return findings_summary
