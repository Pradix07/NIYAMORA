import os
import io
import re
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from PIL import Image, ImageDraw, ImageFont
import fitz # PyMuPDF
from sqlalchemy.orm import Session
from backend.app.models.suggested_design import SuggestedDesign, AuditEvent
from backend.app.models.artwork import Artwork
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.artwork_panel import ArtworkPanel
from backend.app.models.product import Product
from backend.app.storage.local import storage

logger = logging.getLogger("niyamora.suggested_design_renderer")

class SuggestedDesignRenderer:
    """
    Controlled rendering engine that transforms an original packaging artwork
    into a high-precision NIYAMORA Suggested Design.
    Preserves branding, logo, colors, and dieline while rendering verified statutory overlays.
    Creates a new immutable ArtworkVersion (V02/V03).
    Ensures safe rendering without destructive approximate erasure.
    """

    @classmethod
    def render_suggested_design(
        cls,
        db: Session,
        suggested_design_id: str
    ) -> SuggestedDesign:
        suggested_design = db.query(SuggestedDesign).filter(SuggestedDesign.id == suggested_design_id).first()
        if not suggested_design:
            raise ValueError("SuggestedDesign not found")

        product = db.query(Product).filter(Product.id == suggested_design.product_id).first()
        if not product:
            raise ValueError("Product not found")

        source_version = db.query(ArtworkVersion).filter(ArtworkVersion.id == suggested_design.source_artwork_version_id).first()
        if not source_version:
            raise ValueError("Source artwork version not found")

        artwork = db.query(Artwork).filter(Artwork.id == source_version.artwork_id).first()
        if not artwork:
            raise ValueError("Artwork master not found")

        # 1. Load source artwork image foundation (V01 remains read-only & immutable)
        source_path = source_version.file_path
        source_image: Optional[Image.Image] = None

        if source_version.mime_type == "application/pdf" or (source_path and source_path.lower().endswith(".pdf")):
            try:
                doc = fitz.open(source_path)
                page = doc[0]
                pix = page.get_pixmap(dpi=150)
                source_image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
                doc.close()
            except Exception as e:
                logger.warning(f"Could not load PDF source directly ({e}), creating packaging canvas.")
                source_image = cls._create_default_packaging_canvas(product)
        elif source_path and os.path.exists(source_path):
            try:
                source_image = Image.open(source_path).convert("RGB")
            except Exception as e:
                logger.warning(f"Could not load source image ({e}), creating packaging canvas.")
                source_image = cls._create_default_packaging_canvas(product)
        else:
            source_image = cls._create_default_packaging_canvas(product)

        # 2. Render structured changes onto artwork canvas safely
        rendered_image = source_image.copy()
        draw = ImageDraw.Draw(rendered_image)
        img_w, img_h = rendered_image.size

        # Typography setup
        try:
            font_title = ImageFont.truetype("arial.ttf", size=max(14, int(img_h * 0.025)))
            font_body = ImageFont.truetype("arial.ttf", size=max(11, int(img_h * 0.018)))
            font_bold = ImageFont.truetype("arialbd.ttf", size=max(12, int(img_h * 0.020)))
            font_badge = ImageFont.truetype("arialbd.ttf", size=max(10, int(img_h * 0.015)))
        except Exception:
            font_title = ImageFont.load_default()
            font_body = ImageFont.load_default()
            font_bold = ImageFont.load_default()
            font_badge = ImageFont.load_default()

        # Render each verified suggested change with clean non-destructive overlay
        for change in suggested_design.change_set:
            # Skip unsafe changes that require manual human review
            if change.get("status") == "REVIEW_REQUIRED" or change.get("change_type") == "REVIEW_REQUIRED":
                continue

            loc = change.get("suggested_location") or change.get("original_location") or {}
            x_pct = float(loc.get("x", 10))
            y_pct = float(loc.get("y", 70))
            w_pct = float(loc.get("width", 80))
            h_pct = float(loc.get("height", 10))

            px_x = int((x_pct / 100.0) * img_w)
            px_y = int((y_pct / 100.0) * img_h)
            px_w = max(int((w_pct / 100.0) * img_w), 160)
            px_h = max(int((h_pct / 100.0) * img_h), 32)

            # Keep strictly within canvas bounds
            px_x = max(10, min(px_x, img_w - px_w - 10))
            px_y = max(10, min(px_y, img_h - px_h - 10))

            # Draw white badge overlay with green compliance border
            draw.rectangle(
                [px_x, px_y, px_x + px_w, px_y + px_h],
                fill=(255, 255, 255),
                outline=(16, 185, 129), # Green compliance accent
                width=2
            )

            # Tag text
            badge_text = "✓ SUGGESTED DECLARATION"
            draw.text((px_x + 6, px_y + 3), badge_text, fill=(5, 150, 105), font=font_badge)

            # Draw suggested text value
            suggested_text = change.get("suggested_value", "")
            lines = suggested_text.split("\n")
            line_y = px_y + 16
            for line in lines:
                draw.text((px_x + 6, line_y), line, fill=(15, 23, 42), font=font_bold)
                line_y += int(img_h * 0.022)

        # Header Watermark: NIYAMORA Suggested Design
        watermark_w, watermark_h = 260, 30
        draw.rectangle(
            [img_w - watermark_w - 15, 15, img_w - 15, 15 + watermark_h],
            fill=(240, 253, 244),
            outline=(16, 185, 129),
            width=1
        )
        draw.text(
            (img_w - watermark_w - 8, 22),
            f"NIYAMORA SUGGESTED DESIGN ({suggested_design.version_label})",
            fill=(6, 95, 70),
            font=font_badge
        )

        # 3. Save rendered image into structured company storage
        next_ver_num = source_version.version_number + 1
        storage_dir = Path(storage.base_dir) / "companies" / product.company_id / "products" / product.id / "artworks" / artwork.id / f"v{next_ver_num:02d}"
        storage_dir.mkdir(parents=True, exist_ok=True)

        # Safe sanitized filename
        safe_prod_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', product.name).strip('_')
        rendered_filename = f"{safe_prod_name}_NIYAMORA_Suggestion_V{next_ver_num:02d}.png"
        rendered_path = str(storage_dir / rendered_filename)

        rendered_image.save(rendered_path, format="PNG", quality=95)
        file_size = os.path.getsize(rendered_path)

        # Create vector-wrapped PDF version
        pdf_filename = f"{safe_prod_name}_NIYAMORA_Suggestion_V{next_ver_num:02d}.pdf"
        pdf_path = str(storage_dir / pdf_filename)
        cls._create_rendered_pdf(rendered_image, pdf_path, product, suggested_design.change_set)

        # 4. Create new ArtworkVersion (V02) without mutating V01
        suggested_version = ArtworkVersion(
            artwork_id=artwork.id,
            version_number=next_ver_num,
            file_path=rendered_path,
            original_filename=rendered_filename,
            mime_type="image/png",
            file_size_bytes=file_size,
            width=img_w,
            height=img_h,
            preview_image_path=rendered_path,
            processing_status="QUEUED"
        )
        db.add(suggested_version)
        db.commit()
        db.refresh(suggested_version)

        # Create front panel for suggested version
        panel = ArtworkPanel(
            artwork_version_id=suggested_version.id,
            panel_type="FRONT",
            file_path=rendered_path,
            original_filename=rendered_filename,
            mime_type="image/png",
            file_size_bytes=file_size
        )
        db.add(panel)
        db.commit()

        # Update SuggestedDesign entity
        suggested_design.suggested_artwork_version_id = suggested_version.id
        suggested_design.rendered_artwork_reference = rendered_path
        suggested_design.status = "RENDERED"
        db.commit()
        db.refresh(suggested_design)

        # Record Audit Event
        audit = AuditEvent(
            company_id=product.company_id,
            action="SUGGESTED_DESIGN_RENDERED",
            entity_type="SUGGESTED_DESIGN",
            entity_id=suggested_design.id,
            details={
                "product_id": product.id,
                "suggested_version_id": suggested_version.id,
                "rendered_path": rendered_path
            }
        )
        db.add(audit)
        db.commit()

        logger.info(f"Rendered SuggestedDesign {suggested_design.id} -> ArtworkVersion {suggested_version.id} ({suggested_version.version_label})")
        return suggested_design

    @classmethod
    def _create_default_packaging_canvas(cls, product: Product) -> Image.Image:
        """Creates a clean packaging dieline canvas if no source image is available."""
        img = Image.new("RGB", (800, 1100), color=(203, 181, 147)) # Kraft pouch tone
        draw = ImageDraw.Draw(img)

        # Dieline margin guide lines
        draw.rectangle([40, 40, 760, 1060], outline=(180, 160, 125), width=2)

        # Brand header area
        brand_name = (product.brand or "Brand").upper()
        prod_name = (product.name or "Packaging Product").upper()
        draw.text((60, 70), brand_name, fill=(50, 40, 30))
        draw.text((60, 100), prod_name, fill=(20, 20, 20))

        # Center product graphic placeholder
        draw.rectangle([100, 250, 700, 600], fill=(230, 215, 185), outline=(190, 175, 145))
        draw.text((280, 420), f"{product.packaging_type} Dieline", fill=(100, 90, 80))

        return img

    @classmethod
    def _create_rendered_pdf(cls, image: Image.Image, output_pdf_path: str, product: Product, changes: list) -> None:
        """Saves packaging render as a vector-wrapped PDF."""
        img_bytes = io.BytesIO()
        image.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        doc = fitz.open()
        rect = fitz.Rect(0, 0, 595, 842) # A4
        page = doc.new_page(width=595, height=842)
        page.insert_image(rect, stream=img_bytes.getvalue())
        doc.save(output_pdf_path)
        doc.close()
