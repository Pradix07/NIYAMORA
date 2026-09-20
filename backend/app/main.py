import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.product import Product
from app.models.artwork import Artwork
from app.models.artwork_version import ArtworkVersion
from app.api.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("niyamora.main")

def init_db_and_seed():
    """Initializes tables and seeds default company workspace if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        company = db.query(Company).first()
        if not company:
            logger.info("Seeding default NIYAMORA workspace & sample products...")
            company = Company(name="Aura Botanicals Workspace")
            db.add(company)
            db.commit()
            db.refresh(company)

            user = User(
                company_id=company.id,
                name="Prashant Dwivedi",
                email="prashant@aurabotanicals.com",
                role="COMPANY_USER"
            )
            db.add(user)
            db.commit()

            # Seed initial sample product masters
            p1 = Product(
                company_id=company.id,
                name="Organic Chia Crunch Superfood Pouch",
                brand="Aura Botanicals",
                category="Food & Beverage",
                packaging_type="Stand-Up Pouch",
                sku="AB-CHIA-250",
                net_quantity="250 g",
                description="Matte kraft high-barrier stand-up foil pouch for roasted chia seeds."
            )
            p2 = Product(
                company_id=company.id,
                name="Cold-Pressed Virgin Coconut Oil",
                brand="Lumina Organics",
                category="Oils & Fats",
                packaging_type="Glass Bottle",
                sku="LO-VCO-500",
                net_quantity="500 ml",
                description="Clear glass bottle with tamper-proof metal cap and front/back label dielines."
            )
            p3 = Product(
                company_id=company.id,
                name="Artisanal Dark Chocolate 70%",
                brand="Velvet Cacao",
                category="Confectionery",
                packaging_type="Rigid Carton",
                sku="VC-DK-100",
                net_quantity="100 g",
                description="Embossed gold foil folding carton box."
            )
            db.add_all([p1, p2, p3])
            db.commit()

            # Seed master artworks & initial version
            for p in [p1, p2, p3]:
                art = Artwork(
                    product_id=p.id,
                    name=f"{p.name} Master Dieline",
                    source_type="PACKAGING_ARTWORK"
                )
                db.add(art)
                db.commit()
                db.refresh(art)

                ver = ArtworkVersion(
                    artwork_id=art.id,
                    version_number=1,
                    file_path=f"storage/uploads/{p.sku}_V01.pdf",
                    original_filename=f"{p.sku}_Master_Dieline_V01.pdf",
                    mime_type="application/pdf",
                    file_size_bytes=14500000,
                    processing_status="COMPLETED"
                )
                db.add(ver)
                db.commit()

            logger.info("Default seed records initialized.")
            
        # Ensure statutory compliance rules and sources are seeded
        from app.rules.engine import ComplianceEngine
        ComplianceEngine.ensure_rules_seeded(db)
        logger.info("Statutory compliance rule catalog verified & seeded.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield

app = FastAPI(
    title="NIYAMORA API",
    description="Where Packaging Meets Compliance — Packaging Compliance Before Print (Phase 2 Backend Foundation)",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For student local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to NIYAMORA Backend API",
        "docs": "/docs",
        "health": "/api/health"
    }
