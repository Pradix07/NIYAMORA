from datetime import datetime
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), default="PACKAGING_ARTWORK", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    product = relationship("Product", back_populates="artworks")
    versions = relationship("ArtworkVersion", back_populates="artwork", cascade="all, delete-orphan", order_by="ArtworkVersion.version_number")
