from datetime import datetime
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class SuggestedDesign(Base):
    """
    Represents a structured, compliance-guided design improvement iteration.
    Holds structured change sets, layout modifications, rendering references,
    and links to the automated re-validation inspection run.
    """
    __tablename__ = "suggested_designs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    source_artwork_version_id = Column(String(36), ForeignKey("artwork_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    source_inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_artwork_version_id = Column(String(36), ForeignKey("artwork_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    
    version_label = Column(String(50), default="V02", nullable=False)
    status = Column(String(50), default="GENERATED", nullable=False) # GENERATED, RENDERED, VERIFIED, APPLIED
    change_set = Column(JSON, default=list, nullable=False) # List of structured change objects
    rendered_artwork_reference = Column(String(1024), nullable=True) # File or preview path
    
    # Re-validation outcome
    validation_status = Column(String(50), default="PENDING", nullable=False) # PENDING, IMPROVED, NO_CHANGE, NEW_ISSUES_FOUND, REVIEW_REQUIRED
    validation_inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="SET NULL"), nullable=True, index=True)
    report_reference = Column(String(1024), nullable=True)
    
    created_by = Column(String(100), default="NIYAMORA Engine", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product")
    source_version = relationship("ArtworkVersion", foreign_keys=[source_artwork_version_id])
    suggested_version = relationship("ArtworkVersion", foreign_keys=[suggested_artwork_version_id])
    source_inspection = relationship("Inspection", foreign_keys=[source_inspection_id])
    validation_inspection = relationship("Inspection", foreign_keys=[validation_inspection_id])


class AuditEvent(Base):
    """
    Audit log recording compliance operations and design transformations.
    """
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False) # SUGGESTED_DESIGN_CREATED, SUGGESTED_DESIGN_RENDERED, SUGGESTED_DESIGN_VERIFIED, SIMULATION_EXECUTED, COMPARISON_VIEWED, PDF_EXPORTED
    entity_type = Column(String(50), nullable=False) # PRODUCT, ARTWORK_VERSION, SUGGESTED_DESIGN, INSPECTION
    entity_id = Column(String(36), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    company = relationship("Company")
    user = relationship("User")
