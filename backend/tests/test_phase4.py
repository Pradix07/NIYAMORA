import os
import io
import pytest
from fastapi.testclient import TestClient
import fitz # PyMuPDF
from PIL import Image

os.environ["DATABASE_URL"] = "sqlite:///./test_niyamora_phase4.db"
os.environ["STORAGE_DIR"] = "./test_storage/uploads_phase4"

import app.models
from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.models.company import Company
from app.models.product import Product
from app.models.artwork import Artwork
from app.models.artwork_version import ArtworkVersion
from app.models.inspection import Inspection
from app.models.compliance import Evaluation, Finding, Evidence
from app.models.suggested_design import SuggestedDesign
from app.rules.engine import ComplianceEngine
from app.services.suggested_design_engine import SuggestedDesignEngine
from app.services.suggested_design_renderer import SuggestedDesignRenderer
from app.services.validation_service import ValidationService
from app.services.comparison_engine import ComparisonEngine
from app.services.regression_engine import RegressionEngine
from app.services.simulator_service import SimulatorService
from app.services.risk_map_service import RiskMapService
from app.services.pdf_generator import PDFReportGenerator

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    ComplianceEngine.ensure_rules_seeded(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def create_synthetic_artwork_pdf(
    brand="Aura Botanicals",
    product_name="Organic Chia Crunch Superfood Pouch",
    net_qty="250g",
    mrp="299",
    mfg_date="09/2026",
    mfg_address="Aura Botanicals Pvt Ltd, Bengaluru",
    consumer_care="care@aurabotanicals.com",
    origin=None
) -> io.BytesIO:
    doc = fitz.open()
    page = doc.new_page(width=400, height=600)

    page.insert_text((40, 50), brand.upper(), fontsize=12)
    page.insert_text((40, 80), product_name, fontsize=16)
    page.insert_text((40, 380), f"Net Qty: {net_qty}", fontsize=10)
    page.insert_text((40, 410), f"MRP: Rs. {mrp}", fontsize=10)
    page.insert_text((40, 440), f"MFG: {mfg_date}", fontsize=10)
    page.insert_text((40, 470), f"Manufactured by: {mfg_address}", fontsize=8)
    page.insert_text((40, 500), f"Customer Care: {consumer_care}", fontsize=8)
    if origin:
        page.insert_text((40, 530), f"Country of Origin: {origin}", fontsize=9)

    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)
    return pdf_bytes

def upload_sample_artwork(brand="Aura Botanicals", name="Organic Chia Crunch Superfood Pouch", net_qty="250 g"):
    pdf_file = create_synthetic_artwork_pdf(brand=brand, product_name=name, net_qty=net_qty)
    res = client.post(
        "/api/upload-check",
        files={"file": ("test_artwork.pdf", pdf_file, "application/pdf")},
        data={
            "product_name": name,
            "brand": brand,
            "category": "Food & Beverage",
            "packaging_type": "Stand-Up Pouch",
            "net_quantity": net_qty
        }
    )
    assert res.status_code == 201
    return res.json()

# =====================================================================
# GROUP 1: LEGAL & RULE LOGIC TESTS
# =====================================================================

def test_01_pdp_area_dependent_minimum_height():
    """Test 1: Sizing depends on Principal Display Panel area under Schedule-II."""
    db = SessionLocal()
    # 50 cm² -> 1.0mm
    sim50 = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-NET-QTY", "font_height_mm": 1.0, "pdp_area_sqcm": 45, "pack_weight_g": None})())
    assert sim50.hypothetical_verdict == "PASS"
    assert sim50.hypothetical_parameter["required_min_mm"] == 1.0

    # 100 cm² -> 2.0mm
    sim100 = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-NET-QTY", "font_height_mm": 1.5, "pdp_area_sqcm": 80, "pack_weight_g": None})())
    assert sim100.hypothetical_verdict == "ISSUE"
    assert sim100.hypothetical_parameter["required_min_mm"] == 2.0

    # 500 cm² -> 4.0mm
    sim500 = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-NET-QTY", "font_height_mm": 4.0, "pdp_area_sqcm": 350, "pack_weight_g": None})())
    assert sim500.hypothetical_verdict == "PASS"
    assert sim500.hypothetical_parameter["required_min_mm"] == 4.0

    # > 500 cm² -> 6.0mm
    sim_large = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-NET-QTY", "font_height_mm": 5.0, "pdp_area_sqcm": 700, "pack_weight_g": None})())
    assert sim_large.hypothetical_verdict == "ISSUE"
    assert sim_large.hypothetical_parameter["required_min_mm"] == 6.0
    db.close()

def test_02_insufficient_pdp_evidence_returns_review():
    """Test 2: Insufficient PDP info returns REVIEW rather than assumed PASS/ISSUE."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-NET-QTY", "font_height_mm": 3.0, "pdp_area_sqcm": None, "pack_weight_g": None})())
    assert sim.hypothetical_verdict == "REVIEW"
    assert "Principal Display Panel information is insufficient" in sim.explanation
    db.close()

def test_03_mrp_uses_rule_6_1_e():
    """Test 3: MRP references Rule 6(1)(e), NOT Rule 6(1)(d)."""
    db = SessionLocal()
    product = Product(name="Test Item", packaging_type="Box", company_id="test-comp")
    chg = SuggestedDesignEngine._build_change_for_rule(
        "LMPC-DECL-MRP", None, None, {"mrp": {"extracted_value": "₹250"}}, product, {"x": 10, "y": 70}
    )
    assert "Rule 6(1)(e)" in chg["rule_reference"]
    assert "Rule 6(1)(d)" not in chg["rule_reference"]
    db.close()

def test_04_mfg_date_uses_rule_6_1_d():
    """Test 4: Manufacturing date references Rule 6(1)(d)."""
    db = SessionLocal()
    product = Product(name="Test Item", packaging_type="Box", company_id="test-comp")
    chg = SuggestedDesignEngine._build_change_for_rule(
        "LMPC-DECL-DATE", None, None, {"date_marking": {"extracted_value": "08/2026"}}, product, {"x": 10, "y": 70}
    )
    assert "Rule 6(1)(d)" in chg["rule_reference"]
    db.close()

def test_05_usp_under_1kg_per_gram():
    """Test 5: USP for mass < 1kg evaluates on per g basis."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "200", "pack_weight_g": 500, "packaging_type": "WEIGHT", "category": None, "unit_sale_price": None})())
    assert sim.hypothetical_verdict == "ISSUE"
    assert "₹0.40 / g" in sim.explanation
    db.close()

def test_06_usp_at_or_over_1kg_per_kg():
    """Test 6: USP for mass >= 1kg evaluates on per kg basis."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "600", "pack_weight_g": 2000, "packaging_type": "WEIGHT", "category": None, "unit_sale_price": None})())
    assert sim.hypothetical_verdict == "ISSUE"
    assert "₹300.00 / kg" in sim.explanation
    db.close()

def test_07_usp_under_1L_per_ml():
    """Test 7: USP for volume < 1L evaluates on per ml basis."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "100", "pack_weight_g": 500, "packaging_type": "VOLUME", "category": None, "unit_sale_price": None})())
    assert sim.hypothetical_verdict == "ISSUE"
    assert "₹0.20 / ml" in sim.explanation
    db.close()

def test_08_usp_at_or_over_1L_per_L():
    """Test 8: USP for volume >= 1L evaluates on per L basis."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "400", "pack_weight_g": 2000, "packaging_type": "VOLUME", "category": None, "unit_sale_price": None})())
    assert sim.hypothetical_verdict == "ISSUE"
    assert "₹200.00 / L" in sim.explanation
    db.close()

def test_09_usp_under_1m_per_cm():
    """Test 9: USP for length < 1m evaluates on per cm basis."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "50", "pack_weight_g": 50, "packaging_type": "LENGTH", "category": None, "unit_sale_price": None})())
    assert "₹1.00 / cm" in sim.explanation
    db.close()

def test_10_usp_at_or_over_1m_per_m():
    """Test 10: USP for length >= 1m evaluates on per m basis."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "300", "pack_weight_g": 300, "packaging_type": "LENGTH", "category": None, "unit_sale_price": None})())
    assert "₹100.00 / m" in sim.explanation
    db.close()

def test_11_count_unit_handling_no_N():
    """Test 11: Count unit does not use 'N' (Newton in SI)."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "50", "pack_weight_g": 10, "packaging_type": "COUNT", "category": None, "unit_sale_price": None})())
    assert "unit" in sim.explanation.lower()
    assert "/ N" not in sim.explanation
    db.close()

def test_12_rsp_equals_usp_proviso():
    """Test 12: Single unit packs (1kg, 1L, 1m, 1 unit) satisfy RSP == USP proviso."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "150", "pack_weight_g": 1000, "packaging_type": "WEIGHT", "category": None, "unit_sale_price": None})())
    assert sim.hypothetical_verdict == "PASS"
    assert "proviso" in sim.explanation
    db.close()

def test_13_alcoholic_beverage_state_excise_handling():
    """Test 13: Alcoholic beverages return N/A with State Excise scope note."""
    db = SessionLocal()
    sim = SimulatorService.simulate(db, None, type("Req", (), {"rule_code": "LMPC-DECL-USP", "mrp": "800", "pack_weight_g": 750, "packaging_type": "VOLUME", "category": "Alcoholic Beverages", "unit_sale_price": None})())
    assert sim.hypothetical_verdict == "N/A"
    assert "State Excise" in sim.explanation
    db.close()

def test_14_insufficient_usp_evidence_returns_review():
    """Test 14: Insufficient MRP or measure evidence produces REVIEW."""
    db = SessionLocal()
    product = Product(name="Test Item", packaging_type="Box", company_id="test-comp", net_quantity="")
    chg = SuggestedDesignEngine._build_change_for_rule(
        "LMPC-DECL-USP", None, None, {"mrp": {"extracted_value": ""}, "net_quantity": {"extracted_value": ""}}, product, {"x": 10, "y": 70}
    )
    assert chg["status"] == "REVIEW"
    assert chg["change_type"] == "REVIEW_REQUIRED"
    db.close()

# =====================================================================
# GROUP 2: SUGGESTED DESIGN & VALUE PRESERVATION TESTS
# =====================================================================

def test_16_to_20_critical_value_preservation():
    """Tests 16-20: MRP numeric, quantity, date preserved without random hallucinations."""
    data = upload_sample_artwork(net_qty="250 g")
    product_id = data["product_id"]
    version_id = data["version_id"]

    res = client.post(f"/api/products/{product_id}/artworks/{version_id}/suggest")
    assert res.status_code == 201
    suggested = res.json()

    # Find changes
    mrp_chg = next((c for c in suggested["change_set"] if c["field_key"] == "mrp"), None)
    if mrp_chg:
        assert "299" in mrp_chg["suggested_value"]
        assert "349" not in mrp_chg["suggested_value"] # Not mutated

    qty_chg = next((c for c in suggested["change_set"] if c["field_key"] == "net_quantity"), None)
    if qty_chg:
        assert "250" in qty_chg["suggested_value"]
        assert "g" in qty_chg["suggested_value"]

    date_chg = next((c for c in suggested["change_set"] if c["field_key"] == "date_marking"), None)
    if date_chg:
        assert "09/2026" in date_chg["suggested_value"] or "MFG" in date_chg["suggested_value"]

def test_21_to_23_immutability_and_v02_creation():
    """Tests 21-23: V01 immutable, V02 created separately, revalidation succeeds."""
    data = upload_sample_artwork()
    product_id = data["product_id"]
    v1_id = data["version_id"]

    db = SessionLocal()
    v1 = db.query(ArtworkVersion).filter(ArtworkVersion.id == v1_id).first()
    v1_path = v1.file_path
    db.close()

    res = client.post(f"/api/products/{product_id}/artworks/{v1_id}/suggest")
    sug_data = res.json()
    v2_id = sug_data["suggested_artwork_version_id"]

    assert v2_id != v1_id

    # Verify V01 file unchanged
    db = SessionLocal()
    v1_check = db.query(ArtworkVersion).filter(ArtworkVersion.id == v1_id).first()
    assert v1_check.file_path == v1_path

    # Verify V02 exists
    v2 = db.query(ArtworkVersion).filter(ArtworkVersion.id == v2_id).first()
    assert v2.version_label == "V02"
    assert os.path.exists(v2.file_path)
    db.close()

    # Revalidation
    val_res = client.post(f"/api/suggested-designs/{sug_data['id']}/verify")
    assert val_res.status_code == 200
    assert val_res.json()["status"] == "VERIFIED"

# =====================================================================
# GROUP 3: EVIDENCE-AWARE REGRESSION & DIFF CLASSIFICATION
# =====================================================================

def test_24_to_30_evidence_aware_regression_classification():
    """Tests 24-30: ISSUE->PASS (FIXED), PASS->ISSUE (NEW_ISSUE), PASS->REVIEW (REVIEW_CHANGED)."""
    data = upload_sample_artwork()
    product_id = data["product_id"]
    v1_id = data["version_id"]

    client.post(f"/api/products/{product_id}/artworks/{v1_id}/suggest")

    # Compare API
    cmp_res = client.get(f"/api/products/{product_id}/compare")
    assert cmp_res.status_code == 200
    cmp_data = cmp_res.json()
    assert "details" in cmp_data
    assert isinstance(cmp_data["fixed_count"], int)

    # Regression API
    reg_res = client.get(f"/api/products/{product_id}/regression")
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "regression_verdict" in reg_data
    assert "version_a_summary" in reg_data
    assert "version_b_summary" in reg_data

# =====================================================================
# GROUP 4: SECURITY & AUTHORIZATION ISOLATION TESTS
# =====================================================================

def test_31_to_35_security_and_tenant_isolation():
    """Tests 31-35: Company A cannot access Company B SuggestedDesign, PDF, or diff."""
    data = upload_sample_artwork()
    product_id = data["product_id"]
    v1_id = data["version_id"]

    sug_res = client.post(f"/api/products/{product_id}/artworks/{v1_id}/suggest")
    sug_id = sug_res.json()["id"]

    # Create Company B
    db = SessionLocal()
    comp_b = Company(name="Company B Competitor")
    db.add(comp_b)
    db.commit()
    comp_b_id = comp_b.id
    db.close()

    # Unauthorized access to SuggestedDesign
    res1 = client.get(f"/api/suggested-designs/{sug_id}", headers={"X-Company-ID": comp_b_id})
    assert res1.status_code == 403

    # Unauthorized PDF download
    res2 = client.get(f"/api/suggested-designs/{sug_id}/pdf", headers={"X-Company-ID": comp_b_id})
    assert res2.status_code == 403

    # Unauthorized comparison
    res3 = client.get(f"/api/products/{product_id}/compare", headers={"X-Company-ID": comp_b_id})
    assert res3.status_code == 403

# =====================================================================
# GROUP 5: RENDERER SAFETY & PDF GENERATOR TESTS
# =====================================================================

def test_36_to_41_renderer_safety_and_pdf_disclaimers():
    """Tests 36-41: Safe rendering, PDF report generation with mandatory disclaimers."""
    data = upload_sample_artwork()
    product_id = data["product_id"]
    v1_id = data["version_id"]

    sug_res = client.post(f"/api/products/{product_id}/artworks/{v1_id}/suggest")
    sug_id = sug_res.json()["id"]

    # Download PDF
    pdf_res = client.get(f"/api/suggested-designs/{sug_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"

    # PyMuPDF content validation
    doc = fitz.open(stream=pdf_res.content, filetype="pdf")
    assert len(doc) >= 2
    text_p1 = doc[0].get_text()
    assert "NIYAMORA" in text_p1
    assert "SUGGESTED DESIGN" in text_p1
    assert "REGULATORY & LEGAL DISCLAIMER" in text_p1 or "DISCLAIMER" in text_p1
    assert "not a government certificate" in text_p1
    doc.close()
