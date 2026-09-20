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
from backend.app.schemas.suggested_design import (
    SuggestedDesignChange,
    SuggestedDesignRead,
    ComparisonResultRead,
    RegressionResultRead,
    SimulationRequest,
    SimulationResponse,
    RiskMapResponse,
    RiskMapItem,
)
from backend.app.schemas.auth import (
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
