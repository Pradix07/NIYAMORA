from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class ArtworkPanel(Base):
    """
    Represents an individual packaging panel / multi-image component
    associated with an ArtworkVersion (e.g. FRONT, BACK, SIDE, TOP, BOTTOM).
    """
    __tablename__ = "artwork_panels"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    artwork_version_id = Column(String(36), ForeignKey("artwork_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    panel_type = Column(String(50), default="FRONT", nullable=False) # FRONT, BACK, SIDE_LEFT, SIDE_RIGHT, TOP, BOTTOM, DIELINE_SHEET
    file_path = Column(String(1024), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    artwork_version = relationship("ArtworkVersion", back_populates="panels")
