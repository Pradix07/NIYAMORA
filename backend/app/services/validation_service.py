import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.suggested_design import SuggestedDesign, AuditEvent
from backend.app.models.inspection import Inspection
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.product import Product
from backend.app.models.compliance import Evaluation
from backend.app.services.suggested_design_renderer import SuggestedDesignRenderer
from backend.app.services.pipeline import InspectionPipelineService

logger = logging.getLogger("niyamora.validation_service")

class ValidationService:
    """
    Re-validates a Suggested Design by executing the full Phase 2 Extraction
    and Phase 3 Deterministic Compliance Rule Engine on the rendered suggested artwork.
    Does NOT assume compliance: evaluates proof against statutory rules.
    """

    @classmethod
    def revalidate_suggested_design(
        cls,
        db: Session,
        suggested_design_id: str
    ) -> SuggestedDesign:
        suggested_design = db.query(SuggestedDesign).filter(SuggestedDesign.id == suggested_design_id).first()
        if not suggested_design:
            raise ValueError("SuggestedDesign not found")

        # 1. Ensure suggested artwork version exists (render if not already rendered)
        if not suggested_design.suggested_artwork_version_id or not suggested_design.rendered_artwork_reference:
            suggested_design = SuggestedDesignRenderer.render_suggested_design(db, suggested_design_id)

        suggested_version_id = suggested_design.suggested_artwork_version_id
        product_id = suggested_design.product_id

        product = db.query(Product).filter(Product.id == product_id).first()

        # 2. Create and execute new Inspection for the suggested version
        val_inspection = Inspection(
            product_id=product_id,
            artwork_version_id=suggested_version_id,
            status="QUEUED",
            current_stage="INITIALIZING"
        )
        db.add(val_inspection)
        db.commit()
        db.refresh(val_inspection)

        # Run extraction & compliance pipeline
        InspectionPipelineService.execute_inspection(db, val_inspection.id)
        db.refresh(val_inspection)

        # 3. Deterministic Verification Comparison
        source_insp = db.query(Inspection).filter(Inspection.id == suggested_design.source_inspection_id).first()
        source_evals = db.query(Evaluation).filter(Evaluation.inspection_id == source_insp.id).all() if source_insp else []
        val_evals = db.query(Evaluation).filter(Evaluation.inspection_id == val_inspection.id).all()

        source_eval_map = {e.rule_version.rule_code: e.status for e in source_evals if e.rule_version}
        val_eval_map = {e.rule_version.rule_code: e.status for e in val_evals if e.rule_version}

        fixed_count = 0
        new_issues_count = 0
        unchanged_issues_count = 0
        review_count = 0

        for code, val_status in val_eval_map.items():
            src_status = source_eval_map.get(code, "PASS")
            if src_status == "ISSUE" and val_status == "PASS":
                fixed_count += 1
            elif src_status != "ISSUE" and val_status == "ISSUE":
                new_issues_count += 1
            elif src_status == "ISSUE" and val_status == "ISSUE":
                unchanged_issues_count += 1
            elif val_status == "REVIEW":
                review_count += 1

        # Determine verification status
        if new_issues_count > 0:
            outcome = "NEW_ISSUES_FOUND"
        elif unchanged_issues_count == 0 and fixed_count > 0:
            outcome = "IMPROVED"
        elif unchanged_issues_count < len([s for s in source_eval_map.values() if s == "ISSUE"]):
            outcome = "IMPROVED"
        elif review_count > 0:
            outcome = "REVIEW_REQUIRED"
        else:
            outcome = "NO_CHANGE"

        suggested_design.validation_status = outcome
        suggested_design.validation_inspection_id = val_inspection.id
        suggested_design.status = "VERIFIED"
        db.commit()
        db.refresh(suggested_design)

        # Record Audit Event
        if product:
            audit = AuditEvent(
                company_id=product.company_id,
                action="SUGGESTED_DESIGN_VERIFIED",
                entity_type="SUGGESTED_DESIGN",
                entity_id=suggested_design.id,
                details={
                    "product_id": product_id,
                    "validation_inspection_id": val_inspection.id,
                    "outcome": outcome,
                    "fixed_count": fixed_count,
                    "new_issues_count": new_issues_count
                }
            )
            db.add(audit)
            db.commit()

        logger.info(f"Re-validated SuggestedDesign {suggested_design.id}: Outcome={outcome}, Inspection={val_inspection.id}")
        return suggested_design
