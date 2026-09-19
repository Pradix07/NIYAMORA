from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.storage.local import storage

router = APIRouter(prefix="/files", tags=["Files & Previews"])

@router.get("/preview/{version_id}")
def get_artwork_preview(version_id: str, db: Session = Depends(get_db)):
    version = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Artwork version not found.")

    target_path = version.preview_image_path or version.file_path
    if not target_path or not Path(target_path).exists():
        raise HTTPException(status_code=404, detail="Preview file not found.")

    ext = Path(target_path).suffix.lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg" if ext in [".jpg", ".jpeg"] else "application/pdf"
    
    return FileResponse(
        path=target_path,
        media_type=media_type,
        filename=Path(target_path).name
    )

@router.get("/{storage_key:path}")
def get_stored_file(storage_key: str):
    safe_path = storage.resolve_path(storage_key)
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
