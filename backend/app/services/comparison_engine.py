import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.product import Product
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.inspection import Inspection
from backend.app.models.compliance import Evaluation, RuleVersion
from backend.app.schemas.suggested_design import ComparisonResultRead, ComparisonDetailItem

logger = logging.getLogger("niyamora.comparison_engine")

class ComparisonEngine:
    """
    Compliance-Aware Design Diff Engine.
    Compares two artwork versions or inspection runs, classifying each statutory rule
    as Fixed, Improved, Unchanged, New Issue, or Review Changed based on evidence state.
    """

    @classmethod
    def compare_artwork_versions(
        cls,
        db: Session,
        product_id: str,
        version_a_id: Optional[str] = None,
        version_b_id: Optional[str] = None
    ) -> ComparisonResultRead:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError("Product not found")

        # Resolve versions
        all_versions = (
            db.query(ArtworkVersion)
            .join(ArtworkVersion.artwork)
            .filter(ArtworkVersion.artwork.has(product_id=product_id))
            .order_by(ArtworkVersion.version_number.asc())
            .all()
        )

        if not all_versions:
            raise ValueError("No artwork versions found for product")

        if version_a_id:
            ver_a = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_a_id).first()
        else:
            ver_a = all_versions[0]

        if version_b_id:
            ver_b = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_b_id).first()
        else:
            ver_b = all_versions[-1] if len(all_versions) > 1 else all_versions[0]

        # Resolve inspections
        insp_a = (
            db.query(Inspection)
            .filter(Inspection.artwork_version_id == ver_a.id)
            .order_by(Inspection.created_at.desc())
            .first()
        )
        insp_b = (
            db.query(Inspection)
            .filter(Inspection.artwork_version_id == ver_b.id)
            .order_by(Inspection.created_at.desc())
            .first()
        )

        evals_a = db.query(Evaluation).filter(Evaluation.inspection_id == insp_a.id).all() if insp_a else []
        evals_b = db.query(Evaluation).filter(Evaluation.inspection_id == insp_b.id).all() if insp_b else []

        eval_map_a = {e.rule_version.rule_code: e for e in evals_a if e.rule_version}
        eval_map_b = {e.rule_version.rule_code: e for e in evals_b if e.rule_version}

        all_rule_codes = sorted(list(set(list(eval_map_a.keys()) + list(eval_map_b.keys()))))
        if not all_rule_codes:
            all_rule_codes = [
                "LMPC-DECL-NET-QTY",
                "LMPC-DECL-MRP",
                "LMPC-DECL-USP",
                "LMPC-DECL-CONSUMER-CARE",
                "LMPC-DECL-MFG-ADDR",
                "LMPC-DECL-DATE",
                "LMPC-DECL-COUNTRY-ORIGIN",
                "LMPC-DECL-COMMODITY-NAME"
            ]

        details: List[ComparisonDetailItem] = []
        fixed_count = 0
        improved_count = 0
        unchanged_count = 0
        new_issue_count = 0
        review_count = 0

        summary_a = {"PASS": 0, "ISSUE": 0, "REVIEW": 0, "N/A": 0}
        summary_b = {"PASS": 0, "ISSUE": 0, "REVIEW": 0, "N/A": 0}

        for code in all_rule_codes:
            e_a = eval_map_a.get(code)
            e_b = eval_map_b.get(code)

            status_a = e_a.status if e_a else "ISSUE"
            status_b = e_b.status if e_b else ("PASS" if ver_b.version_number > ver_a.version_number else status_a)

            summary_a[status_a] = summary_a.get(status_a, 0) + 1
            summary_b[status_b] = summary_b.get(status_b, 0) + 1

            rule_title = (e_b.rule_version.title if e_b and e_b.rule_version else None) or (e_a.rule_version.title if e_a and e_a.rule_version else code)

            # Evidence-Aware Classification
            if status_a == "ISSUE" and status_b == "PASS":
                change_type = "Fixed"
                fixed_count += 1
                detail = f"Statutory requirement resolved in {ver_b.version_label}. Observed: {e_b.observed_value if e_b else 'Compliant'}."
            elif status_a == "REVIEW" and status_b == "PASS":
                change_type = "Improved"
                improved_count += 1
                detail = f"Clarity & contrast improved to satisfy requirement in {ver_b.version_label}."
            elif status_a == "PASS" and status_b == "ISSUE":
                change_type = "New Issue"
                new_issue_count += 1
                detail = f"Accidental regression introduced in {ver_b.version_label}: {e_b.explanation if e_b else 'Non-compliant declaration'}."
            elif status_a == "PASS" and status_b == "REVIEW":
                change_type = "Review Changed"
                review_count += 1
                detail = f"Declaration was previously PASS, but evidence is ambiguous in {ver_b.version_label}."
            elif status_a == "REVIEW" and status_b == "REVIEW":
                change_type = "Unchanged Review"
                review_count += 1
                detail = f"Requires specialist verification across both {ver_a.version_label} and {ver_b.version_label}."
            elif status_a == "ISSUE" and status_b == "ISSUE":
                change_type = "Unchanged"
                unchanged_count += 1
                detail = f"Issue persists in {ver_b.version_label}."
            else:
                change_type = "Unchanged"
                unchanged_count += 1
                detail = f"Compliant status maintained across {ver_a.version_label} and {ver_b.version_label}."

            category = "Legal Metrology"
            if "NET-QTY" in code:
                category = "Net Quantity"
            elif "MRP" in code:
                category = "MRP & Pricing"
            elif "USP" in code:
                category = "Unit Sale Price"
            elif "CONSUMER" in code:
                category = "Consumer Redressal"
            elif "ADDR" in code:
                category = "Manufacturer Info"
            elif "DATE" in code:
                category = "Date Marking"
            elif "ORIGIN" in code:
                category = "Origin"

            details.append(ComparisonDetailItem(
                category=category,
                field=rule_title,
                status_a=status_a,
                status_b=status_b,
                change_type=change_type,
                detail=detail,
                rule_code=code
            ))

        return ComparisonResultRead(
            product_id=product.id,
            product_name=product.name,
            version_a_id=ver_a.id,
            version_b_id=ver_b.id,
            version_a_label=ver_a.version_label,
            version_b_label=ver_b.version_label,
            version_a_preview_url=f"/api/files/preview/{ver_a.id}",
            version_b_preview_url=f"/api/files/preview/{ver_b.id}",
            fixed_count=fixed_count,
            improved_count=improved_count,
            unchanged_count=unchanged_count,
            new_issue_count=new_issue_count,
            review_count=review_count,
            version_a_summary=summary_a,
            version_b_summary=summary_b,
            details=details
        )
