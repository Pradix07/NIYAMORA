import logging
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.inspection import Inspection
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.product import Product
from backend.app.processors.quality import ImageQualityAnalyzer
from backend.app.processors.extractor import ContentExtractor
from backend.app.processors.structurer import PackagingFieldStructurer
from backend.app.schemas.inspection import ExtractionResult

logger = logging.getLogger("niyamora.pipeline")

class InspectionPipelineService:
    """
    Orchestrates the Phase 2 Processing Pipeline:
    1. Validation
    2. Quality Precheck
    3. Text & Layout Extraction
    4. Structured Field Parsing
    5. Inspection Record Completion
    """

    @classmethod
    def execute_inspection(cls, db: Session, inspection_id: str) -> Inspection:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            logger.error(f"Inspection {inspection_id} not found.")
            return None

        version = db.query(ArtworkVersion).filter(ArtworkVersion.id == inspection.artwork_version_id).first()
        if not version:
            inspection.status = "FAILED"
            inspection.error_message = "Associated artwork version not found."
            db.commit()
            return inspection

        product = db.query(Product).filter(Product.id == inspection.product_id).first()
        brand_hint = product.brand if product else None
        name_hint = product.name if product else None

        try:
            # Stage 1: Validation & Initialization
            inspection.status = "PROCESSING"
            inspection.current_stage = "QUALITY_PRECHECK"
            db.commit()

            # Stage 2: Quality Precheck
            logger.info(f"Running Quality Precheck on {version.file_path}")
            quality_report = ImageQualityAnalyzer.analyze_file(version.file_path, version.mime_type)
            
            inspection.quality_verdict = quality_report.verdict
            inspection.quality_score = quality_report.score
            inspection.quality_details = quality_report.model_dump()
            inspection.current_stage = "TEXT_EXTRACTION"
            db.commit()

            # Stage 3: Text & Bounding Box Extraction
            logger.info(f"Running Content Extraction on {version.file_path}")
            raw_text, blocks, preview_path = ContentExtractor.extract(version.file_path, version.mime_type)
            
            if preview_path and not version.preview_image_path:
                version.preview_image_path = preview_path
                db.commit()

            inspection.current_stage = "STRUCTURED_PARSING"
            db.commit()

            # Stage 4: Structured Packaging Entity Parsing
            logger.info(f"Structuring {len(blocks)} blocks into packaging fields")
            fields = PackagingFieldStructurer.structure_fields(
                raw_text=raw_text,
                blocks=blocks,
                product_name_hint=name_hint,
                brand_hint=brand_hint
            )

            extraction_result = ExtractionResult(
                raw_text=raw_text,
                total_blocks=len(blocks),
                blocks=blocks,
                fields=fields,
                phase_note="Phase 2 Structured Extraction Complete. Legal Metrology & FSSAI rule compliance evaluation pending in Phase 3."
            )

            inspection.extracted_data = extraction_result.model_dump()
            
            # Stage 5: Finalize
            inspection.status = "COMPLETED"
            inspection.current_stage = "DONE"
            inspection.completed_at = datetime.utcnow()
            version.processing_status = "COMPLETED"
            
            db.commit()
            db.refresh(inspection)
            logger.info(f"Inspection {inspection_id} successfully completed.")
            return inspection

        except Exception as e:
            logger.exception(f"Pipeline failed for inspection {inspection_id}: {str(e)}")
            inspection.status = "FAILED"
            inspection.error_message = f"Processing error: {str(e)}"
            inspection.current_stage = "ERROR"
            version.processing_status = "FAILED"
            db.commit()
            return inspection
