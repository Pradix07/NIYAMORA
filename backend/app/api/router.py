from fastapi import APIRouter
from app.api.routes import (
    health,
    auth,
    products,
    artworks,
    inspections,
    files,
    rules,
    compliance,
    suggested_designs,
    analysis,
    packaging_studio,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(artworks.router)
api_router.include_router(inspections.router)
api_router.include_router(files.router)
api_router.include_router(rules.router)
api_router.include_router(compliance.router)
api_router.include_router(suggested_designs.router)
api_router.include_router(analysis.router)
api_router.include_router(packaging_studio.router)
