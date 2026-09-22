import os
import uuid
import re
import hashlib
from pathlib import Path
from typing import Tuple
import aiofiles
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class LocalStorage:
    def __init__(self, base_dir: str = settings.STORAGE_DIR):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        # Keep only alphanumeric, dashes, underscores, and dots
        clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
        return clean.strip("._") or "unnamed_file"

    def get_target_dir(self, company_id: str, product_id: str, artwork_id: str, version_number: int) -> Path:
        target_dir = self.base_dir / company_id / product_id / artwork_id / f"V{version_number:02d}"
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir

    async def save_upload(
        self,
        file: UploadFile,
        company_id: str,
        product_id: str,
        artwork_id: str,
        version_number: int
    ) -> Tuple[str, str, int, str, str]:
        """
        Saves an uploaded file to structured local storage.
        Returns: (saved_file_path, storage_key, file_size_bytes, original_filename, sha256_hash)
        """
        original_name = file.filename or "uploaded_artwork.pdf"
        sanitized = self._sanitize_filename(original_name)
        ext = Path(sanitized).suffix.lower()
        
        # Enforce extension whitelist
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        unique_id = str(uuid.uuid4())[:8]
        stem = Path(sanitized).stem
        stored_filename = f"{stem}_{unique_id}{ext}"
        
        target_dir = self.get_target_dir(company_id, product_id, artwork_id, version_number)
        target_path = target_dir / stored_filename

        total_bytes = 0
        hasher = hashlib.sha256()
        async with aiofiles.open(target_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_bytes += len(chunk)
                hasher.update(chunk)
                if total_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
                    if target_path.exists():
                        target_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_BYTES / (1024*1024):.0f}MB"
                    )
                await out_file.write(chunk)

        # Storage key relative to base_dir
        rel_key = str(target_path.relative_to(self.base_dir)).replace("\\", "/")
        sha256_hash = hasher.hexdigest()
        return str(target_path), rel_key, total_bytes, original_name, sha256_hash

    def resolve_path(self, storage_key: str) -> Path:
        # Prevent directory traversal
        normalized = os.path.normpath(storage_key).lstrip("\\/.")
        safe_path = (self.base_dir / normalized).resolve()
        if not str(safe_path).startswith(str(self.base_dir.resolve())):
            raise HTTPException(status_code=400, detail="Invalid storage path.")
        if not safe_path.exists():
            raise HTTPException(status_code=404, detail="Requested file not found.")
        return safe_path

storage = LocalStorage()
