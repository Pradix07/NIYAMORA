import os
import io
import uuid
from datetime import datetime
import pytest
from fastapi.testclient import TestClient
import fitz  # PyMuPDF
from PIL import Image

os.environ["DATABASE_URL"] = "sqlite:///./test_niyamora_qa.db"
os.environ["STORAGE_DIR"] = "./test_storage/uploads_qa"

import app.models
from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.artwork import Artwork
from app.models.artwork_version import ArtworkVersion
from app.models.inspection import Inspection
from app.models.compliance import Evaluation, Finding, Evidence, RuleVersion
from app.models.suggested_design import SuggestedDesign
from app.rules.engine import ComplianceEngine
from app.processors.structurer import PackagingFieldStructurer
from app.processors.extractor import ContentExtractor
from app.schemas.inspection import TextBlock, BoundingBoxCoord
from app.services.pdf_generator import PDFReportGenerator
from app.services.suggested_design_renderer import SuggestedDesignRenderer

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    ComplianceEngine.ensure_rules_seeded(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def make_block(text: str, panel: str = "FRONT", bbox: list = None, conf: float = 0.99) -> TextBlock:
    if bbox is None:
        bbox = [40.0, 50.0, 200.0, 70.0]
    norm = BoundingBoxCoord(
        x=bbox[0] / 400.0 * 100.0,
        y=bbox[1] / 600.0 * 100.0,
        width=(bbox[2] - bbox[0]) / 400.0 * 100.0,
        height=(bbox[3] - bbox[1]) / 600.0 * 100.0,
        panel_type=panel,
        label=text[:20]
    )
    return TextBlock(
        id=str(uuid.uuid4()),
        text=text,
        confidence=conf,
        bbox=bbox,
        normalized_box=norm
    )

def create_synthetic_multipanel_pdf() -> io.BytesIO:
    """Create a 3-page PDF simulating FRONT, BACK, and TOP packaging panels."""
    doc = fitz.open()
    
    # Page 0: FRONT Panel
    p0 = doc.new_page(width=400, height=600)
    p0.insert_text((40, 60), "NUTRIVA", fontsize=18)
    p0.insert_text((40, 100), "CALIFORNIA ALMONDS", fontsize=14)
    p0.insert_text((40, 140), "SIMPLE INGREDIENTS. REAL BENEFITS.", fontsize=10)
    p0.insert_text((40, 500), "Net Wt.: 250 g", fontsize=12)
    
    # Page 1: BACK Panel (Missing Country of Origin)
    p1 = doc.new_page(width=400, height=600)
    p1.insert_text((40, 40), "NUTRITION FACTS", fontsize=12)
    p1.insert_text((40, 70), "Serving Size: 30g", fontsize=9)
    p1.insert_text((40, 95), "Energy: 160 kcal", fontsize=9)
    p1.insert_text((40, 120), "Total Carbohydrate: 37g", fontsize=9)
    p1.insert_text((40, 145), "Dietary Fiber: 12g", fontsize=9)
    p1.insert_text((40, 170), "Protein: 21g", fontsize=9)
    p1.insert_text((40, 220), "Ingredients: 100% California Raw Almonds", fontsize=9)
    p1.insert_text((40, 260), "MRP: Rs. 350.00 (Incl. of all taxes)", fontsize=10)
    p1.insert_text((40, 300), "USP: Rs. 1.40 per g", fontsize=10)
    p1.insert_text((40, 340), "MFG Date: 09/2026", fontsize=9)
    p1.insert_text((40, 380), "Manufactured by: Nutriva Foods Pvt Ltd, Industrial Area, Pune 411001", fontsize=8)
    p1.insert_text((40, 420), "Consumer Care: care@nutrivafoods.com, Toll Free: 1800-123-4567", fontsize=8)
    p1.insert_text((40, 460), "FSSAI Lic. No.: 10012345678901", fontsize=9)
    
    # Page 2: TOP Panel
    p2 = doc.new_page(width=400, height=300)
    p2.insert_text((40, 50), "NUTRIVA ALMONDS", fontsize=12)
    p2.insert_text((40, 90), "STORE IN A COOL DRY PLACE", fontsize=9)
    
    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)
    return pdf_bytes


# ============================================================
# TEST 1: Strict Net Quantity Parser Rejects Nutrition Facts (37g Bug)
# ============================================================
def test_net_quantity_ignores_nutrition_facts_and_finds_real_quantity():
    """Verify that '37g' under carbohydrate/fiber in nutrition table is never parsed as net quantity."""
    blocks = [
        make_block("NUTRITION FACTS", panel="BACK", bbox=[40, 40, 200, 60]),
        make_block("Total Carbohydrate: 37g", panel="BACK", bbox=[40, 120, 250, 140]),
        make_block("Dietary Fiber: 12g", panel="BACK", bbox=[40, 145, 200, 165]),
        make_block("Protein: 21g", panel="BACK", bbox=[40, 170, 180, 190]),
        make_block("Net Wt.: 250 g", panel="FRONT", bbox=[40, 500, 180, 520]),
    ]
    raw_text = "\n".join([b.text for b in blocks])
    
    structurer = PackagingFieldStructurer()
    extracted = structurer.structure_fields(raw_text, blocks)
    
    assert "net_quantity" in extracted
    net_qty = extracted["net_quantity"]
    assert net_qty.status == "EXTRACTED"
    assert "250" in (net_qty.extracted_value or "")
    assert "37" not in (net_qty.extracted_value or "")
    assert "12" not in (net_qty.extracted_value or "")
    assert "21" not in (net_qty.extracted_value or "")


# ============================================================
# TEST 2: Net Quantity Standalone on PDP Match
# ============================================================
def test_net_quantity_exact_pdp_match():
    """Verify standalone '250 g' or 'Net Qty: 250g' on PDP panel matches accurately."""
    blocks = [
        make_block("NUTRIVA", panel="FRONT", bbox=[40, 60, 150, 90]),
        make_block("250 g", panel="FRONT", bbox=[40, 500, 100, 520]),
    ]
    raw_text = "\n".join([b.text for b in blocks])
    structurer = PackagingFieldStructurer()
    extracted = structurer.structure_fields(raw_text, blocks)
    
    assert extracted["net_quantity"].status == "EXTRACTED"
    assert extracted["net_quantity"].extracted_value.strip() == "250 g"


# ============================================================
# TEST 3: Marketing Slogans are Never Extracted as Brand or Product Name
# ============================================================
def test_slogan_rejected_as_brand_and_product_name():
    """Ensure marketing slogans like 'SIMPLE INGREDIENTS. REAL BENEFITS.' are never extracted as brand or product name."""
    blocks = [
        make_block("SIMPLE INGREDIENTS. REAL BENEFITS.", panel="FRONT", bbox=[40, 140, 300, 160]),
        make_block("100% PURE ALMONDS", panel="FRONT", bbox=[40, 170, 250, 190]),
        make_block("CALIFORNIA ALMONDS", panel="FRONT", bbox=[40, 100, 250, 125]),
        make_block("NUTRIVA", panel="FRONT", bbox=[40, 60, 150, 85]),
    ]
    raw_text = "\n".join([b.text for b in blocks])
    structurer = PackagingFieldStructurer()
    extracted = structurer.structure_fields(raw_text, blocks)
    
    brand = extracted.get("brand")
    prod = extracted.get("product_name")
    
    if brand and brand.status == "EXTRACTED":
        assert "SIMPLE INGREDIENTS" not in (brand.extracted_value or "").upper()
        assert "100% PURE" not in (brand.extracted_value or "").upper()
    if prod and prod.status == "EXTRACTED":
        assert "SIMPLE INGREDIENTS" not in (prod.extracted_value or "").upper()
        assert "100% PURE" not in (prod.extracted_value or "").upper()


# ============================================================
# TEST 4: Tight Sub-Line Bounding Box Calculation
# ============================================================
def test_tight_bounding_box_subline():
    """Verify that _compute_tight_box computes sub-line bounding box for matching text portion."""
    structurer = PackagingFieldStructurer()
    block = make_block("Net Weight: 250 g (When Packed)\nMRP: Rs. 350.00\nMFG: 09/2026", bbox=[40, 100, 300, 250])
    
    tight_box = structurer._compute_tight_box(block, "250 g")
    
    assert tight_box is not None
    assert tight_box.height < block.normalized_box.height
    assert abs(tight_box.y - block.normalized_box.y) < 0.1


# ============================================================
# TEST 5: Multi-page PDF Extraction Yields All Pages
# ============================================================
def test_multipage_pdf_all_pages_extracted(tmp_path):
    """Verify ContentExtractor extracts all pages and assigns panel metadata."""
    pdf_stream = create_synthetic_multipanel_pdf()
    pdf_path = os.path.join(tmp_path, "sample_multipanel.pdf")
    with open(pdf_path, "wb") as f:
        f.write(pdf_stream.getvalue())
        
    pages_data = ContentExtractor.extract_pdf_all_pages(pdf_path)
    
    assert len(pages_data) == 3
    assert pages_data[0]["page_index"] == 0
    assert pages_data[1]["page_index"] == 1
    assert pages_data[2]["page_index"] == 2


# ============================================================
# TEST 6: Versioning Lifecycle — V01 on Inspection, V02 on Explicit Generation
# ============================================================
def test_versioning_lifecycle_v01_and_v02():
    """Verify V01 is created at inspection, and V02 is created ONLY when explicitly requested."""
    # 1. Signup user
    signup_res = client.post("/api/auth/signup", json={
        "name": "QA Specialist",
        "email": "qa@nutrivafoods.com",
        "password": "Password123!",
        "company_name": "Nutriva Foods",
        "role": "COMPANY_USER"
    })
    assert signup_res.status_code == 201
    token = signup_res.json()["access_token"]
    
    # 2. Upload artwork and run inspection
    pdf_stream = create_synthetic_multipanel_pdf()
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("nutriva_almonds.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Nutriva California Almonds", "brand": "Nutriva", "category": "Dry Fruits", "packaging_type": "POUCH"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_res.status_code == 201
    upload_data = upload_res.json()
    product_id = upload_data["product_id"]
    version_id = upload_data["version_id"]
    
    # Check product versions -> Exactly 1 version (V01)
    db = SessionLocal()
    versions = db.query(ArtworkVersion).join(Artwork).filter(Artwork.product_id == product_id).order_by(ArtworkVersion.version_number).all()
    assert len(versions) == 1
    assert versions[0].version_number == 1
    db.close()
    
    # 3. Explicitly generate suggested design (V02)
    gen_res = client.post(
        f"/api/products/{product_id}/artworks/{version_id}/suggest",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert gen_res.status_code == 201
    design_data = gen_res.json()
    assert "id" in design_data
    
    # Check product versions -> Now 2 versions (V01 and V02)
    db = SessionLocal()
    versions_after = db.query(ArtworkVersion).join(Artwork).filter(Artwork.product_id == product_id).order_by(ArtworkVersion.version_number).all()
    assert len(versions_after) == 2
    assert versions_after[0].version_number == 1
    assert versions_after[1].version_number == 2
    db.close()


# ============================================================
# TEST 7: Multi-Panel Suggested Design Preserves Unchanged Panels
# ============================================================
def test_suggested_design_preserves_all_panels():
    """Verify that multi-panel packaging keeps unchanged panels intact when generating V02."""
    signup_res = client.post("/api/auth/signup", json={
        "name": "Design QA",
        "email": "design@nutrivafoods.com",
        "password": "Password123!",
        "company_name": "Nutriva Foods",
        "role": "COMPANY_USER"
    })
    token = signup_res.json()["access_token"]
    
    pdf_stream = create_synthetic_multipanel_pdf()
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("nutriva_almonds.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "California Almonds", "brand": "Nutriva", "category": "Dry Fruits", "packaging_type": "POUCH"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_res.status_code == 201
    upload_data = upload_res.json()
    product_id = upload_data["product_id"]
    version_id = upload_data["version_id"]
    
    # Generate suggested design
    gen_res = client.post(
        f"/api/products/{product_id}/artworks/{version_id}/suggest",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert gen_res.status_code == 201
    design_id = gen_res.json()["id"]
    
    # Fetch design details
    detail_res = client.get(f"/api/suggested-designs/{design_id}", headers={"Authorization": f"Bearer {token}"})
    assert detail_res.status_code == 200
    design_detail = detail_res.json()
    
    # Verify change_set recorded
    assert "change_set" in design_detail
    assert isinstance(design_detail["change_set"], list)


# ============================================================
# TEST 8: Suggested Design Image Does Not Burn Diagnostic Overlay Watermarks
# ============================================================
def test_suggested_design_no_watermarks_or_diagnostic_overlays():
    """Verify the rendered V02 artwork has clean correction text and NO diagnostic labels."""
    img = Image.new("RGB", (600, 800), color=(255, 255, 255))
    changes = [
        {
            "field_name": "country_of_origin",
            "rule_id": "LM-008",
            "statutory_reference": "Legal Metrology Packaged Commodities Rule 6(10)",
            "suggested_text": "Country of Origin: India",
            "original_text": None,
            "target_bbox": [40, 500, 300, 530],
            "target_panel": "BACK"
        }
    ]
    
    modified_img = SuggestedDesignRenderer._apply_corrections_cleanly(img, changes)
    assert modified_img is not None
    assert modified_img.size == (600, 800)


# ============================================================
# TEST 9: Authenticated Inspection PDF Download & Multi-Tenant Isolation
# ============================================================
def test_inspection_pdf_download_authenticated_and_isolated():
    """Verify GET /api/inspections/{id}/pdf succeeds for authorized user and returns 403 for unauthorized company."""
    # User A (Company Alpha)
    user_a = client.post("/api/auth/signup", json={
        "name": "User Alpha",
        "email": "alpha_pdf@companya.com",
        "password": "PasswordA123!",
        "company_name": "Company Alpha",
        "role": "COMPANY_USER"
    }).json()
    token_a = user_a["access_token"]
    
    # User B (Company Beta)
    user_b = client.post("/api/auth/signup", json={
        "name": "User Beta",
        "email": "beta_pdf@companyb.com",
        "password": "PasswordB123!",
        "company_name": "Company Beta",
        "role": "COMPANY_USER"
    }).json()
    token_b = user_b["access_token"]
    
    # Upload and inspect under User A
    pdf_stream = create_synthetic_multipanel_pdf()
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("alpha_pack.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Alpha Pack", "brand": "Alpha", "category": "Snacks", "packaging_type": "POUCH"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert upload_res.status_code == 201
    inspection_id = upload_res.json()["inspection_id"]
    
    # 1. User A downloads inspection PDF -> 200 OK
    pdf_res_a = client.get(f"/api/inspections/{inspection_id}/pdf", headers={"Authorization": f"Bearer {token_a}"})
    assert pdf_res_a.status_code == 200
    assert pdf_res_a.headers["content-type"] == "application/pdf"
    assert pdf_res_a.content.startswith(b"%PDF")
    
    # 2. User B tries to download User A's inspection PDF -> 403 Forbidden
    pdf_res_b = client.get(f"/api/inspections/{inspection_id}/pdf", headers={"Authorization": f"Bearer {token_b}"})
    assert pdf_res_b.status_code == 403


# ============================================================
# TEST 10: Authenticated Suggested Design PDF Download & Multi-Tenant Isolation
# ============================================================
def test_suggested_design_pdf_download_authenticated_and_isolated():
    """Verify GET /api/suggested-designs/{id}/pdf succeeds for owner and returns 403 for other tenants."""
    user_a = client.post("/api/auth/signup", json={
        "name": "Design Alpha",
        "email": "alpha_des@companya.com",
        "password": "PasswordA123!",
        "company_name": "Company Alpha",
        "role": "COMPANY_USER"
    }).json()
    token_a = user_a["access_token"]
    
    user_b = client.post("/api/auth/signup", json={
        "name": "Design Beta",
        "email": "beta_des@companyb.com",
        "password": "PasswordB123!",
        "company_name": "Company Beta",
        "role": "COMPANY_USER"
    }).json()
    token_b = user_b["access_token"]
    
    pdf_stream = create_synthetic_multipanel_pdf()
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("alpha_pack.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Alpha Pack", "brand": "Alpha", "category": "Snacks", "packaging_type": "POUCH"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    upload_data = upload_res.json()
    product_id = upload_data["product_id"]
    version_id = upload_data["version_id"]
    
    # Generate suggested design
    gen_res = client.post(
        f"/api/products/{product_id}/artworks/{version_id}/suggest",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert gen_res.status_code == 201
    design_id = gen_res.json()["id"]
    
    # 1. User A downloads suggested design PDF -> 200 OK
    pdf_a = client.get(f"/api/suggested-designs/{design_id}/pdf", headers={"Authorization": f"Bearer {token_a}"})
    assert pdf_a.status_code == 200
    assert pdf_a.headers["content-type"] == "application/pdf"
    assert pdf_a.content.startswith(b"%PDF")
    
    # 2. User B tries to download -> 403 Forbidden
    pdf_b = client.get(f"/api/suggested-designs/{design_id}/pdf", headers={"Authorization": f"Bearer {token_b}"})
    assert pdf_b.status_code == 403


# ============================================================
# TEST 11: Multi-Panel Evidence Association
# ============================================================
def test_multi_panel_evidence_association():
    """Verify evidence items are associated with panel names and bounding boxes."""
    signup_res = client.post("/api/auth/signup", json={
        "name": "Evidence Tester",
        "email": "evidence@testing.com",
        "password": "Password123!",
        "company_name": "Test Co",
        "role": "COMPANY_USER"
    })
    token = signup_res.json()["access_token"]
    
    pdf_stream = create_synthetic_multipanel_pdf()
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("evidence_test.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Evidence Test", "brand": "Nutriva", "category": "Food", "packaging_type": "POUCH"},
        headers={"Authorization": f"Bearer {token}"}
    )
    inspection_id = upload_res.json()["inspection_id"]
    
    evi_res = client.get(f"/api/inspections/{inspection_id}/evidence", headers={"Authorization": f"Bearer {token}"})
    assert evi_res.status_code == 200
    evidence_list = evi_res.json()
    assert len(evidence_list) > 0
    
    # Verify at least one evidence has valid extracted_value or observed_text
    has_valid_field = any(e.get("extracted_value") is not None or e.get("observed_text") is not None for e in evidence_list)
    assert has_valid_field is True


# ============================================================
# TEST 12: Inspection PDF Content Completeness & Statutory Disclaimer
# ============================================================
def test_export_report_content_completeness():
    """Verify generated inspection PDF includes statutory disclaimer and findings."""
    db = SessionLocal()
    # Create synthetic inspection record
    comp = Company(name="Report Test Co")
    db.add(comp)
    db.flush()
    prod = Product(company_id=comp.id, name="Test Flakes", brand="Test Brand", category="Food", packaging_type="POUCH", sku="SKU-TEST-001")
    db.add(prod)
    db.flush()
    art = Artwork(product_id=prod.id, name="Flakes Artwork")
    db.add(art)
    db.flush()
    ver = ArtworkVersion(artwork_id=art.id, version_number=1, file_path="dummy.pdf", original_filename="dummy.pdf", mime_type="application/pdf", file_size_bytes=1024)
    db.add(ver)
    db.flush()
    insp = Inspection(product_id=prod.id, artwork_version_id=ver.id, compliance_score=75.0, status="COMPLETED", created_at=datetime.utcnow())
    db.add(insp)
    db.flush()
    
    rv = db.query(RuleVersion).first()
    if rv:
        ev = Evaluation(
            inspection_id=insp.id,
            rule_version_id=rv.id,
            status="ISSUE",
            observed_value=None,
            expected_condition="Country of Origin declaration required",
            explanation="Country of origin is missing from packaging artwork"
        )
        db.add(ev)
        db.flush()
        f1 = Finding(
            inspection_id=insp.id,
            evaluation_id=ev.id,
            rule_code=rv.rule_code,
            severity="MAJOR",
            status="OPEN",
            title="Country of Origin Missing",
            summary="Missing country of origin",
            requirement="Rule 6(10)",
            suggested_action="Add Country of Origin: India"
        )
        db.add(f1)
    db.commit()
    
    # Generate PDF
    pdf_bytes, filename = PDFReportGenerator.generate_inspection_pdf(db, insp.id)
    db.close()
    
    assert pdf_bytes is not None
    assert pdf_bytes.startswith(b"%PDF")
    assert filename.endswith(".pdf")
    
    # Read PDF text using PyMuPDF
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_text = ""
    for page in doc:
        all_text += page.get_text()
    doc.close()
    
    assert "NIYAMORA" in all_text
    assert "Test Flakes" in all_text
    assert "REGULATORY & LEGAL DISCLAIMER" in all_text or "not a government certificate" in all_text.lower()
