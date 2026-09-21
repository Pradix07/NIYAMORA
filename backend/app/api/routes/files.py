from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.artwork_version import ArtworkVersion
from app.models.artwork_panel import ArtworkPanel
from app.models.artwork import Artwork
from app.models.product import Product
from app.models.company import Company
from app.storage.local import storage
from app.api.deps import get_current_company, verify_product_ownership

router = APIRouter(prefix="/files", tags=["Files & Previews"])

@router.get("/preview/{version_id}")
def get_artwork_preview(
    version_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    version = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Artwork version not found.")

    artwork = db.query(Artwork).filter(Artwork.id == version.artwork_id).first()
    if artwork:
        product = db.query(Product).filter(Product.id == artwork.product_id).first()
        if product:
            verify_product_ownership(product, company)

    target_path = version.preview_image_path or version.file_path
    if not target_path or not Path(target_path).exists():
        raise HTTPException(status_code=404, detail="Preview file not found.")

    ext = Path(target_path).suffix.lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/webp" if ext == ".webp" else "application/pdf"
    
    return FileResponse(
        path=target_path,
        media_type=media_type,
        filename=Path(target_path).name
    )

@router.get("/panels/{panel_id}")
def get_panel_preview(
    panel_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    panel = db.query(ArtworkPanel).filter(ArtworkPanel.id == panel_id).first()
    if not panel:
        raise HTTPException(status_code=404, detail="Artwork panel not found.")

    version = db.query(ArtworkVersion).filter(ArtworkVersion.id == panel.artwork_version_id).first()
    if version:
        artwork = db.query(Artwork).filter(Artwork.id == version.artwork_id).first()
        if artwork:
            product = db.query(Product).filter(Product.id == artwork.product_id).first()
            if product:
                verify_product_ownership(product, company)

    target_path = panel.file_path
    if not target_path or not Path(target_path).exists():
        raise HTTPException(status_code=404, detail="Panel file not found.")

    ext = Path(target_path).suffix.lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/webp" if ext == ".webp" else "application/pdf"
    
    return FileResponse(
        path=target_path,
        media_type=media_type,
        filename=Path(target_path).name
    )

@router.get("/{storage_key:path}")
def get_stored_file(
    storage_key: str,
    company: Company = Depends(get_current_company)
):
    safe_path = storage.resolve_path(storage_key)
    rel_key = str(safe_path.relative_to(storage.base_dir.resolve())).replace("\\", "/")
    
    # Check if the storage key belongs to the current company
    path_parts = rel_key.split("/")
    if len(path_parts) > 0 and path_parts[0] != company.id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot access file belonging to another company.")

    ext = safe_path.suffix.lower()
    
    media_type = "application/octet-stream"
    if ext == ".pdf":
        media_type = "application/pdf"
    elif ext in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif ext == ".png":
        media_type = "image/png"
    elif ext == ".webp":
        media_type = "image/webp"

    return FileResponse(
        path=str(safe_path),
        media_type=media_type,
        filename=safe_path.name
    )
