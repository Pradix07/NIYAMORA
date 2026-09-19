from datetime import datetime
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(255), nullable=False)
    category = Column(String(100), default="Food & Beverage", nullable=False)
    packaging_type = Column(String(100), default="Stand-Up Pouch", nullable=False)
    sku = Column(String(100), nullable=False, index=True)
    net_quantity = Column(String(50), default="250 g", nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="products")
    artworks = relationship("Artwork", back_populates="product", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="product", cascade="all, delete-orphan")
