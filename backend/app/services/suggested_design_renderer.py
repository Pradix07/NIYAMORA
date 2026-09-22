import os
import io
import re
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from PIL import Image, ImageDraw, ImageFont
import fitz  # PyMuPDF
from sqlalchemy.orm import Session
from app.models.suggested_design import SuggestedDesign, AuditEvent
from app.models.artwork import Artwork
from app.models.artwork_version import ArtworkVersion
from app.models.artwork_panel import ArtworkPanel
from app.models.product import Product
from app.storage.local import storage

logger = logging.getLogger("niyamora.suggested_design_renderer")

class SuggestedDesignRenderer:
    """
    Controlled rendering engine that transforms original packaging artwork
    into a high-precision NIYAMORA Suggested Design (V02).
    
    Principles:
    1. Preserves original packaging artwork (branding, logo, graphics, dielines, unchanged panels).
    2. Multi-panel aware: applies corrections ONLY to target panels (e.g. Back); unchanged panels remain identical.
    3. NEVER burns diagnostic or UI labels into the exported artwork.
    4. Produces a multi-page PDF containing all panels in order.
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

        next_ver_num = source_version.version_number + 1
        storage_dir = Path(storage.base_dir) / "companies" / product.company_id / "products" / product.id / "artworks" / artwork.id / f"v{next_ver_num:02d}"
        storage_dir.mkdir(parents=True, exist_ok=True)

        safe_prod_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', product.name).strip('_')
        if not safe_prod_name:
            safe_prod_name = "Product"

        # 1. Retrieve all panels from source version
        source_panels = (
            db.query(ArtworkPanel)
            .filter(ArtworkPanel.artwork_version_id == source_version.id)
            .order_by(ArtworkPanel.created_at.asc())
            .all()
        )

        if not source_panels:
            # Fallback single panel
            source_panels = [
                ArtworkPanel(
                    id=f"panel_{source_version.id[:8]}",
                    artwork_version_id=source_version.id,
                    panel_type="FRONT",
                    file_path=source_version.file_path,
                    original_filename=source_version.original_filename,
                    mime_type=source_version.mime_type,
                    file_size_bytes=source_version.file_size_bytes
                )
            ]

        # 2. Create the new ArtworkVersion (V02) record
        primary_filename = f"{safe_prod_name}_NIYAMORA_Suggestion_V{next_ver_num:02d}.png"
        primary_rendered_path = str(storage_dir / primary_filename)

        suggested_version = ArtworkVersion(
            artwork_id=artwork.id,
            version_number=next_ver_num,
            file_path=primary_rendered_path,
            original_filename=primary_filename,
            mime_type="image/png",
            file_size_bytes=0,
            preview_image_path=primary_rendered_path,
            processing_status="COMPLETED"
        )
        db.add(suggested_version)
        db.commit()
        db.refresh(suggested_version)

        rendered_panel_images: List[Tuple[str, Image.Image, str]] = []  # (panel_type, PIL_Image, file_path)

        # 3. Process each panel individually
        for idx, s_panel in enumerate(source_panels):
            p_type = s_panel.panel_type or ("FRONT" if idx == 0 else "BACK")
            p_image = cls._load_panel_image(s_panel.file_path, s_panel.mime_type, product)

            # Check if any change in change_set applies to this panel
            relevant_changes = [
                c for c in suggested_design.change_set
                if c.get("status") not in ["REVIEW_REQUIRED", "PENDING"]
                and (
                    (c.get("target_panel") and c.get("target_panel").upper() == p_type.upper())
                    or (not c.get("target_panel") and p_type.upper() in ["BACK", "FRONT"])
                )
            ]

            if relevant_changes:
                # Apply verified corrections cleanly without burning diagnostic labels
                modified_img = cls._apply_corrections_cleanly(p_image, relevant_changes)
            else:
                # Panel is unchanged; keep original image exactly
                modified_img = p_image.copy()

            # Save panel image
            panel_filename = f"{safe_prod_name}_V{next_ver_num:02d}_{p_type.lower()}.png"
            panel_path = str(storage_dir / panel_filename)
            modified_img.save(panel_path, format="PNG", quality=95)
            panel_size = os.path.getsize(panel_path)

            if idx == 0:
                # Also save as primary version path
                modified_img.save(primary_rendered_path, format="PNG", quality=95)
                suggested_version.file_size_bytes = os.path.getsize(primary_rendered_path)
                suggested_version.width = modified_img.width
                suggested_version.height = modified_img.height

            # Register ArtworkPanel for V02
            new_panel = ArtworkPanel(
                artwork_version_id=suggested_version.id,
                panel_type=p_type,
                file_path=panel_path,
                original_filename=panel_filename,
                mime_type="image/png",
                file_size_bytes=panel_size
            )
            db.add(new_panel)
            rendered_panel_images.append((p_type, modified_img, panel_path))

        db.commit()
        db.refresh(suggested_version)

        # 4. Generate multi-page vector-wrapped PDF containing all panels in order
        pdf_filename = f"{safe_prod_name}_NIYAMORA_Suggested_Design_V{next_ver_num:02d}.pdf"
        pdf_path = str(storage_dir / pdf_filename)
        cls._create_multi_panel_pdf(rendered_panel_images, pdf_path, product, suggested_design.version_label)

        # 5. Update SuggestedDesign entity
        suggested_design.suggested_artwork_version_id = suggested_version.id
        suggested_design.rendered_artwork_reference = primary_rendered_path
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
                "rendered_path": primary_rendered_path,
                "panels_rendered": len(rendered_panel_images),
                "pdf_path": pdf_path
            }
        )
        db.add(audit)
        db.commit()

        logger.info(f"Rendered SuggestedDesign {suggested_design.id} -> ArtworkVersion {suggested_version.id} ({suggested_version.version_label}) with {len(rendered_panel_images)} panel(s)")
        return suggested_design

    @classmethod
    def _load_panel_image(cls, file_path: Optional[str], mime_type: Optional[str], product: Product) -> Image.Image:
        """Safely loads panel image from file path or PDF page."""
        if not file_path or not os.path.exists(file_path):
            return cls._create_default_packaging_canvas(product)

        is_pdf = (mime_type == "application/pdf") or file_path.lower().endswith(".pdf")
        if is_pdf:
            try:
                doc = fitz.open(file_path)
                if len(doc) > 0:
                    page = doc[0]
                    pix = page.get_pixmap(dpi=150)
                    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
                    doc.close()
                    return img
                doc.close()
            except Exception as e:
                logger.warning(f"Could not extract image from PDF {file_path}: {e}")

        try:
            return Image.open(file_path).convert("RGB")
        except Exception as e:
            logger.warning(f"Could not open image {file_path}: {e}")
            return cls._create_default_packaging_canvas(product)

    @classmethod
    def _apply_corrections_cleanly(cls, base_image: Image.Image, changes: List[Dict[str, Any]]) -> Image.Image:
        """
        Applies only the exact verified statutory corrections to the artwork canvas.
        NEVER renders diagnostic watermarks, badge boxes, or UI markers into the image.
        """
        rendered = base_image.copy()
        draw = ImageDraw.Draw(rendered)
        img_w, img_h = rendered.size

        try:
            font_text = ImageFont.truetype("arialbd.ttf", size=max(12, int(img_h * 0.018)))
            font_regular = ImageFont.truetype("arial.ttf", size=max(11, int(img_h * 0.016)))
        except Exception:
            font_text = ImageFont.load_default()
            font_regular = ImageFont.load_default()

        for change in changes:
            suggested_val = change.get("suggested_value", "").strip()
            if not suggested_val:
                continue

            loc = change.get("suggested_location") or change.get("original_location") or {}
            x_pct = float(loc.get("x", 10))
            y_pct = float(loc.get("y", 75))
            w_pct = float(loc.get("width", 80))
            h_pct = float(loc.get("height", 10))

            px_x = int((x_pct / 100.0) * img_w)
            px_y = int((y_pct / 100.0) * img_h)
            px_w = max(int((w_pct / 100.0) * img_w), 140)
            px_h = max(int((h_pct / 100.0) * img_h), 28)

            # Clamp coordinates safely
            px_x = max(10, min(px_x, img_w - px_w - 10))
            px_y = max(10, min(px_y, img_h - px_h - 10))

            # Clean background patch matching packaging tone (or neutral clean box)
            draw.rectangle(
                [px_x, px_y, px_x + px_w, px_y + px_h],
                fill=(255, 255, 255),
                outline=None
            )

            # Render statutory declaration text cleanly without diagnostic badges
            lines = suggested_val.split("\n")
            line_y = px_y + 4
            for line in lines:
                draw.text((px_x + 6, line_y), line, fill=(15, 23, 42), font=font_text)
                line_y += int(img_h * 0.020)

        return rendered

    @classmethod
    def _create_default_packaging_canvas(cls, product: Product) -> Image.Image:
        """Creates a minimal canvas indicating artwork could not be loaded."""
        img = Image.new("RGB", (800, 1100), color=(245, 245, 245))
        draw = ImageDraw.Draw(img)
        draw.rectangle([40, 40, 760, 1060], outline=(200, 200, 200), width=1)
        draw.text((60, 100), "Artwork could not be loaded.", fill=(120, 120, 120))
        return img

    @classmethod
    def _create_multi_panel_pdf(
        cls,
        panel_images: List[Tuple[str, Image.Image, str]],
        output_pdf_path: str,
        product: Product,
        version_label: str
    ) -> None:
        """Creates a clean multi-page vector-wrapped PDF containing all panels in order."""
        doc = fitz.open()

        for panel_type, img, _ in panel_images:
            img_bytes = io.BytesIO()
            img.save(img_bytes, format="PNG")
            img_bytes.seek(0)

            # Fit to A4
            page = doc.new_page(width=595, height=842)
            rect = fitz.Rect(40, 40, 555, 802)
            page.insert_image(rect, stream=img_bytes.getvalue(), keep_proportion=True)

        doc.save(output_pdf_path)
        doc.close()
