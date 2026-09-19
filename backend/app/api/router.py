from fastapi import APIRouter
from backend.app.api.routes import health, products, artworks, inspections, files, rules, compliance

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(artworks.router)
api_router.include_router(inspections.router)
api_router.include_router(files.router)
api_router.include_router(rules.router)
api_router.include_router(compliance.router)
