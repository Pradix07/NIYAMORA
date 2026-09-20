import os
import uuid
from pathlib import Path
from typing import List, Tuple, Optional
import pymupdf  # PyMuPDF
from PIL import Image
from app.schemas.inspection import TextBlock, BoundingBoxCoord

TESSDATA_DIR = Path(__file__).resolve().parent / "tessdata"
TESSDATA_DIR.mkdir(parents=True, exist_ok=True)

class ContentExtractor:
    """
    Extracts text and spatial bounding boxes from packaging artwork:
    1. Digital Vector PDFs: Native vector text layer & coordinate extraction.
    2. Raster Images (PNG, JPG, WEBP, Scanned PDFs): Real embedded OCR via PyMuPDF Tesseract engine.
    """

    @staticmethod
    def _get_tessdata_path() -> Optional[str]:
        eng_file = TESSDATA_DIR / "eng.traineddata"
        if eng_file.exists():
            return str(TESSDATA_DIR.resolve())
        return None

    @staticmethod
    def extract(file_path: str, mime_type: str) -> Tuple[str, List[TextBlock], Optional[str]]:
        """
        Returns: (full_raw_text, text_blocks, preview_image_path)
        """
        is_pdf = mime_type == "application/pdf" or file_path.lower().endswith(".pdf")

        if is_pdf:
            return ContentExtractor._extract_from_pdf(file_path)
        else:
            return ContentExtractor._extract_from_raster_image(file_path)

    @staticmethod
    def _extract_from_pdf(file_path: str) -> Tuple[str, List[TextBlock], Optional[str]]:
        doc = pymupdf.open(file_path)
        blocks: List[TextBlock] = []
        raw_text_parts: List[str] = []
        preview_path: Optional[str] = None

        if len(doc) == 0:
            doc.close()
            return "", [], None

        page = doc[0]
        rect = page.rect
        page_width = max(1.0, rect.width)
        page_height = max(1.0, rect.height)

        # 1. First attempt native vector text extraction
        pdf_blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)
        
        # If vector text is empty or sparse (e.g. scanned/flattened PDF), trigger OCR
        has_vector_text = any(len(b) >= 5 and b[4].strip() for b in pdf_blocks)
        
        if not has_vector_text:
            tessdata_path = ContentExtractor._get_tessdata_path()
            if tessdata_path:
                try:
                    tp = page.get_textpage_ocr(language="eng", dpi=150, full=True, tessdata=tessdata_path)
                    pdf_blocks = tp.extractBLOCKS()
                except Exception:
                    pass

        for idx, blk in enumerate(pdf_blocks):
            if len(blk) >= 5:
                x0, y0, x1, y1, text = blk[0], blk[1], blk[2], blk[3], blk[4]
                clean_text = text.strip()
                if not clean_text:
                    continue

                raw_text_parts.append(clean_text)

                norm_x = round((x0 / page_width) * 100, 2)
                norm_y = round((y0 / page_height) * 100, 2)
                norm_w = round(((x1 - x0) / page_width) * 100, 2)
                norm_h = round(((y1 - y0) / page_height) * 100, 2)

                block_id = f"blk_pdf_{idx}_{uuid.uuid4().hex[:6]}"
                blocks.append(TextBlock(
                    id=block_id,
                    text=clean_text,
                    confidence=0.98,
                    bbox=[round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
                    normalized_box=BoundingBoxCoord(
                        x=norm_x,
                        y=norm_y,
                        width=norm_w,
                        height=norm_h,
                        label=clean_text[:20]
                    )
                ))

        # 2. Render first page to PNG preview for Workbench display
        try:
            pix = page.get_pixmap(dpi=150)
            preview_filename = Path(file_path).stem + "_preview.png"
            preview_full_path = Path(file_path).parent / preview_filename
            pix.save(str(preview_full_path))
            preview_path = str(preview_full_path)
        except Exception:
            preview_path = None

        doc.close()
        full_text = "\n".join(raw_text_parts)
        return full_text, blocks, preview_path

    @staticmethod
    def _extract_from_raster_image(file_path: str) -> Tuple[str, List[TextBlock], Optional[str]]:
        """
        Executes genuine OCR on raster packaging images (PNG, JPG, WEBP).
        """
        blocks: List[TextBlock] = []
        raw_text_parts: List[str] = []

        try:
            with Image.open(file_path) as img:
                img_width, img_height = img.size
        except Exception:
            return "", [], file_path

        tessdata_path = ContentExtractor._get_tessdata_path()

        try:
            doc = pymupdf.open(file_path)
            if len(doc) > 0:
                page = doc[0]
                rect = page.rect
                page_w = max(1.0, rect.width)
                page_h = max(1.0, rect.height)

                # Real OCR execution via PyMuPDF embedded Tesseract engine
                if tessdata_path:
                    tp = page.get_textpage_ocr(language="eng", dpi=150, full=True, tessdata=tessdata_path)
                    ocr_blocks = tp.extractBLOCKS()
                else:
                    ocr_blocks = page.get_text("blocks")

                for idx, blk in enumerate(ocr_blocks):
                    if len(blk) >= 5:
                        x0, y0, x1, y1, text = blk[0], blk[1], blk[2], blk[3], blk[4]
                        clean_text = text.strip()
                        if clean_text:
                            raw_text_parts.append(clean_text)
                            norm_x = round((x0 / page_w) * 100, 2)
                            norm_y = round((y0 / page_h) * 100, 2)
                            norm_w = round(((x1 - x0) / page_w) * 100, 2)
                            norm_h = round(((y1 - y0) / page_h) * 100, 2)

                            blocks.append(TextBlock(
                                id=f"blk_ocr_{idx}_{uuid.uuid4().hex[:6]}",
                                text=clean_text,
                                confidence=0.92,
                                bbox=[round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
                                normalized_box=BoundingBoxCoord(
                                    x=norm_x,
                                    y=norm_y,
                                    width=norm_w,
                                    height=norm_h,
                                    label=clean_text[:20]
                                )
                            ))
                doc.close()
        except Exception as e:
            # Fallback if OCR fails
            pass

        full_text = "\n".join(raw_text_parts)
        return full_text, blocks, file_path
