import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.artwork_version import ArtworkVersion
from app.models.inspection import Inspection
from app.models.compliance import Evaluation
from app.schemas.suggested_design import RegressionResultRead, RegressionIssueItem

logger = logging.getLogger("niyamora.regression_engine")

class RegressionEngine:
    """
    Deterministic Compliance Regression Engine.
    Evaluates evidence-aware transitions between artwork versions without arbitrary score formulas.
    Establishes whether any new statutory violations were detected in evaluated checks.
    """

    @classmethod
    def analyze_regression(
        cls,
        db: Session,
        product_id: str,
        version_a_id: Optional[str] = None,
        version_b_id: Optional[str] = None
    ) -> RegressionResultRead:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError("Product not found")

        all_versions = (
            db.query(ArtworkVersion)
            .join(ArtworkVersion.artwork)
            .filter(ArtworkVersion.artwork.has(product_id=product_id))
            .order_by(ArtworkVersion.version_number.asc())
            .all()
        )

        if not all_versions:
            raise ValueError("No artwork versions found for product")

        ver_a = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_a_id).first() if version_a_id else all_versions[0]
        ver_b = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_b_id).first() if version_b_id else (all_versions[-1] if len(all_versions) > 1 else all_versions[0])

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

        all_codes = sorted(list(set(list(eval_map_a.keys()) + list(eval_map_b.keys()))))
        if not all_codes:
            all_codes = [
                "LMPC-DECL-NET-QTY",
                "LMPC-DECL-MRP",
                "LMPC-DECL-USP",
                "LMPC-DECL-CONSUMER-CARE",
                "LMPC-DECL-MFG-ADDR",
                "LMPC-DECL-DATE",
                "LMPC-DECL-COUNTRY-ORIGIN",
                "LMPC-DECL-COMMODITY-NAME"
            ]

        fixed_issues: List[RegressionIssueItem] = []
        new_issues: List[RegressionIssueItem] = []
        improved_issues: List[RegressionIssueItem] = []
        unchanged_issues: List[RegressionIssueItem] = []
        review_changed_issues: List[RegressionIssueItem] = []

        summary_a = {"PASS": 0, "ISSUE": 0, "REVIEW": 0, "N/A": 0}
        summary_b = {"PASS": 0, "ISSUE": 0, "REVIEW": 0, "N/A": 0}

        for code in all_codes:
            e_a = eval_map_a.get(code)
            e_b = eval_map_b.get(code)

            status_a = e_a.status if e_a else "NOT_EVALUATED"
            status_b = e_b.status if e_b else "NOT_EVALUATED"

            if status_a in summary_a:
                summary_a[status_a] = summary_a.get(status_a, 0) + 1
            if status_b in summary_b:
                summary_b[status_b] = summary_b.get(status_b, 0) + 1

            rule_title = (e_b.rule_version.title if e_b and e_b.rule_version else None) or (e_a.rule_version.title if e_a and e_a.rule_version else code)

            item = RegressionIssueItem(
                rule_code=code,
                field=rule_title,
                description=f"Status transitioned from {status_a} ({ver_a.version_label}) to {status_b} ({ver_b.version_label}).",
                old_status=status_a,
                new_status=status_b,
                severity="CRITICAL" if status_b == "ISSUE" else ("REVIEW" if status_b == "REVIEW" else "LOW"),
                suggested_action=f"Review dieline layout to verify statutory spacing for {rule_title}." if status_b in ["ISSUE", "REVIEW"] else None
            )

            # Evidence-aware regression mapping
            if status_a == "PASS" and status_b == "ISSUE":
                item.description = f"Accidental regression introduced in {ver_b.version_label}: previously PASS, now ISSUE."
                new_issues.append(item)
            elif status_a == "PASS" and status_b == "REVIEW":
                item.description = f"Evidence degraded in {ver_b.version_label}: previously PASS, now requires human review."
                review_changed_issues.append(item)
            elif status_a == "ISSUE" and status_b == "PASS":
                fixed_issues.append(item)
            elif status_a == "REVIEW" and status_b == "PASS":
                item.description = f"Clarity improved to satisfy requirement in {ver_b.version_label}."
                improved_issues.append(item)
            else:
                unchanged_issues.append(item)

        regression_detected = len(new_issues) > 0
        if regression_detected:
            verdict = "REGRESSION_DETECTED"
        elif len(fixed_issues) > 0 or len(improved_issues) > 0:
            verdict = "IMPROVED"
        else:
            verdict = "NO_REGRESSION"

        return RegressionResultRead(
            product_id=product.id,
            product_name=product.name,
            comparison_title=f"Regression Analysis: {ver_a.version_label} vs {ver_b.version_label}",
            version_a_label=ver_a.version_label,
            version_b_label=ver_b.version_label,
            regression_detected=regression_detected,
            regression_verdict=verdict,
            fixed_issues=fixed_issues,
            new_issues_introduced=new_issues,
            improved_issues=improved_issues,
            unchanged_issues=unchanged_issues,
            review_changed_issues=review_changed_issues,
            version_a_summary=summary_a,
            version_b_summary=summary_b
        )
