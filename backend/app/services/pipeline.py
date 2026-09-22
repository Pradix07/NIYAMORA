import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.inspection import Inspection
from app.models.artwork_version import ArtworkVersion
from app.models.product import Product
from app.processors.quality import ImageQualityAnalyzer
from app.processors.extractor import ContentExtractor
from app.processors.structurer import PackagingFieldStructurer
from app.services.ai_extractor import AIExtractionService
from app.models.artwork_panel import ArtworkPanel
from app.schemas.inspection import ExtractionResult, TextBlock, BoundingBoxCoord
from app.rules.engine import ComplianceEngine

logger = logging.getLogger("niyamora.pipeline")

class InspectionPipelineService:
    """
    Orchestrates the End-to-End Processing Pipeline:
    1. Validation & Storage
    2. Quality Precheck across all packaging panels
    3. Text & Layout Extraction across all panels
    4. Structured Field Parsing
    5. Deterministic Compliance Evaluation Engine (Phase 3)
    6. Inspection Completion
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

            # Retrieve all panels for this artwork version
            panels = (
                db.query(ArtworkPanel)
                .filter(ArtworkPanel.artwork_version_id == version.id)
                .order_by(ArtworkPanel.created_at.asc())
                .all()
            )

            # Fallback if no panels are explicitly registered
            if not panels:
                panels = [
                    ArtworkPanel(
                        id=f"panel_{version.id[:8]}",
                        artwork_version_id=version.id,
                        panel_type="FRONT",
                        file_path=version.file_path,
                        original_filename=version.original_filename,
                        mime_type=version.mime_type,
                        file_size_bytes=version.file_size_bytes
                    )
                ]

            # Stage 2: Quality Precheck across all panels
            quality_reports = []
            for p in panels:
                logger.info(f"Running Quality Precheck on panel {p.panel_type} ({p.file_path})")
                q_rep = ImageQualityAnalyzer.analyze_file(p.file_path, p.mime_type)
                quality_reports.append((p, q_rep))

            # Aggregate quality metrics
            if any(q.verdict == "POOR" for _, q in quality_reports):
                overall_quality_verdict = "POOR"
            elif any(q.verdict == "REVIEW" for _, q in quality_reports):
                overall_quality_verdict = "REVIEW"
            else:
                overall_quality_verdict = "GOOD"

            avg_quality_score = round(
                sum(q.score for _, q in quality_reports) / max(1, len(quality_reports)), 2
            )
            primary_report = quality_reports[0][1]
            primary_dump = primary_report.model_dump()

            aggregated_quality_details = {
                "verdict": overall_quality_verdict,
                "score": avg_quality_score,
                "panel_count": len(panels),
                "is_pdf": any(q.is_pdf for _, q in quality_reports),
                "width": primary_report.width,
                "height": primary_report.height,
                "details": primary_dump.get("details", []),
                "warnings": [w for _, q in quality_reports for w in q.warnings],
                "panel_breakdown": [
                    {
                        "panel_id": p.id,
                        "panel_type": p.panel_type,
                        "filename": p.original_filename,
                        "verdict": q.verdict,
                        "score": q.score
                    }
                    for p, q in quality_reports
                ]
            }

            inspection.quality_verdict = overall_quality_verdict
            inspection.quality_score = avg_quality_score
            inspection.quality_details = aggregated_quality_details
            inspection.current_stage = "TEXT_EXTRACTION"
            db.commit()

            # Stage 3: Text & Bounding Box Extraction across ALL panels
            all_blocks: list[TextBlock] = []
            raw_text_parts: list[str] = []
            panel_contexts: list[dict] = []
            first_preview_path = None

            for p in panels:
                logger.info(f"Running Content Extraction on panel {p.panel_type} ({p.file_path})")
                p_raw, p_blocks, p_preview = ContentExtractor.extract(p.file_path, p.mime_type)
                
                if p_preview and not first_preview_path:
                    first_preview_path = p_preview

                if p_raw and p_raw.strip():
                    raw_text_parts.append(p_raw.strip())
                    panel_contexts.append({
                        "panel_type": p.panel_type,
                        "panel_id": p.id,
                        "filename": p.original_filename,
                        "raw_text": p_raw.strip()
                    })

                # Tag each block with panel identifier
                for blk in p_blocks:
                    tagged_block = TextBlock(
                        id=f"{p.panel_type}_{blk.id}",
                        text=blk.text,
                        confidence=blk.confidence,
                        bbox=blk.bbox,
                        normalized_box=BoundingBoxCoord(
                            x=blk.normalized_box.x,
                            y=blk.normalized_box.y,
                            width=blk.normalized_box.width,
                            height=blk.normalized_box.height,
                            label=f"[{p.panel_type}] {blk.normalized_box.label}",
                            panel_type=p.panel_type,
                            panel_id=p.id
                        )
                    )
                    all_blocks.append(tagged_block)

            if first_preview_path and not version.preview_image_path:
                version.preview_image_path = first_preview_path
                db.commit()

            combined_raw_text = "\n\n".join(raw_text_parts) if raw_text_parts else ""

            inspection.current_stage = "STRUCTURED_PARSING"
            db.commit()

            # Stage 4: Structured Packaging Entity Parsing (Deterministic + AI Extraction Layer)
            logger.info(f"Structuring {len(all_blocks)} blocks from {len(panels)} panel(s) into packaging fields")
            fields = PackagingFieldStructurer.structure_fields(
                raw_text=combined_raw_text,
                blocks=all_blocks,
                product_name_hint=name_hint,
                brand_hint=brand_hint
            )

            # AI-assisted structured extraction enrichment (Groq LLM)
            try:
                ai_data = AIExtractionService.extract_fields(
                    raw_text=combined_raw_text,
                    panel_context=panel_contexts
                )
                if ai_data:
                    logger.info("Enriching packaging declarations with AI-assisted structured extraction")
                    fields = AIExtractionService.enrich_fields_with_ai(fields, ai_data, all_blocks)
            except Exception as ai_err:
                logger.warning(f"AI extraction skipped; proceeding with deterministic extraction: {ai_err}")

            extraction_result = ExtractionResult(
                raw_text=combined_raw_text,
                total_blocks=len(all_blocks),
                blocks=all_blocks,
                fields=fields,
                phase_note=f"Extraction and parsing completed across {len(panels)} packaging panel(s). Verified compliance rules evaluated."
            )

            # Update product name if previously generic/filename-like and confident text detected
            if product and (product.name == "Packaging Artwork" or PackagingFieldStructurer._is_filename_like(product.name)):
                prod_field = fields.get("product_name")
                if prod_field and prod_field.extracted_value:
                    val = prod_field.extracted_value.strip()
                    if val and not PackagingFieldStructurer._is_filename_like(val) and len(val) >= 3:
                        product.name = val
                        db.commit()

            inspection.extracted_data = extraction_result.model_dump()
            inspection.current_stage = "COMPLIANCE_EVALUATION"
            db.commit()

            # Stage 5: Deterministic Compliance Engine Execution
            logger.info(f"Executing Deterministic Statutory Compliance Engine for inspection {inspection_id}")
            findings_summary = ComplianceEngine.run_compliance_evaluation(
                db=db,
                inspection=inspection,
                version=version,
                product=product
            )

            # Stage 6: Finalize Inspection
            inspection.status = "COMPLETED"
            inspection.current_stage = "DONE"
            inspection.completed_at = datetime.utcnow()
            version.processing_status = "COMPLETED"
            
            db.commit()
            db.refresh(inspection)
            logger.info(f"Inspection {inspection_id} completed: verdict={inspection.compliance_verdict}, score={inspection.compliance_score}%")
            return inspection

        except Exception as e:
            logger.exception(f"Pipeline failed for inspection {inspection_id}: {str(e)}")
            inspection.status = "FAILED"
            inspection.error_message = f"Processing error: {str(e)}"
            inspection.current_stage = "ERROR"
            version.processing_status = "FAILED"
            db.commit()
            return inspection
