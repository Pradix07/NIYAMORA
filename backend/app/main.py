import sys
from pathlib import Path

# Ensure backend root directory is in sys.path for direct module execution and Render startup
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
import app.models  # Registers all models (including PackagingProject) on Base.metadata
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

            from app.core.security import hash_password
            user = User(
                company_id=company.id,
                name="Prashant Dwivedi",
                email="prashant@aurabotanicals.com",
                role="COMPANY_USER",
                password_hash=hash_password("Password123!")
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
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler: ensures unhandled 500 errors return JSON responses
# that pass through CORSMiddleware (so browsers receive CORS headers and don't
# silently reject the error response as a CORS violation).
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "phase": "Production Ready"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to NIYAMORA Backend API",
        "docs": "/docs",
        "health": "/api/health"
    }
