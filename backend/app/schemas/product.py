from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    brand: str
    category: str = "Food & Beverage"
    packaging_type: str = "Stand-Up Pouch"
    sku: str
    net_quantity: Optional[str] = None
    description: Optional[str] = None

class ProductCreate(ProductBase):
    company_id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    packaging_type: Optional[str] = None
    sku: Optional[str] = None
    net_quantity: Optional[str] = None
    description: Optional[str] = None

class ProductRead(ProductBase):
    id: str
    company_id: str
    created_at: datetime
    updated_at: datetime
    latest_version: Optional[str] = "V01"
    version_count: Optional[int] = 1
    inspection_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
