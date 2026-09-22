from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class PackagingProject(Base):
    """
    Persistent record for AI Packaging Studio projects.
    Stores structured inputs, design brief, packaging format specifications,
    panel layouts, and links to created Product, Artwork, and ArtworkVersion entities.
    """
    __tablename__ = "packaging_projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    artwork_id = Column(String(36), ForeignKey("artworks.id", ondelete="SET NULL"), nullable=True, index=True)
    artwork_version_id = Column(String(36), ForeignKey("artwork_versions.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False) # DRAFT, GENERATED, REVIEWED, APPROVED
    packaging_format = Column(String(50), default="STAND_UP_POUCH", nullable=False) # STAND_UP_POUCH, PILLOW_POUCH, BOX_CARTON, JAR, BOTTLE, CAN
    
    # Structured specifications for all stages
    dimensions = Column(JSON, default=dict, nullable=False)
    product_data = Column(JSON, default=dict, nullable=False)
    business_data = Column(JSON, default=dict, nullable=False)
    food_data = Column(JSON, default=dict, nullable=False)
    nutrition_data = Column(JSON, default=dict, nullable=False)
    declaration_data = Column(JSON, default=dict, nullable=False)
    brand_data = Column(JSON, default=dict, nullable=False)
    design_brief = Column(JSON, default=dict, nullable=False)
    panel_designs = Column(JSON, default=dict, nullable=False)
    
    active_version_number = Column(Integer, default=1, nullable=False)
    redesign_history = Column(JSON, default=list, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = relationship("Company")
    product = relationship("Product")
    artwork = relationship("Artwork")
    artwork_version = relationship("ArtworkVersion")
