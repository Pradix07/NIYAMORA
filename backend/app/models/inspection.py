from datetime import datetime
import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    artwork_version_id = Column(String(36), ForeignKey("artwork_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Inspection Status: QUEUED -> PROCESSING -> COMPLETED -> FAILED
    status = Column(String(50), default="QUEUED", nullable=False, index=True)
    current_stage = Column(String(100), default="INIT", nullable=False)
    
    # Precheck Quality Output
    quality_verdict = Column(String(50), nullable=True) # GOOD, REVIEW, POOR
    quality_score = Column(Float, nullable=True)
    quality_details = Column(JSON, nullable=True)
    
    # Structured Extraction (Extraction only - NO legal compliance PASS/ISSUE decisions in Phase 2)
    extracted_data = Column(JSON, nullable=True)
    
    # Lifecycle Timestamps & Errors
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    product = relationship("Product", back_populates="inspections")
    artwork_version = relationship("ArtworkVersion", back_populates="inspections")
