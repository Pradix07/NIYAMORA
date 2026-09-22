"""Image validation utilities for packaging file and photo uploads."""

import hashlib
import io
import logging
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from PIL import Image as PILImage, ImageFile

from app.core.config import settings

logger = logging.getLogger("niyamora.image_validation")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".pdf"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

ImageFile.LOAD_TRUNCATED_IMAGES = False


async def validate_and_read_image(file: UploadFile) -> Tuple[bytes, str, str, str]:
    """Validate image file constraints and return (file_bytes, sha256_hash, ext, safe_filename).

    Constraints:
    - Valid non-empty filename with path traversal protection
    - File extension in ALLOWED_IMAGE_EXTENSIONS
    - Content-type verification
    - File size <= settings.MAX_UPLOAD_SIZE_BYTES via stream chunking
    - Non-empty byte payload
    - Image format verification via Pillow (decompression bomb protection)
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    safe_filename = Path(file.filename).name.strip()
    if not safe_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has an empty filename."
        )

    ext = Path(safe_filename).suffix.lower()
    if not ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File has no extension. Allowed extensions: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    # Validate content-type if provided
    if file.content_type:
        normalized_type = file.content_type.lower().split(";")[0].strip()
        if normalized_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image type '{file.content_type}'. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
            )

    content_length = file.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.MAX_UPLOAD_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
                )
        except ValueError:
            pass

    hasher = hashlib.sha256()
    chunks = []
    total_size = 0
    chunk_size = 64 * 1024  # 64 KB

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
            )
        hasher.update(chunk)
        chunks.append(chunk)

    if total_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    file_bytes = b"".join(chunks)

    # Verify actual image integrity using Pillow
    try:
        with PILImage.open(io.BytesIO(file_bytes)) as img:
            img.verify()
    except PILImage.DecompressionBombError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image dimensions exceed maximum safe limit."
        )
    except Exception as e:
        logger.warning(f"Image integrity verification failed for {safe_filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}"
        )

    file_hash = hasher.hexdigest()
    return file_bytes, file_hash, ext, safe_filename
