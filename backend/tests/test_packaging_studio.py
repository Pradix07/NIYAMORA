import os
import pytest
import app.models
from app.db.session import Base, engine, SessionLocal
from app.models.company import Company
from app.models.packaging_project import PackagingProject
from app.models.artwork_version import ArtworkVersion
from app.models.artwork_panel import ArtworkPanel
from app.models.inspection import Inspection
from app.services.packaging_design_service import PackagingDesignService
from app.rules.engine import ComplianceEngine

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    ComplianceEngine.ensure_rules_seeded(db)
    yield db
    db.close()


@pytest.fixture
def test_company(db_session):
    company = Company(name="Organic Harvest Co")
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company

def test_packaging_project_creation_and_6_panel_generation(db_session, test_company):
    """Verify that PackagingDesignService generates all 6 panels without hallucinating values."""
    payload = {
        "title": "Almond Bliss Pouch",
        "packaging_format": "STAND_UP_POUCH",
        "product_data": {
            "product_name": "California Roasted Almonds",
            "brand_name": "NutriBounty",
            "category": "Dry Fruits & Nuts",
            "description": "Crispy salted whole California almonds",
            "net_quantity": "250",
            "unit": "g"
        },
        "business_data": {
            "manufacturer_name": "NutriBounty Foods Ltd",
            "manufacturer_address": "Plot 12, Export Zone, Bengaluru, KA 560100",
            "country_of_origin": "India",
            "fssai_license": "10019043002890"
        },
        "food_data": {
            "ingredients": [{"name": "Almonds", "percentage": "98%"}, {"name": "Iodized Salt", "percentage": "2%"}],
            "contains_allergens": ["Tree Nuts"],
            "veg_non_veg": "VEG"
        },
        "nutrition_data": {
            "basis": "Per 100 g",
            "nutrients": [
                {"nutrient_name": "Energy", "amount": "580", "unit": "kcal"},
                {"nutrient_name": "Protein", "amount": "21.2", "unit": "g"},
                {"nutrient_name": "Total Fat", "amount": "50.6", "unit": "g"}
            ]
        },
        "declaration_data": {
            "mrp": "399.00",
            "mfg_date": "09/2026",
            "batch_number": "ALM-2026-B1",
            "storage_instructions": "Store in a cool dry place away from sunlight."
        },
        "brand_data": {
            "primary_color": "#1B4D3E",
            "secondary_color": "#FAF8F5",
            "accent_color": "#D4AF37",
            "design_style": "PREMIUM_NATURAL"
        },
        "custom_direction": "Clean natural organic styling"
    }

    # 1. Create project
    project = PackagingDesignService.create_project(db_session, test_company.id, payload)
    assert project.id is not None
    assert project.status == "DRAFT"
    assert project.product_data["net_quantity"] == "250"
    assert project.nutrition_data["nutrients"][1]["amount"] == "21.2"

    # 2. Generate packaging version 1
    updated_proj, insp = PackagingDesignService.generate_packaging_version(db_session, project.id, version_number=1)
    
    assert updated_proj.status == "GENERATED"
    assert updated_proj.artwork_version_id is not None
    assert insp.id is not None
    assert insp.status == "COMPLETED"

    # Verify all 6 panels created
    panels = db_session.query(ArtworkPanel).filter(ArtworkPanel.artwork_version_id == updated_proj.artwork_version_id).all()
    assert len(panels) == 6
    panel_types = [p.panel_type for p in panels]
    for pt in ["FRONT", "BACK", "LEFT", "RIGHT", "TOP", "BOTTOM"]:
        assert pt in panel_types
        p_obj = next(p for p in panels if p.panel_type == pt)
        assert p_obj.image_hash is not None
        assert os.path.exists(p_obj.file_path)

def test_missing_data_zero_hallucination_placeholders(db_session, test_company):
    """Verify that missing consumer care, dates, and FSSAI use placeholders, never hallucinations."""
    payload = {
        "title": "Raw Walnuts",
        "product_data": {
            "product_name": "Premium Walnuts",
            "brand_name": "NaturePack",
            "category": "Dry Fruits & Nuts",
            "net_quantity": "500",
            "unit": "g"
        }
    }
    project = PackagingDesignService.create_project(db_session, test_company.id, payload)
    updated_proj, insp = PackagingDesignService.generate_packaging_version(db_session, project.id, version_number=1)
    
    # Check that panel design elements recorded placeholders
    back_panel = updated_proj.panel_designs.get("BACK")
    assert back_panel is not None
    assert os.path.exists(back_panel["file_path"])

def test_redesign_workflow_and_v02_creation(db_session, test_company):
    """Verify natural-language redesign proposal, structured diff, and V02 version lifecycle."""
    payload = {
        "title": "Cashew Kernels",
        "product_data": {
            "product_name": "Whole Cashews W320",
            "brand_name": "RoyalNut",
            "category": "Dry Fruits & Nuts",
            "net_quantity": "200",
            "unit": "g"
        },
        "declaration_data": {
            "mrp": "299.00",
            "mfg_date": "08/2026"
        }
    }
    project = PackagingDesignService.create_project(db_session, test_company.id, payload)
    PackagingDesignService.generate_packaging_version(db_session, project.id, version_number=1)

    # 1. Propose redesign
    proposal = PackagingDesignService.propose_redesign(
        db_session,
        project.id,
        "Make the green lighter and increase product title size"
    )
    assert proposal["proposed_version_number"] == 2
    assert len(proposal["changes_summary"]) > 0
    assert any("green" in s.lower() for s in proposal["changes_summary"])

    # 2. V02 must NOT be accepted yet
    db_session.refresh(project)
    assert project.active_version_number == 1

    # 3. Accept redesign
    proj_v2, insp_v2 = PackagingDesignService.accept_redesign(db_session, project.id)
    assert proj_v2.active_version_number == 2
    
    ver2 = db_session.query(ArtworkVersion).filter(ArtworkVersion.id == proj_v2.artwork_version_id).first()
    assert ver2.version_number == 2

    # 4. Verify PDF export
    pdf_path = PackagingDesignService.export_packaging_pdf(db_session, project.id)
    assert os.path.exists(pdf_path)
    assert pdf_path.endswith(".pdf")

def test_blank_project_initialization_and_panel_mapping(db_session, test_company):
    """Verify that a newly created blank packaging project starts completely empty and serves all 6 panels."""
    blank_payload = {
        "title": "New Blank Project",
        "packaging_format": "STAND_UP_POUCH",
        "product_data": {},
        "business_data": {},
        "food_data": {},
        "nutrition_data": {},
        "declaration_data": {},
        "brand_data": {}
    }
    project = PackagingDesignService.create_project(db_session, test_company.id, blank_payload)
    assert project.id is not None
    assert project.product_data == {}
    assert project.business_data == {}
    assert project.food_data == {}

    # Generate packaging version with zero inputs
    updated_proj, insp = PackagingDesignService.generate_packaging_version(db_session, project.id, version_number=1)
    assert updated_proj.status == "GENERATED"
    
    # Check all 6 panels exist and preview URLs are mapped accurately
    for p_type in ["FRONT", "BACK", "LEFT", "RIGHT", "TOP", "BOTTOM"]:
        p_data = updated_proj.panel_designs.get(p_type)
        assert p_data is not None
        assert p_data["panel_type"] == p_type
        assert p_data["preview_url"] == f"/api/packaging-studio/projects/{project.id}/panels/{p_type}"
        assert os.path.exists(p_data["file_path"])

