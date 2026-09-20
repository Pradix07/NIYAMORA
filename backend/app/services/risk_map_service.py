import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.product import Product
from backend.app.models.inspection import Inspection
from backend.app.models.compliance import Evaluation, Finding, Evidence
from backend.app.schemas.suggested_design import RiskMapResponse, RiskMapItem

logger = logging.getLogger("niyamora.risk_map_service")

class RiskMapService:
    """
    Artwork Attention & Finding Density Map Service.
    Visualizes spatial distribution of findings across packaging dieline coordinates
    based strictly on verified machine evaluations and extracted evidence bounding boxes.
    Does NOT invent fictitious pseudo-legal risk scores.
    """

    @classmethod
    def generate_risk_map(
        cls,
        db: Session,
        product_id: str,
        inspection_id: Optional[str] = None
    ) -> RiskMapResponse:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError("Product not found")

        if inspection_id:
            inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        else:
            inspection = (
                db.query(Inspection)
                .filter(Inspection.product_id == product_id)
                .order_by(Inspection.created_at.desc())
                .first()
            )

        if not inspection:
            return RiskMapResponse(
                product_id=product_id,
                inspection_id="none",
                total_findings=0,
                issue_count=0,
                review_count=0,
                pass_count=0,
                high_density_count=0,
                medium_density_count=0,
                low_density_count=0,
                risk_items=[]
            )

        evaluations = db.query(Evaluation).filter(Evaluation.inspection_id == inspection.id).all()
        findings = db.query(Finding).filter(Finding.inspection_id == inspection.id).all()
        evidences = db.query(Evidence).filter(Evidence.inspection_id == inspection.id).all()

        finding_map = {f.evaluation_id: f for f in findings}
        evidence_map = {ev.id: ev for ev in evidences}

        risk_items: List[RiskMapItem] = []
        issue_count = 0
        review_count = 0
        pass_count = 0
        high_density_count = 0
        medium_density_count = 0
        low_density_count = 0

        for ev in evaluations:
            code = ev.rule_version.rule_code if ev.rule_version else "LMPC-RULE"
            title = ev.rule_version.title if ev.rule_version else code
            finding = finding_map.get(ev.id)
            evidence = evidence_map.get(ev.evidence_id) if ev.evidence_id else (finding.evidence if finding else None)

            bbox = evidence.bbox if evidence and evidence.bbox else None
            if isinstance(bbox, list) and len(bbox) == 4:
                bbox = {"x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1]}

            if ev.status == "ISSUE":
                issue_count += 1
                density_level = "HIGH"
                high_density_count += 1
            elif ev.status == "REVIEW":
                review_count += 1
                density_level = "MEDIUM"
                medium_density_count += 1
            else:
                pass_count += 1
                density_level = "LOW"
                low_density_count += 1

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
                category = "Country of Origin"

            risk_items.append(RiskMapItem(
                id=ev.id,
                category=category,
                field=title,
                rule_code=code,
                status=ev.status,
                density_level=density_level,
                bbox=bbox,
                finding_id=finding.id if finding else None,
                explanation=ev.explanation
            ))

        return RiskMapResponse(
            product_id=product.id,
            inspection_id=inspection.id,
            total_findings=len(findings),
            issue_count=issue_count,
            review_count=review_count,
            pass_count=pass_count,
            high_density_count=high_density_count,
            medium_density_count=medium_density_count,
            low_density_count=low_density_count,
            risk_items=risk_items
        )
