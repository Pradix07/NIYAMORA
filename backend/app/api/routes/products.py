from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.product import Product
from backend.app.models.company import Company
from backend.app.models.artwork import Artwork
from backend.app.models.artwork_version import ArtworkVersion
from backend.app.models.inspection import Inspection
from backend.app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])

def get_or_create_default_company(db: Session) -> Company:
    company = db.query(Company).first()
    if not company:
        company = Company(name="NIYAMORA Brand Workspace")
        db.add(company)
        db.commit()
        db.refresh(company)
    return company

@router.post("", response_model=ProductRead, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    company_id = payload.company_id
    if not company_id:
        company = get_or_create_default_company(db)
        company_id = company.id

    product = Product(
        company_id=company_id,
        name=payload.name,
        brand=payload.brand,
        category=payload.category,
        packaging_type=payload.packaging_type,
        sku=payload.sku,
        net_quantity=payload.net_quantity,
        description=payload.description
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Automatically create default master artwork record
    default_artwork = Artwork(
        product_id=product.id,
        name=f"{product.name} Master Dieline",
        source_type="PACKAGING_ARTWORK"
    )
    db.add(default_artwork)
    db.commit()

    return ProductRead(
        id=product.id,
        company_id=product.company_id,
        name=product.name,
        brand=product.brand,
        category=product.category,
        packaging_type=product.packaging_type,
        sku=product.sku,
        net_quantity=product.net_quantity,
        description=product.description,
        created_at=product.created_at,
        updated_at=product.updated_at,
        latest_version="V01",
        version_count=1,
        inspection_count=0
    )

@router.get("", response_model=List[ProductRead])
def list_products(
    search: Optional[str] = None,
    packaging_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.brand.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )
    if packaging_type and packaging_type != "ALL":
        query = query.filter(Product.packaging_type == packaging_type)

    products = query.order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        # Calculate version and inspection counts
        v_count = db.query(ArtworkVersion).join(Artwork).filter(Artwork.product_id == p.id).count()
        latest_v = db.query(ArtworkVersion).join(Artwork).filter(Artwork.product_id == p.id).order_by(ArtworkVersion.version_number.desc()).first()
        ins_count = db.query(Inspection).filter(Inspection.product_id == p.id).count()

        results.append(ProductRead(
            id=p.id,
            company_id=p.company_id,
            name=p.name,
            brand=p.brand,
            category=p.category,
            packaging_type=p.packaging_type,
            sku=p.sku,
            net_quantity=p.net_quantity,
            description=p.description,
            created_at=p.created_at,
            updated_at=p.updated_at,
            latest_version=latest_v.version_label if latest_v else "V01",
            version_count=max(1, v_count),
            inspection_count=ins_count
        ))
    return results

@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    v_count = db.query(ArtworkVersion).join(Artwork).filter(Artwork.product_id == product.id).count()
    latest_v = db.query(ArtworkVersion).join(Artwork).filter(Artwork.product_id == product.id).order_by(ArtworkVersion.version_number.desc()).first()
    ins_count = db.query(Inspection).filter(Inspection.product_id == product.id).count()

    return ProductRead(
        id=product.id,
        company_id=product.company_id,
        name=product.name,
        brand=product.brand,
        category=product.category,
        packaging_type=product.packaging_type,
        sku=product.sku,
        net_quantity=product.net_quantity,
        description=product.description,
        created_at=product.created_at,
        updated_at=product.updated_at,
        latest_version=latest_v.version_label if latest_v else "V01",
        version_count=max(1, v_count),
        inspection_count=ins_count
    )
