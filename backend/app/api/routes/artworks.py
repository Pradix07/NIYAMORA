from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.product import Product
from app.models.artwork import Artwork
from app.models.artwork_version import ArtworkVersion
from app.models.artwork_panel import ArtworkPanel
from app.models.inspection import Inspection
from app.models.company import Company
from app.schemas.artwork import ArtworkVersionRead, ArtworkRead, ArtworkPanelRead
from app.storage.local import storage
from app.services.pipeline import InspectionPipelineService
from app.api.deps import get_current_company, verify_product_ownership

from app.processors.structurer import PackagingFieldStructurer

router = APIRouter(tags=["Artworks & Upload"])

@router.post("/upload-check", status_code=201)
async def upload_artwork_and_start_check(
    request: Request,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Core Ingestion Workflow (Single or Multi-Panel Artwork):
    1. Collect and validate uploaded artwork files (supports single file or multi-panel files)
    2. Store original files in structured company/product/artwork storage
    3. Generate next sequential version number (V01, V02...)
    4. Create ArtworkVersion entity & register all ArtworkPanels (FRONT, BACK, SIDES, TOP, etc.)
    5. Create a SINGLE Inspection record for the version
    6. Execute processing pipeline across all panels (Quality -> Extraction -> Structuring -> Rules)
    """
    import logging
    _logger = logging.getLogger("niyamora.upload_check")

    try:
        form = await request.form()

        # 0. Collect and validate uploaded files
        uploaded_files: List[UploadFile] = []
        # If "files" is provided (e.g. multi-panel upload), prefer "files" list
        raw_multi = form.getlist("files")
        if raw_multi and any(hasattr(item, "filename") and getattr(item, "filename", None) for item in raw_multi):
            uploaded_files = [item for item in raw_multi if hasattr(item, "filename") and getattr(item, "filename", None)]
        else:
            raw_single = form.getlist("file")
            if raw_single and any(hasattr(item, "filename") and getattr(item, "filename", None) for item in raw_single):
                uploaded_files = [item for item in raw_single if hasattr(item, "filename") and getattr(item, "filename", None)]
            else:
                for key in form.keys():
                    for item in form.getlist(key):
                        if hasattr(item, "filename") and getattr(item, "filename", None) and item not in uploaded_files:
                            uploaded_files.append(item)

        if not uploaded_files:
            raise HTTPException(status_code=400, detail="At least one packaging artwork file is required.")

        # Form parameters
        raw_name = str(form.get("product_name") or "").strip()
        if not raw_name or PackagingFieldStructurer._is_filename_like(raw_name):
            product_name = "Packaging Artwork"
        else:
            product_name = raw_name
        brand = str(form.get("brand") or "Brand")
        category = str(form.get("category") or "Food & Beverage")
        packaging_type = str(form.get("packaging_type") or "Stand-Up Pouch")
        sku = str(form.get("sku")) if form.get("sku") else None
        net_quantity = str(form.get("net_quantity")) if form.get("net_quantity") else None
        source_type = str(form.get("source_type") or "PACKAGING_ARTWORK")
        product_id = str(form.get("product_id")) if form.get("product_id") else None
        panel_type = str(form.get("panel_type") or "FRONT")
        panel_types = form.getlist("panel_types")

        # 1. Resolve or Create Product with Ownership Verification
        product = None
        if product_id:
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail="Product not found.")
            verify_product_ownership(product, company)
        
        if not product:
            generated_sku = sku or f"SKU-{brand[:3].upper() if brand else 'SKU'}-{abs(hash(product_name)) % 10000:04d}"
            product = Product(
                company_id=company.id,
                name=product_name,
                brand=brand,
                category=category,
                packaging_type=packaging_type,
                sku=generated_sku,
                net_quantity=net_quantity,
                description="Created via pre-print packaging check."
            )
            db.add(product)
            db.commit()
            db.refresh(product)

        # 2. Resolve or Create Artwork Master
        artwork = db.query(Artwork).filter(Artwork.product_id == product.id).first()
        if not artwork:
            artwork = Artwork(
                product_id=product.id,
                name=f"{product.name} Artwork Master",
                source_type=source_type
            )
            db.add(artwork)
            db.commit()
            db.refresh(artwork)

        # 3. Determine next auto-incremented version number
        latest_version = (
            db.query(ArtworkVersion)
            .filter(ArtworkVersion.artwork_id == artwork.id)
            .order_by(ArtworkVersion.version_number.desc())
            .first()
        )
        next_version_num = (latest_version.version_number + 1) if latest_version else 1

        # 4. Save primary file to storage
        primary_file = uploaded_files[0]
        primary_path, primary_storage_key, primary_size, primary_orig_name, primary_hash = await storage.save_upload(
            file=primary_file,
            company_id=company.id,
            product_id=product.id,
            artwork_id=artwork.id,
            version_number=next_version_num
        )

        # 5. Create ArtworkVersion entity
        version = ArtworkVersion(
            artwork_id=artwork.id,
            version_number=next_version_num,
            file_path=primary_path,
            original_filename=primary_orig_name,
            mime_type=primary_file.content_type or "application/octet-stream",
            file_size_bytes=primary_size,
            processing_status="QUEUED"
        )
        db.add(version)
        db.commit()
        db.refresh(version)

        # 6. Register panels for all uploaded files (FRONT, BACK, SIDE, TOP, etc.)
        for idx, f in enumerate(uploaded_files):
            if idx == 0:
                p_path, p_key, p_size, p_name, p_hash = primary_path, primary_storage_key, primary_size, primary_orig_name, primary_hash
            else:
                p_path, p_key, p_size, p_name, p_hash = await storage.save_upload(
                    file=f,
                    company_id=company.id,
                    product_id=product.id,
                    artwork_id=artwork.id,
                    version_number=next_version_num
                )

            # Determine panel type
            p_type = "FRONT"
            if panel_types and idx < len(panel_types) and panel_types[idx]:
                p_type = panel_types[idx].strip().upper()
            elif idx == 0 and panel_type:
                p_type = panel_type.strip().upper()
            else:
                fname_lower = (p_name or "").lower()
                if "back" in fname_lower or "rear" in fname_lower:
                    p_type = "BACK"
                elif "side_left" in fname_lower or "left" in fname_lower:
                    p_type = "SIDE_LEFT"
                elif "side_right" in fname_lower or "right" in fname_lower:
                    p_type = "SIDE_RIGHT"
                elif "side" in fname_lower:
                    p_type = "SIDE"
                elif "top" in fname_lower or "seal" in fname_lower:
                    p_type = "TOP"
                elif "bottom" in fname_lower or "base" in fname_lower:
                    p_type = "BOTTOM"
                elif "front" in fname_lower:
                    p_type = "FRONT"
                elif idx == 0:
                    p_type = "FRONT"
                elif idx == 1:
                    p_type = "BACK"
                else:
                    p_type = "OTHER"

            panel = ArtworkPanel(
                artwork_version_id=version.id,
                panel_type=p_type,
                file_path=p_path,
                original_filename=p_name,
                mime_type=f.content_type or "application/octet-stream",
                file_size_bytes=p_size,
                image_hash=p_hash
            )
            db.add(panel)

        db.commit()
        db.refresh(version)

        # 7. Create Inspection record (ONE inspection for the entire artwork revision)
        inspection = Inspection(
            product_id=product.id,
            artwork_version_id=version.id,
            status="QUEUED",
            current_stage="INITIALIZING"
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        # 8. Execute processing pipeline synchronously across all panels
        InspectionPipelineService.execute_inspection(db, inspection.id)
        db.refresh(inspection)
        db.refresh(version)

        return {
            "success": True,
            "product_id": product.id,
            "product_name": product.name,
            "artwork_id": artwork.id,
            "version_id": version.id,
            "version_number": version.version_number,
            "version_label": version.version_label,
            "inspection_id": inspection.id,
            "inspection_status": inspection.status,
            "quality_verdict": inspection.quality_verdict,
            "storage_key": primary_storage_key,
            "preview_url": f"/api/files/{primary_storage_key}"
        }

    except HTTPException:
        raise  # Let FastAPI handle HTTP exceptions normally (they already have CORS headers)
    except Exception as exc:
        _logger.exception(f"upload-check failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Packaging analysis failed: {str(exc)}")

@router.post("/artworks/versions/{version_id}/panels", response_model=ArtworkPanelRead, status_code=201)
async def add_panel_to_version(
    version_id: str,
    file: UploadFile = File(...),
    panel_type: str = Form("BACK"),
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Associates an additional panel/image (e.g. BACK, SIDE, TOP) with an existing ArtworkVersion.
    """
    version = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Artwork version not found.")

    artwork = db.query(Artwork).filter(Artwork.id == version.artwork_id).first()
    if artwork:
        product = db.query(Product).filter(Product.id == artwork.product_id).first()
        if product:
            verify_product_ownership(product, company)

    file_path, storage_key, file_size, orig_name, file_hash = await storage.save_upload(
        file=file,
        company_id=company.id,
        product_id=artwork.product_id if artwork else "generic",
        artwork_id=artwork.id if artwork else "generic",
        version_number=version.version_number
    )

    panel = ArtworkPanel(
        artwork_version_id=version.id,
        panel_type=panel_type,
        file_path=file_path,
        original_filename=orig_name,
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=file_size,
        image_hash=file_hash
    )
    db.add(panel)
    db.commit()
    db.refresh(panel)
    return panel

@router.get("/artworks/{artwork_id}/versions", response_model=List[ArtworkVersionRead])
def list_artwork_versions(
    artwork_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found.")

    product = db.query(Product).filter(Product.id == artwork.product_id).first()
    if product:
        verify_product_ownership(product, company)
    
    versions = (
        db.query(ArtworkVersion)
        .filter(ArtworkVersion.artwork_id == artwork_id)
        .order_by(ArtworkVersion.version_number.desc())
        .all()
    )
    return versions
