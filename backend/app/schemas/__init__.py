from backend.app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from backend.app.schemas.artwork import ArtworkCreate, ArtworkRead, ArtworkVersionRead
from backend.app.schemas.inspection import (
    InspectionCreate,
    InspectionRead,
    QualityReport,
    QualityDetail,
    BoundingBoxCoord,
    TextBlock,
    ExtractedField,
    ExtractionResult,
)

__all__ = [
    "ProductCreate",
    "ProductUpdate",
    "ProductRead",
    "ArtworkCreate",
    "ArtworkRead",
    "ArtworkVersionRead",
    "InspectionCreate",
    "InspectionRead",
    "QualityReport",
    "QualityDetail",
    "BoundingBoxCoord",
    "TextBlock",
    "ExtractedField",
    "ExtractionResult",
]
