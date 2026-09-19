from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.product import Product
from backend.app.models.artwork import Artwork
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.inspection import Inspection
from backend.app.models.company import Company
from backend.app.schemas.artwork import ArtworkVersionRead, ArtworkRead
from backend.app.storage.local import storage
from backend.app.services.pipeline import InspectionPipelineService

router = APIRouter(tags=["Artworks & Upload"])

def get_or_create_default_company(db: Session) -> Company:
    company = db.query(Company).first()
    if not company:
        company = Company(name="NIYAMORA Brand Workspace")
        db.add(company)
        db.commit()
        db.refresh(company)
    return company

@router.post("/upload-check", status_code=201)
async def upload_artwork_and_start_check(
    file: UploadFile = File(...),
    product_name: str = Form("Organic Chia Crunch Superfood Pouch"),
    brand: str = Form("Aura Botanicals"),
    packaging_type: str = Form("Stand-Up Pouch"),
    sku: Optional[str] = Form(None),
    net_quantity: str = Form("250 g"),
    source_type: str = Form("PACKAGING_ARTWORK"),
    product_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Core Phase 2 Ingestion Workflow:
    1. Validate uploaded file format & size
    2. Store original file in structured company/product/artwork storage
    3. Generate next sequential version number (V01, V02...)
    4. Create Inspection record
    5. Execute processing pipeline (Quality precheck -> Extraction -> Structuring)
    """
    company = get_or_create_default_company(db)

    # 1. Resolve or Create Product
    product = None
    if product_id:
        product = db.query(Product).filter(Product.id == product_id, Product.company_id == company.id).first()
    
    if not product:
        generated_sku = sku or f"SKU-{brand[:3].upper()}-{abs(hash(product_name)) % 10000:04d}"
        product = Product(
            company_id=company.id,
            name=product_name,
            brand=brand,
            packaging_type=packaging_type,
            sku=generated_sku,
            net_quantity=net_quantity,
            description="Created via pre-print upload check."
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

    # 4. Save file to storage
    file_path, storage_key, file_size, orig_name = await storage.save_upload(
        file=file,
        company_id=company.id,
        product_id=product.id,
        artwork_id=artwork.id,
        version_number=next_version_num
    )

    # 5. Create ArtworkVersion entity
    version = ArtworkVersion(
        artwork_id=artwork.id,
        version_number=next_version_num,
        file_path=file_path,
        original_filename=orig_name,
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=file_size,
        processing_status="QUEUED"
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    # 6. Create Inspection record
    inspection = Inspection(
        product_id=product.id,
        artwork_version_id=version.id,
        status="QUEUED",
        current_stage="INITIALIZING"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # 7. Execute processing pipeline synchronously for student-level single server flow
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
        "storage_key": storage_key,
        "preview_url": f"/api/files/{storage_key}"
    }

@router.get("/artworks/{artwork_id}/versions", response_model=List[ArtworkVersionRead])
def list_artwork_versions(artwork_id: str, db: Session = Depends(get_db)):
    artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found.")
    
    versions = (
        db.query(ArtworkVersion)
        .filter(ArtworkVersion.artwork_id == artwork_id)
        .order_by(ArtworkVersion.version_number.desc())
        .all()
    )
    return versions
