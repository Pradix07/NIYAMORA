from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ArtworkBase(BaseModel):
    name: str
    source_type: str = "PACKAGING_ARTWORK"

class ArtworkCreate(ArtworkBase):
    product_id: str

class ArtworkPanelRead(BaseModel):
    id: str
    artwork_version_id: str
    panel_type: str
    file_path: str
    original_filename: str
    mime_type: str
    file_size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ArtworkVersionRead(BaseModel):
    id: str
    artwork_id: str
    version_number: int
    version_label: str
    original_filename: str
    mime_type: str
    file_size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    page_count: Optional[int] = 1
    dpi: Optional[float] = None
    preview_image_path: Optional[str] = None
    processing_status: str
    created_at: datetime
    panels: list[ArtworkPanelRead] = []

    model_config = ConfigDict(from_attributes=True)

class ArtworkRead(ArtworkBase):
    id: str
    product_id: str
    created_at: datetime
    versions: list[ArtworkVersionRead] = []

    model_config = ConfigDict(from_attributes=True)
