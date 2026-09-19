import os
import io
import pytest
from fastapi.testclient import TestClient
import fitz  # PyMuPDF
from PIL import Image, ImageDraw

# Ensure SQLite test environment
os.environ["DATABASE_URL"] = "sqlite:///./test_niyamora.db"
os.environ["STORAGE_DIR"] = "./test_storage/uploads"

from backend.app.main import app
from backend.app.db.session import Base, engine
from backend.app.processors.quality import ImageQualityAnalyzer

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup test db tables
    Base.metadata.drop_all(bind=engine)

def create_sample_pdf_bytes(
    brand="Aura Botanicals",
    product_name="Organic Chia Crunch",
    net_qty="250 g",
    mrp="₹299.00",
    fssai="10020011002345"
) -> io.BytesIO:
    doc = fitz.open()
    page = doc.new_page(width=400, height=600)

    # Insert text objects representing packaging dieline declarations
    page.insert_text((50, 60), brand.upper(), fontsize=12)
    page.insert_text((50, 100), product_name, fontsize=18)
    page.insert_text((50, 450), f"Net Qty: {net_qty}", fontsize=14)
    page.insert_text((50, 480), f"MRP: {mrp} (incl. of all taxes)", fontsize=10)
    page.insert_text((50, 510), f"fssai Lic. No. {fssai}", fontsize=10)
    page.insert_text((50, 540), "Ingredients: Roasted Organic Chia Seeds. Allergen: Contains Seeds.", fontsize=8)
    page.insert_text((50, 560), "Consumer Care: care@aurabotanicals.com | 1800-425-9988", fontsize=8)

    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)
    return pdf_bytes

def create_sample_image_bytes(is_blurry=False) -> io.BytesIO:
    img = Image.new("RGB", (800, 1000), color=(240, 230, 210))
    draw = ImageDraw.Draw(img)
    draw.text((50, 50), "Aura Botanicals", fill=(20, 20, 20))
    draw.text((50, 90), "Organic Chia Crunch", fill=(0, 0, 0))
    draw.text((50, 400), "Net Qty: 250 g", fill=(0, 0, 0))
    draw.text((50, 450), "MRP: Rs. 299", fill=(0, 0, 0))
    draw.text((50, 500), "fssai: 10020011002345", fill=(0, 100, 50))
    
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)
    return img_bytes

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app"] == "NIYAMORA"

def test_product_crud():
    # 1. Create Product
    payload = {
        "name": "Organic Almond Butter Jar",
        "brand": "Aura Botanicals",
        "category": "Spreads & Butters",
        "packaging_type": "Jar / Tub",
        "sku": "AB-ALM-350",
        "net_quantity": "350 g",
        "description": "Glass jar with tamper seal."
    }
    res = client.post("/api/products", json=payload)
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == payload["name"]
    prod_id = created["id"]

    # 2. Get Product by ID
    res_get = client.get(f"/api/products/{prod_id}")
    assert res_get.status_code == 200
    assert res_get.json()["sku"] == "AB-ALM-350"

    # 3. List Products
    res_list = client.get("/api/products")
    assert res_list.status_code == 200
    items = res_list.json()
    assert any(p["id"] == prod_id for p in items)

def test_file_validation_rejects_unsupported_extensions():
    fake_exe = io.BytesIO(b"fake executable binary")
    files = {"file": ("malicious.exe", fake_exe, "application/octet-stream")}
    data = {
        "product_name": "Test Item",
        "brand": "Test Brand",
        "packaging_type": "Stand-Up Pouch"
    }
    res = client.post("/api/upload-check", files=files, data=data)
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]

def test_upload_check_and_inspection_pipeline():
    pdf_file = create_sample_pdf_bytes()
    files = {"file": ("Aura_Chia_Crunch_Master.pdf", pdf_file, "application/pdf")}
    data = {
        "product_name": "Organic Chia Crunch Superfood Pouch",
        "brand": "Aura Botanicals",
        "packaging_type": "Stand-Up Pouch",
        "net_quantity": "250 g"
    }

    res = client.post("/api/upload-check", files=files, data=data)
    assert res.status_code == 201
    resp_data = res.json()
    assert resp_data["success"] is True
    assert resp_data["version_number"] == 1
    assert resp_data["version_label"] == "V01"
    assert resp_data["inspection_status"] == "COMPLETED"

    inspection_id = resp_data["inspection_id"]

    # Retrieve full inspection
    res_insp = client.get(f"/api/inspections/{inspection_id}")
    assert res_insp.status_code == 200
    insp_data = res_insp.json()
    assert insp_data["status"] == "COMPLETED"
    assert insp_data["quality_verdict"] == "GOOD"
    
    extracted = insp_data["extracted_data"]
    assert extracted["total_blocks"] > 0
    fields = extracted["fields"]
    assert fields["net_quantity"]["status"] == "EXTRACTED"
    assert "250 g" in fields["net_quantity"]["extracted_value"]
    assert fields["license_number"]["status"] == "EXTRACTED"
    assert "10020011002345" in fields["license_number"]["extracted_value"]

def test_version_auto_incrementation():
    # 1. Upload Version 1
    pdf1 = create_sample_pdf_bytes(net_qty="250 g")
    res1 = client.post(
        "/api/upload-check",
        files={"file": ("Chia_V01.pdf", pdf1, "application/pdf")},
        data={"product_name": "Chia Seeds", "brand": "Aura", "packaging_type": "Stand-Up Pouch"}
    )
    assert res1.status_code == 201
    prod_id = res1.json()["product_id"]
    art_id = res1.json()["artwork_id"]
    assert res1.json()["version_label"] == "V01"

    # 2. Upload Version 2 to same product
    pdf2 = create_sample_pdf_bytes(net_qty="500 g")
    res2 = client.post(
        "/api/upload-check",
        files={"file": ("Chia_V02.pdf", pdf2, "application/pdf")},
        data={"product_name": "Chia Seeds", "brand": "Aura", "packaging_type": "Stand-Up Pouch", "product_id": prod_id}
    )
    assert res2.status_code == 201
    assert res2.json()["version_label"] == "V02"
    assert res2.json()["version_number"] == 2

    # 3. Check version listing
    res_versions = client.get(f"/api/artworks/{art_id}/versions")
    assert res_versions.status_code == 200
    v_list = res_versions.json()
    assert len(v_list) == 2
    assert v_list[0]["version_label"] == "V02"
    assert v_list[1]["version_label"] == "V01"

def test_raster_image_ocr():
    """
    Verification Area 1: Real raster image OCR (PNG/JPG).
    Verifies that an image without digital font objects undergoes genuine raster OCR.
    """
    img_file = create_sample_image_bytes()
    files = {"file": ("packaging_front_panel.png", img_file, "image/png")}
    data = {
        "product_name": "Organic Chia Crunch",
        "brand": "Aura Botanicals",
        "packaging_type": "Stand-Up Pouch",
        "net_quantity": "250 g"
    }
    res = client.post("/api/upload-check", files=files, data=data)
    assert res.status_code == 201
    resp_data = res.json()
    assert resp_data["inspection_status"] == "COMPLETED"

    inspection_id = resp_data["inspection_id"]
    res_insp = client.get(f"/api/inspections/{inspection_id}")
    assert res_insp.status_code == 200
    extracted = res_insp.json()["extracted_data"]
    
    # Raster OCR should have extracted text blocks and structured fields
    assert extracted["total_blocks"] > 0
    assert len(extracted["raw_text"]) > 0
    # Net quantity or brand should be detected in extracted text
    assert any("250" in b["text"] or "Aura" in b["text"] or "Chia" in b["text"] for b in extracted["blocks"])

def test_cross_company_ownership_isolation():
    """
    Verification Area 3: Company Ownership Isolation.
    Verifies that Company A's products, artworks, inspections, and files cannot be accessed by Company B.
    """
    # 1. Create Company A and Company B
    from backend.app.db.session import SessionLocal
    from backend.app.models.company import Company
    db = SessionLocal()
    comp_a = Company(name="Company A - Alpha Naturals")
    comp_b = Company(name="Company B - Beta Foods")
    db.add_all([comp_a, comp_b])
    db.commit()
    db.refresh(comp_a)
    db.refresh(comp_b)
    comp_a_id = comp_a.id
    comp_b_id = comp_b.id
    db.close()

    # 2. Company A creates a product
    prod_a_res = client.post(
        "/api/products",
        json={"name": "Alpha Omega Tea", "brand": "Alpha", "packaging_type": "Box", "sku": "ALPHA-01"},
        headers={"X-Company-ID": comp_a_id}
    )
    assert prod_a_res.status_code == 201
    prod_a_id = prod_a_res.json()["id"]

    # 3. Company A uploads an artwork
    pdf_file = create_sample_pdf_bytes(brand="Alpha Naturals", product_name="Alpha Omega Tea")
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("alpha_tea.pdf", pdf_file, "application/pdf")},
        data={"product_name": "Alpha Omega Tea", "brand": "Alpha", "product_id": prod_a_id},
        headers={"X-Company-ID": comp_a_id}
    )
    assert upload_res.status_code == 201
    art_a_id = upload_res.json()["artwork_id"]
    ver_a_id = upload_res.json()["version_id"]
    insp_a_id = upload_res.json()["inspection_id"]

    # 4. Company B attempts to access Company A's product -> 403 Forbidden
    cross_prod = client.get(f"/api/products/{prod_a_id}", headers={"X-Company-ID": comp_b_id})
    assert cross_prod.status_code == 403

    # 5. Company B attempts to access Company A's artwork versions -> 403 Forbidden
    cross_ver = client.get(f"/api/artworks/{art_a_id}/versions", headers={"X-Company-ID": comp_b_id})
    assert cross_ver.status_code == 403

    # 6. Company B attempts to access Company A's inspection -> 403 Forbidden
    cross_insp = client.get(f"/api/inspections/{insp_a_id}", headers={"X-Company-ID": comp_b_id})
    assert cross_insp.status_code == 403

    # 7. Company B attempts to access Company A's preview file -> 403 Forbidden
    cross_file = client.get(f"/api/files/preview/{ver_a_id}", headers={"X-Company-ID": comp_b_id})
    assert cross_file.status_code == 403

def test_multi_panel_artwork_support():
    """
    Verification Area 4: True multi-image / multi-panel support.
    Verifies that one logical ArtworkVersion can contain multiple panels (FRONT, BACK, SIDE).
    """
    # 1. Upload initial FRONT panel for product
    front_img = create_sample_image_bytes()
    res1 = client.post(
        "/api/upload-check",
        files={"file": ("front_panel.png", front_img, "image/png")},
        data={
            "product_name": "Multi Panel Protein Bar",
            "brand": "ProBrand",
            "packaging_type": "Wrapper / Flow Wrap",
            "panel_type": "FRONT"
        }
    )
    assert res1.status_code == 201
    art_id = res1.json()["artwork_id"]
    ver_id = res1.json()["version_id"]

    # 2. Attach BACK panel to the same ArtworkVersion
    back_img = create_sample_image_bytes()
    res_back = client.post(
        f"/api/artworks/versions/{ver_id}/panels",
        files={"file": ("back_panel.png", back_img, "image/png")},
        data={"panel_type": "BACK"}
    )
    assert res_back.status_code == 201
    assert res_back.json()["panel_type"] == "BACK"

    # 3. Attach SIDE panel to the same ArtworkVersion
    side_img = create_sample_image_bytes()
    res_side = client.post(
        f"/api/artworks/versions/{ver_id}/panels",
        files={"file": ("side_panel.png", side_img, "image/png")},
        data={"panel_type": "SIDE_LEFT"}
    )
    assert res_side.status_code == 201
    assert res_side.json()["panel_type"] == "SIDE_LEFT"

    # 4. Fetch artwork versions and verify panels list
    res_ver = client.get(f"/api/artworks/{art_id}/versions")
    assert res_ver.status_code == 200
    versions = res_ver.json()
    assert len(versions) == 1
    panels = versions[0]["panels"]
    assert len(panels) == 3
    panel_types = [p["panel_type"] for p in panels]
    assert "FRONT" in panel_types
    assert "BACK" in panel_types
    assert "SIDE_LEFT" in panel_types

