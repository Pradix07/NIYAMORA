from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.suggested_design import SuggestedDesign
from backend.app.models.product import Product
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.company import Company
from backend.app.schemas.suggested_design import SuggestedDesignRead
from backend.app.services.suggested_design_engine import SuggestedDesignEngine
from backend.app.services.suggested_design_renderer import SuggestedDesignRenderer
from backend.app.services.validation_service import ValidationService
from backend.app.services.pdf_generator import PDFReportGenerator
from backend.app.api.deps import get_current_company, verify_product_ownership

router = APIRouter(tags=["Suggested Designs & Improvement"])

@router.post("/products/{product_id}/artworks/{version_id}/suggest", response_model=SuggestedDesignRead, status_code=201)
def generate_suggested_design(
    product_id: str,
    version_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """
    Core Phase 4 Entrypoint: Generates a structured compliance improvement plan
    for the selected product artwork version based on deterministic inspection findings.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    verify_product_ownership(product, company)

    version = db.query(ArtworkVersion).filter(ArtworkVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Artwork version not found.")

    try:
        suggested = SuggestedDesignEngine.generate_suggested_design(
            db=db,
            product_id=product_id,
            source_version_id=version_id,
            created_by="NIYAMORA Compliance Engine"
        )
        # Automatically render preview foundation
        suggested = SuggestedDesignRenderer.render_suggested_design(db, suggested.id)

        source_preview = f"/api/files/preview/{version.id}" if version else None
        sug_preview = f"/api/files/preview/{suggested.suggested_artwork_version_id}" if suggested.suggested_artwork_version_id else None

        return SuggestedDesignRead(
            id=suggested.id,
            product_id=suggested.product_id,
            product_name=product.name,
            source_artwork_version_id=suggested.source_artwork_version_id,
            source_inspection_id=suggested.source_inspection_id,
            suggested_artwork_version_id=suggested.suggested_artwork_version_id,
            version_label=suggested.version_label,
            status=suggested.status,
            change_set=suggested.change_set,
            rendered_artwork_reference=suggested.rendered_artwork_reference,
            preview_url=sug_preview,
            source_preview_url=source_preview,
            validation_status=suggested.validation_status,
            validation_inspection_id=suggested.validation_inspection_id,
            report_reference=suggested.report_reference,
            created_by=suggested.created_by,
            created_at=suggested.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate suggested design: {str(e)}")

@router.get("/suggested-designs/{id}", response_model=SuggestedDesignRead)
def get_suggested_design(
    id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    suggested = db.query(SuggestedDesign).filter(SuggestedDesign.id == id).first()
    if not suggested:
        raise HTTPException(status_code=404, detail="Suggested design not found.")

    product = db.query(Product).filter(Product.id == suggested.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Associated product not found.")
    verify_product_ownership(product, company)

    source_preview = f"/api/files/preview/{suggested.source_artwork_version_id}"
    sug_preview = f"/api/files/preview/{suggested.suggested_artwork_version_id}" if suggested.suggested_artwork_version_id else None

    return SuggestedDesignRead(
        id=suggested.id,
        product_id=suggested.product_id,
        product_name=product.name if product else None,
        source_artwork_version_id=suggested.source_artwork_version_id,
        source_inspection_id=suggested.source_inspection_id,
        suggested_artwork_version_id=suggested.suggested_artwork_version_id,
        version_label=suggested.version_label,
        status=suggested.status,
        change_set=suggested.change_set,
        rendered_artwork_reference=suggested.rendered_artwork_reference,
        preview_url=sug_preview,
        source_preview_url=source_preview,
        validation_status=suggested.validation_status,
        validation_inspection_id=suggested.validation_inspection_id,
        report_reference=suggested.report_reference,
        created_by=suggested.created_by,
        created_at=suggested.created_at
    )

@router.get("/suggested-designs", response_model=List[SuggestedDesignRead])
def list_suggested_designs(
    product_id: Optional[str] = None,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    query = db.query(SuggestedDesign).join(Product).filter(Product.company_id == company.id)
    if product_id:
        query = query.filter(SuggestedDesign.product_id == product_id)
    
    designs = query.order_by(SuggestedDesign.created_at.desc()).all()
    results = []
    for s in designs:
        p = db.query(Product).filter(Product.id == s.product_id).first()
        results.append(SuggestedDesignRead(
            id=s.id,
            product_id=s.product_id,
            product_name=p.name if p else None,
            source_artwork_version_id=s.source_artwork_version_id,
            source_inspection_id=s.source_inspection_id,
            suggested_artwork_version_id=s.suggested_artwork_version_id,
            version_label=s.version_label,
            status=s.status,
            change_set=s.change_set,
            rendered_artwork_reference=s.rendered_artwork_reference,
            preview_url=f"/api/files/preview/{s.suggested_artwork_version_id}" if s.suggested_artwork_version_id else None,
            source_preview_url=f"/api/files/preview/{s.source_artwork_version_id}",
            validation_status=s.validation_status,
            validation_inspection_id=s.validation_inspection_id,
            report_reference=s.report_reference,
            created_by=s.created_by,
            created_at=s.created_at
        ))
    return results

@router.post("/suggested-designs/{id}/render", response_model=SuggestedDesignRead)
def render_suggested_design(
    id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    suggested = db.query(SuggestedDesign).filter(SuggestedDesign.id == id).first()
    if not suggested:
        raise HTTPException(status_code=404, detail="Suggested design not found.")

    product = db.query(Product).filter(Product.id == suggested.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Associated product not found.")
    verify_product_ownership(product, company)

    updated = SuggestedDesignRenderer.render_suggested_design(db, id)
    return get_suggested_design(id=updated.id, company=company, db=db)

@router.post("/suggested-designs/{id}/verify", response_model=SuggestedDesignRead)
def verify_suggested_design(
    id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    suggested = db.query(SuggestedDesign).filter(SuggestedDesign.id == id).first()
    if not suggested:
        raise HTTPException(status_code=404, detail="Suggested design not found.")

    product = db.query(Product).filter(Product.id == suggested.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Associated product not found.")
    verify_product_ownership(product, company)

    updated = ValidationService.revalidate_suggested_design(db, id)
    return get_suggested_design(id=updated.id, company=company, db=db)

@router.get("/suggested-designs/{id}/pdf")
def download_suggested_design_pdf(
    id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    suggested = db.query(SuggestedDesign).filter(SuggestedDesign.id == id).first()
    if not suggested:
        raise HTTPException(status_code=404, detail="Suggested design not found.")

    product = db.query(Product).filter(Product.id == suggested.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Associated product not found.")
    verify_product_ownership(product, company)

    pdf_bytes, filename = PDFReportGenerator.generate_suggested_design_pdf(db, id)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf"
        }
    )
