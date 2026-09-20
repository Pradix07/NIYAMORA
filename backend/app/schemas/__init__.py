from app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.schemas.artwork import ArtworkCreate, ArtworkRead, ArtworkVersionRead
from app.schemas.inspection import (
    InspectionCreate,
    InspectionRead,
    QualityReport,
    QualityDetail,
    BoundingBoxCoord,
    TextBlock,
    ExtractedField,
    ExtractionResult,
)
from app.schemas.suggested_design import (
    SuggestedDesignChange,
    SuggestedDesignRead,
    ComparisonResultRead,
    RegressionResultRead,
    SimulationRequest,
    SimulationResponse,
    RiskMapResponse,
    RiskMapItem,
)
from app.schemas.auth import (
    UserSignup,
    UserLogin,
    UserResponse,
    TokenResponse,
)

__all__ = [
    "UserSignup",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
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
    "SuggestedDesignChange",
    "SuggestedDesignRead",
    "ComparisonResultRead",
    "RegressionResultRead",
    "SimulationRequest",
    "SimulationResponse",
    "RiskMapResponse",
    "RiskMapItem",
]
