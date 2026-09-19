from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

class QualityDetail(BaseModel):
    metric: str
    value: Any
    verdict: str  # GOOD, REVIEW, POOR
    message: str

class QualityReport(BaseModel):
    verdict: str  # GOOD, REVIEW, POOR
    score: float  # 0.0 - 1.0
    estimated_dpi: Optional[float] = None
    width: int
    height: int
    is_pdf: bool = False
    details: list[QualityDetail] = []
    warnings: list[str] = []

class BoundingBoxCoord(BaseModel):
    x: float      # percentage 0-100
    y: float      # percentage 0-100
    width: float  # percentage 0-100
    height: float # percentage 0-100
    label: Optional[str] = None

class TextBlock(BaseModel):
    id: str
    text: str
    confidence: Optional[float] = None
    bbox: list[float]  # [x1, y1, x2, y2] raw
    normalized_box: BoundingBoxCoord
    category_guess: Optional[str] = None

class ExtractedField(BaseModel):
    field_key: str
    field_name: str
    extracted_value: Optional[str] = None
    status: str  # EXTRACTED, NOT_FOUND, UNCERTAIN, UNAVAILABLE
    confidence: Optional[float] = None
    evidence_box: Optional[BoundingBoxCoord] = None
    source: str = "OCR"

class ExtractionResult(BaseModel):
    raw_text: str
    total_blocks: int
    blocks: list[TextBlock] = []
    fields: dict[str, ExtractedField] = {}
    phase_note: str = "Phase 2 Structured Extraction Complete. Legal Metrology & FSSAI rule compliance evaluation pending in Phase 3."

class InspectionCreate(BaseModel):
    product_id: str
    artwork_version_id: str

class InspectionRead(BaseModel):
    id: str
    product_id: str
    artwork_version_id: str
    status: str
    current_stage: str
    quality_verdict: Optional[str] = None
    quality_score: Optional[float] = None
    quality_details: Optional[dict[str, Any]] = None
    extracted_data: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
