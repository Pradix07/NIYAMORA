import os
import io
import re
import logging
from datetime import datetime
from typing import Tuple, Optional, Dict, Any, List
import fitz  # PyMuPDF
from sqlalchemy.orm import Session
from app.models.suggested_design import SuggestedDesign, AuditEvent
from app.models.product import Product
from app.models.artwork_version import ArtworkVersion
from app.models.artwork_panel import ArtworkPanel
from app.models.inspection import Inspection
from app.models.compliance import Evaluation, Finding

logger = logging.getLogger("niyamora.pdf_generator")

class PDFReportGenerator:
    """
    High-fidelity PDF Report Generator using PyMuPDF (fitz).
    Produces NIYAMORA Suggested Design and Pre-Press Compliance Review Reports
    with verified statutory citations, factual verification summaries, and mandatory regulatory disclaimers.
    """

    @classmethod
    def generate_inspection_pdf(
        cls,
        db: Session,
        inspection_id: str
    ) -> Tuple[bytes, str]:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise ValueError("Inspection not found")

        product = db.query(Product).filter(Product.id == inspection.product_id).first()
        if not product:
            raise ValueError("Product not found")

        version = db.query(ArtworkVersion).filter(ArtworkVersion.id == inspection.artwork_version_id).first()
        version_label = version.version_label if version else "V01"

        evals = db.query(Evaluation).filter(Evaluation.inspection_id == inspection.id).all()
        findings = db.query(Finding).filter(Finding.inspection_id == inspection.id).all()

        counts = {"PASS": 0, "ISSUE": 0, "REVIEW": 0, "N/A": 0}
        for e in evals:
            counts[e.status] = counts.get(e.status, 0) + 1

        safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', product.name).strip('_')
        if not safe_name:
            safe_name = "Product"
        filename = f"{safe_name}_NIYAMORA_Inspection_{version_label}.pdf"

        doc = fitz.open()

        # --- PAGE 1: COVER & INSPECTION SUMMARY ---
        page1 = doc.new_page(width=595, height=842)

        # Header Bar
        page1.draw_rect(fitz.Rect(0, 0, 595, 60), color=None, fill=(0.06, 0.09, 0.16))
        page1.insert_text((40, 36), "NIYAMORA", fontsize=18, color=(1, 1, 1), fontname="helv")
        page1.insert_text((150, 36), "|  PACKAGING COMPLIANCE BEFORE PRINT", fontsize=10, color=(0.4, 0.8, 0.6), fontname="helv")

        # Subtitle
        page1.insert_text((40, 95), f"STATUTORY PACKAGING INSPECTION REPORT ({version_label})", fontsize=13, color=(0.1, 0.15, 0.3), fontname="helv")

        # Product Metadata Box
        page1.draw_rect(fitz.Rect(40, 110, 555, 185), color=(0.85, 0.88, 0.92), fill=(0.96, 0.97, 0.99))
        page1.insert_text((55, 128), f"Product Name:  {product.name}", fontsize=11, color=(0.1, 0.1, 0.1), fontname="helv")
        page1.insert_text((55, 145), f"Brand:  {product.brand}  |  Category: {product.category}  |  Packaging Type: {product.packaging_type}", fontsize=9, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((55, 161), f"Artwork Version: {version_label}  |  Inspection Status: {inspection.status}", fontsize=9, color=(0.1, 0.5, 0.3), fontname="helv")
        page1.insert_text((55, 176), f"Inspected: {inspection.created_at.strftime('%d %B %Y, %H:%M UTC') if inspection.created_at else 'Recent'}  |  Verdict: {inspection.compliance_verdict or 'REVIEW'}", fontsize=8, color=(0.4, 0.4, 0.4), fontname="helv")

        # Verification Summary Box
        page1.draw_rect(fitz.Rect(40, 195, 555, 245), color=(0.2, 0.5, 0.4), fill=(0.95, 0.99, 0.96))
        page1.insert_text((55, 212), "COMPLIANCE EVALUATION SUMMARY:", fontsize=9, color=(0.05, 0.4, 0.25), fontname="helv")
        summary_str = f"Result: {counts['PASS']} Passed · {counts['ISSUE']} Issues · {counts['REVIEW']} Need Review · {counts['N/A']} Not Applicable"
        page1.insert_text((55, 230), summary_str, fontsize=9, color=(0.1, 0.1, 0.1), fontname="helv")

        # Section: Evaluated Checks List
        page1.insert_text((40, 265), "EVALUATED PACKAGING CHECKS", fontsize=11, color=(0.1, 0.15, 0.3), fontname="helv")

        y_cursor = 280
        for idx, ev in enumerate(evals[:6], 1):
            status_color = (0.05, 0.5, 0.2) if ev.status == "PASS" else (0.8, 0.2, 0.1) if ev.status == "ISSUE" else (0.8, 0.5, 0.1)
            page1.draw_rect(fitz.Rect(40, y_cursor, 555, y_cursor + 44), color=(0.9, 0.9, 0.9), fill=(1, 1, 1))
            r_title = ev.rule_version.title if ev.rule_version else "Packaging Rule Requirement"
            r_code = ev.rule_version.rule_code if ev.rule_version else "LMPC"
            page1.insert_text((50, y_cursor + 14), f"{idx}. {r_title} ({r_code})", fontsize=8.5, color=(0.1, 0.15, 0.3), fontname="helv")
            page1.insert_text((460, y_cursor + 14), f"[{ev.status}]", fontsize=8.5, color=status_color, fontname="helv")
            page1.insert_text((50, y_cursor + 28), f"Observed: \"{ev.observed_value or 'Not detected'}\"", fontsize=7.5, color=(0.2, 0.2, 0.2), fontname="helv")
            page1.insert_text((50, y_cursor + 38), f"{ev.explanation[:105]}...", fontsize=7, color=(0.4, 0.4, 0.4), fontname="helv")
            y_cursor += 48

        # Section: Statutory Citations
        page1.insert_text((40, y_cursor + 12), "APPLICABLE STATUTORY CITATIONS", fontsize=9.5, color=(0.2, 0.2, 0.2), fontname="helv")
        page1.insert_text((40, y_cursor + 25), "• Legal Metrology (Packaged Commodities) Rules, 2011 (G.S.R. 202(E))", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((40, y_cursor + 36), "• Legal Metrology (Packaged Commodities) Amendment Rules, 2021 (G.S.R. 779(E))", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")

        # Regulatory Disclaimer
        page1.draw_rect(fitz.Rect(40, 745, 555, 815), color=(0.8, 0.8, 0.8), fill=(0.96, 0.96, 0.96))
        page1.insert_text((50, 760), "REGULATORY & LEGAL DISCLAIMER:", fontsize=8, color=(0.6, 0.2, 0.1), fontname="helv")
        page1.insert_text((50, 774), "This document is a pre-print design verification summary under Legal Metrology Rules.", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((50, 786), "It is not a statutory certification or government certificate. Final compliance rests with the packaging entity.", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")

        # --- PAGE 2+: ARTWORK VISUAL PACKSHOTS (Multi-Panel Aware) ---
        panels = version.panels if (version and version.panels) else []
        if not panels:
            panels = [
                ArtworkPanel(
                    panel_type="FRONT",
                    file_path=version.preview_image_path or version.file_path if version else None
                )
            ]

        total_pages = 1 + len(panels)
        for p_idx, p in enumerate(panels, 1):
            p_page = doc.new_page(width=595, height=842)
            p_page.draw_rect(fitz.Rect(0, 0, 595, 50), color=None, fill=(0.06, 0.09, 0.16))
            p_page.insert_text((40, 32), f"UPLOADED PACKAGING ARTWORK: {p.panel_type} PANEL", fontsize=12, color=(1, 1, 1), fontname="helv")
            p_page.insert_text((440, 32), f"Version: {version_label}", fontsize=10, color=(0.4, 0.8, 0.6), fontname="helv")

            p_path = p.file_path
            embedded = False
            if p_path and os.path.exists(p_path):
                try:
                    img_rect = fitz.Rect(60, 70, 535, 740)
                    p_page.insert_image(img_rect, filename=p_path, keep_proportion=True)
                    embedded = True
                except Exception as e:
                    logger.warning(f"Could not embed image {p_path} into PDF: {e}")

            if not embedded:
                p_page.draw_rect(fitz.Rect(60, 70, 535, 740), color=(0.8, 0.8, 0.8), fill=(0.95, 0.95, 0.95))
                p_page.insert_text((200, 400), "Artwork could not be loaded.", fontsize=12, color=(0.4, 0.4, 0.4))

            p_page.insert_text((40, 810), f"NIYAMORA Compliance Inspection • {product.brand} ({product.name})", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")
            p_page.insert_text((480, 810), f"Page {1 + p_idx} of {total_pages}", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")

        pdf_bytes = doc.tobytes()
        doc.close()

        logger.info(f"Generated Inspection PDF for {inspection.id} ({len(pdf_bytes)} bytes, {total_pages} pages)")
        return pdf_bytes, filename

    @classmethod
    def generate_suggested_design_pdf(
        cls,
        db: Session,
        suggested_design_id: str
    ) -> Tuple[bytes, str]:
        suggested_design = db.query(SuggestedDesign).filter(SuggestedDesign.id == suggested_design_id).first()
        if not suggested_design:
            raise ValueError("SuggestedDesign not found")

        product = db.query(Product).filter(Product.id == suggested_design.product_id).first()
        if not product:
            raise ValueError("Product not found")

        source_ver = db.query(ArtworkVersion).filter(ArtworkVersion.id == suggested_design.source_artwork_version_id).first()
        source_insp = db.query(Inspection).filter(Inspection.id == suggested_design.source_inspection_id).first()
        val_insp = db.query(Inspection).filter(Inspection.id == suggested_design.validation_inspection_id).first() if suggested_design.validation_inspection_id else None

        source_evals = db.query(Evaluation).filter(Evaluation.inspection_id == source_insp.id).all() if source_insp else []
        val_evals = db.query(Evaluation).filter(Evaluation.inspection_id == val_insp.id).all() if val_insp else []

        src_counts = {"PASS": 0, "ISSUE": 0, "REVIEW": 0, "N/A": 0}
        for e in source_evals:
            src_counts[e.status] = src_counts.get(e.status, 0) + 1

        val_counts = {"PASS": 0, "ISSUE": 0, "REVIEW": 0, "N/A": 0}
        for e in val_evals:
            val_counts[e.status] = val_counts.get(e.status, 0) + 1

        safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', product.name).strip('_')
        if not safe_name:
            safe_name = "Product"
        filename = f"{safe_name}_NIYAMORA_Suggested_Design_{suggested_design.version_label}.pdf"

        doc = fitz.open()

        # --- PAGE 1: COVER & SUGGESTED DESIGN SUMMARY ---
        page1 = doc.new_page(width=595, height=842)

        # Header Bar
        page1.draw_rect(fitz.Rect(0, 0, 595, 60), color=None, fill=(0.06, 0.09, 0.16))
        page1.insert_text((40, 36), "NIYAMORA", fontsize=18, color=(1, 1, 1), fontname="helv")
        page1.insert_text((150, 36), "|  PACKAGING COMPLIANCE BEFORE PRINT", fontsize=10, color=(0.4, 0.8, 0.6), fontname="helv")

        # Subtitle
        page1.insert_text((40, 95), "SUGGESTED DESIGN COMPLIANCE REVIEW REPORT", fontsize=13, color=(0.1, 0.15, 0.3), fontname="helv")

        # Product Metadata Box
        page1.draw_rect(fitz.Rect(40, 110, 555, 185), color=(0.85, 0.88, 0.92), fill=(0.96, 0.97, 0.99))
        page1.insert_text((55, 128), f"Product Name:  {product.name}", fontsize=11, color=(0.1, 0.1, 0.1), fontname="helv")
        page1.insert_text((55, 145), f"Brand:  {product.brand}  |  Category: {product.category}  |  Packaging Type: {product.packaging_type}", fontsize=9, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((55, 161), f"Source Artwork: {source_ver.version_label if source_ver else 'V01'}  →  Suggested Candidate: {suggested_design.version_label}", fontsize=9, color=(0.1, 0.5, 0.3), fontname="helv")
        page1.insert_text((55, 176), f"Generated: {suggested_design.created_at.strftime('%d %B %Y, %H:%M UTC')}  |  Engine: {suggested_design.created_by}", fontsize=8, color=(0.4, 0.4, 0.4), fontname="helv")

        # Verification Summary Box
        page1.draw_rect(fitz.Rect(40, 195, 555, 245), color=(0.2, 0.5, 0.4), fill=(0.95, 0.99, 0.96))
        page1.insert_text((55, 212), "VERIFICATION SUMMARY (Evaluated Statutory Checks):", fontsize=9, color=(0.05, 0.4, 0.25), fontname="helv")
        src_str = f"Original ({source_ver.version_label if source_ver else 'V01'}): {src_counts['PASS']} PASS, {src_counts['ISSUE']} ISSUE, {src_counts['REVIEW']} REVIEW"
        val_str = f"Suggested ({suggested_design.version_label}): {val_counts['PASS']} PASS, {val_counts['ISSUE']} ISSUE, {val_counts['REVIEW']} REVIEW"
        page1.insert_text((55, 226), src_str, fontsize=8.5, color=(0.2, 0.2, 0.2), fontname="helv")
        page1.insert_text((55, 238), val_str, fontsize=8.5, color=(0.05, 0.45, 0.2), fontname="helv")

        # Section: Structured Statutory Corrections List
        page1.insert_text((40, 265), "STRUCTURED SUGGESTED ADJUSTMENTS", fontsize=11, color=(0.1, 0.15, 0.3), fontname="helv")

        y_cursor = 280
        changes = suggested_design.change_set or []
        for idx, chg in enumerate(changes[:5], 1):
            page1.draw_rect(fitz.Rect(40, y_cursor, 555, y_cursor + 48), color=(0.9, 0.9, 0.9), fill=(1, 1, 1))
            page1.insert_text((50, y_cursor + 14), f"{idx}. {chg.get('field_name', 'Declaration')} ({chg.get('rule_code', '')})", fontsize=8.5, color=(0.05, 0.45, 0.3), fontname="helv")
            page1.insert_text((50, y_cursor + 27), f"Original: \"{chg.get('original_value', 'N/A')}\"  →  Suggested: \"{chg.get('suggested_value', 'Compliant')}\"", fontsize=7.5, color=(0.15, 0.15, 0.15), fontname="helv")
            page1.insert_text((50, y_cursor + 40), f"Rationale: {chg.get('reason', '')[:110]}...", fontsize=7, color=(0.4, 0.4, 0.4), fontname="helv")
            y_cursor += 52

        # Section: Statutory Legal References
        page1.insert_text((40, y_cursor + 12), "APPLICABLE STATUTORY CITATIONS", fontsize=9.5, color=(0.2, 0.2, 0.2), fontname="helv")
        page1.insert_text((40, y_cursor + 25), "• Legal Metrology (Packaged Commodities) Rules, 2011 (G.S.R. 202(E), dated 07.03.2011)", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((40, y_cursor + 36), "• Legal Metrology (Packaged Commodities) Amendment Rules, 2021 (G.S.R. 779(E), Unit Sale Price Rule 6(11) & MRP Rule 6(1)(e))", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((40, y_cursor + 47), "• Legal Metrology (Packaged Commodities) Amendment Rules, 2017 (Country of Origin Rule 6(1)(aa))", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")

        # Mandatory Regulatory Disclaimer Box
        page1.draw_rect(fitz.Rect(40, 745, 555, 815), color=(0.8, 0.8, 0.8), fill=(0.96, 0.96, 0.96))
        page1.insert_text((50, 760), "REGULATORY & LEGAL DISCLAIMER:", fontsize=8, color=(0.6, 0.2, 0.1), fontname="helv")
        page1.insert_text((50, 774), "This document is a design assistance and compliance review artifact. It is not a government certificate, approval,", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((50, 786), "or legal certification. Final regulatory and production decisions remain with the responsible product owner and relevant authorities.", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")
        page1.insert_text((50, 798), "Deterministic inspection completed by NIYAMORA against evaluated statutory rules.", fontsize=7, color=(0.4, 0.4, 0.4), fontname="helv")

        # --- PAGE 2: ARTWORK VISUAL PACKSHOT & PREVIEW ---
        page2 = doc.new_page(width=595, height=842)
        page2.draw_rect(fitz.Rect(0, 0, 595, 50), color=None, fill=(0.06, 0.09, 0.16))
        page2.insert_text((40, 32), "NIYAMORA SUGGESTED ARTWORK PREVIEW", fontsize=13, color=(1, 1, 1), fontname="helv")
        page2.insert_text((420, 32), f"Version: {suggested_design.version_label}", fontsize=10, color=(0.4, 0.8, 0.6), fontname="helv")

        rendered_path = suggested_design.rendered_artwork_reference
        if rendered_path and os.path.exists(rendered_path):
            try:
                img_rect = fitz.Rect(60, 70, 535, 740)
                page2.insert_image(img_rect, filename=rendered_path, keep_proportion=True)
            except Exception as e:
                logger.warning(f"Could not embed rendered image into PDF: {e}")
                page2.draw_rect(fitz.Rect(60, 70, 535, 740), color=(0.8, 0.8, 0.8), fill=(0.95, 0.95, 0.95))
                page2.insert_text((200, 400), "Artwork could not be loaded.", fontsize=12, color=(0.4, 0.4, 0.4))
        else:
            page2.draw_rect(fitz.Rect(60, 70, 535, 740), color=(0.8, 0.8, 0.8), fill=(0.95, 0.95, 0.95))
            page2.insert_text((200, 400), "Artwork could not be loaded.", fontsize=12, color=(0.4, 0.4, 0.4))

        page2.insert_text((40, 810), f"NIYAMORA Compliance Review • Generated for {product.brand} ({product.name})", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")
        page2.insert_text((500, 810), "Page 2 of 2", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")

        pdf_bytes = doc.tobytes()
        doc.close()

        # Record Audit Event
        audit = AuditEvent(
            company_id=product.company_id,
            action="PDF_EXPORTED",
            entity_type="SUGGESTED_DESIGN",
            entity_id=suggested_design.id,
            details={"filename": filename, "bytes": len(pdf_bytes)}
        )
        db.add(audit)
        db.commit()

        logger.info(f"Generated Suggested Design PDF for {suggested_design.id} ({len(pdf_bytes)} bytes)")
        return pdf_bytes, filename
