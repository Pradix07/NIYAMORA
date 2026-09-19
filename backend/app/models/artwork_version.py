from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class ArtworkVersion(Base):
    __tablename__ = "artwork_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    artwork_id = Column(String(36), ForeignKey("artworks.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    file_path = Column(String(1024), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True, default=1)
    dpi = Column(Float, nullable=True)
    preview_image_path = Column(String(1024), nullable=True)
    processing_status = Column(String(50), default="QUEUED", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    artwork = relationship("Artwork", back_populates="versions")
    panels = relationship("ArtworkPanel", back_populates="artwork_version", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="artwork_version", cascade="all, delete-orphan")

    @property
    def version_label(self) -> str:
        return f"V{self.version_number:02d}"
