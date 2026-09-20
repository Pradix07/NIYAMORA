import os
import io
import pytest
from fastapi.testclient import TestClient
import fitz  # PyMuPDF
from PIL import Image, ImageDraw

os.environ["DATABASE_URL"] = "sqlite:///./test_niyamora_phase3.db"
os.environ["STORAGE_DIR"] = "./test_storage/uploads_phase3"

import app.models
from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.models.company import Company
from app.models.product import Product
from app.models.compliance import RuleSource, Rule, RuleVersion, Evaluation, Finding, Evidence, HumanReview
from app.rules.engine import ComplianceEngine

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
    net_qty="250 g",
    mrp="Rs. 299.00 (inclusive of all taxes)",
    mfg_date="MFG: 09/2026",
    mfg_address="Manufactured by: Aura Botanicals Pvt Ltd, Plot 42 Industrial Area, Bengaluru, Karnataka 560100",
    consumer_care="For complaints contact Consumer Care at care@aurabotanicals.com | Toll Free 1800-425-9988",
    origin=None,
    usp="DEFAULT"
) -> io.BytesIO:
    doc = fitz.open()
    page = doc.new_page(width=400, height=600)

    page.insert_text((40, 50), brand.upper(), fontsize=12)
    page.insert_text((40, 80), product_name, fontsize=16)
    page.insert_text((40, 380), f"Net Qty: {net_qty}", fontsize=12)
    page.insert_text((40, 410), f"MRP: {mrp}", fontsize=10)
    page.insert_text((40, 440), mfg_date, fontsize=10)
    page.insert_text((40, 470), mfg_address, fontsize=8)
    page.insert_text((40, 500), consumer_care, fontsize=8)
    if origin:
        page.insert_text((40, 530), f"Country of Origin: {origin}", fontsize=9)
    
    if usp == "DEFAULT":
        page.insert_text((40, 550), "USP: Rs. 1.20 / g", fontsize=9)
    elif usp is not None:
        page.insert_text((40, 550), f"USP: {usp}", fontsize=9)

    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)
    return pdf_bytes

def test_statutory_rule_catalog_and_sources_seeded():
    """Verify official DCA source catalog and 8 versioned Legal Metrology rules."""
    res = client.get("/api/rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 8
    
    rule_codes = [r["rule_code"] for r in rules]
    assert "LMPC-DECL-MFG-ADDR" in rule_codes
    assert "LMPC-DECL-COMMODITY-NAME" in rule_codes
    assert "LMPC-DECL-NET-QTY" in rule_codes
    assert "LMPC-DECL-DATE" in rule_codes
    assert "LMPC-DECL-MRP" in rule_codes
    assert "LMPC-DECL-USP" in rule_codes
    assert "LMPC-DECL-CONSUMER-CARE" in rule_codes
    assert "LMPC-DECL-COUNTRY-ORIGIN" in rule_codes

    res_src = client.get("/api/rules/sources")
    assert res_src.status_code == 200
    sources = res_src.json()
    assert any("2011" in s["title"] for s in sources)

def test_compliant_package_evaluation_flow():
    """Test fully compliant domestic package evaluates to PASS with all declarations detected."""
    pdf = create_synthetic_artwork_pdf(
        brand="Aura Botanicals",
        product_name="Organic Chia Crunch",
        net_qty="250 g",
        mrp="₹299.00 (inclusive of all taxes)",
        mfg_date="MFG: 09/2026",
        mfg_address="Manufactured by: Aura Botanicals, Plot 42 Ind Area, Bengaluru 560100",
        consumer_care="Consumer Care: care@aurabotanicals.com | Helpline 1800-425-9988"
    )

    res = client.post(
        "/api/upload-check",
        files={"file": ("Chia_Compliant.pdf", pdf, "application/pdf")},
        data={"product_name": "Organic Chia Crunch", "brand": "Aura Botanicals", "packaging_type": "Stand-Up Pouch"}
    )
    assert res.status_code == 201
    insp_id = res.json()["inspection_id"]

    res_insp = client.get(f"/api/inspections/{insp_id}")
    assert res_insp.status_code == 200
    data = res_insp.json()
    assert data["compliance_verdict"] == "PASS"
    assert data["compliance_score"] >= 85.0

    # Check evaluations
    res_eval = client.get(f"/api/inspections/{insp_id}/evaluations")
    assert res_eval.status_code == 200
    evals = res_eval.json()
    assert len(evals) >= 8
    
    # Net quantity, MRP, Manufacturer, Date, Consumer Care should all be PASS
    status_map = {e["rule_code"]: e["status"] for e in evals}
    assert status_map["LMPC-DECL-NET-QTY"] == "PASS"
    assert status_map["LMPC-DECL-MRP"] == "PASS"
    assert status_map["LMPC-DECL-MFG-ADDR"] == "PASS"
    assert status_map["LMPC-DECL-DATE"] == "PASS"
    assert status_map["LMPC-DECL-CONSUMER-CARE"] == "PASS"
    assert status_map["LMPC-DECL-COUNTRY-ORIGIN"] == "N/A"  # Domestic pack -> N/A

def test_prohibited_unit_abbreviation_causes_issue():
    """Test using prohibited abbreviation 'gms' instead of statutory 'g' triggers ISSUE under Rule 11 & Sch II."""
    pdf = create_synthetic_artwork_pdf(
        net_qty="500 gms",  # Prohibited abbreviation
        mrp="₹450.00 (incl. of all taxes)"
    )

    res = client.post(
        "/api/upload-check",
        files={"file": ("Illegal_Unit.pdf", pdf, "application/pdf")},
        data={"product_name": "Almond Flour", "brand": "Aura", "packaging_type": "Pouch"}
    )
    assert res.status_code == 201
    insp_id = res.json()["inspection_id"]

    res_insp = client.get(f"/api/inspections/{insp_id}")
    assert res_insp.status_code == 200
    assert res_insp.json()["compliance_verdict"] == "ISSUE"

    res_findings = client.get(f"/api/inspections/{insp_id}/findings")
    assert res_findings.status_code == 200
    findings = res_findings.json()
    assert any(f["rule_code"] == "LMPC-DECL-NET-QTY" and "prohibited abbreviation" in f["summary"].lower() for f in findings)

def test_missing_tax_inclusive_phrase_causes_issue():
    """Test MRP declared without mandatory '(inclusive of all taxes)' triggers ISSUE under Rule 6(1)(e)."""
    # Create PDF with MRP 299 without any tax clause in the entire document
    doc = fitz.open()
    page = doc.new_page(width=400, height=600)
    page.insert_text((40, 50), "AURA BOTANICALS", fontsize=12)
    page.insert_text((40, 80), "Organic Chia Crunch", fontsize=16)
    page.insert_text((40, 380), "Net Qty: 250 g", fontsize=12)
    page.insert_text((40, 410), "MRP: Rs. 299.00", fontsize=10) # Missing inclusive of all taxes
    page.insert_text((40, 440), "MFG: 09/2026", fontsize=10)
    page.insert_text((40, 470), "Manufactured by: Aura, Plot 1, Bengaluru 560100", fontsize=8)
    page.insert_text((40, 500), "Helpline: 1800-425-9988", fontsize=8)
    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)

    res = client.post(
        "/api/upload-check",
        files={"file": ("MRP_Missing_Tax.pdf", pdf_bytes, "application/pdf")},
        data={"product_name": "Chia Crunch", "brand": "Aura", "packaging_type": "Pouch"}
    )
    assert res.status_code == 201
    insp_id = res.json()["inspection_id"]

    res_findings = client.get(f"/api/inspections/{insp_id}/findings")
    assert res_findings.status_code == 200
    findings = res_findings.json()
    assert any(f["rule_code"] == "LMPC-DECL-MRP" and "inclusive of all taxes" in f["summary"].lower() for f in findings)

def test_unit_sale_price_applicability_for_large_packs():
    """Test package exceeding 1 kg requires Unit Sale Price (USP) on per-kg basis under Rule 6(11)."""
    # 1. Pack with 2 kg and no USP -> ISSUE
    pdf_large = create_synthetic_artwork_pdf(
        net_qty="2 kg",
        mrp="₹800.00 (inclusive of all taxes)",
        usp=None
    )
    res1 = client.post(
        "/api/upload-check",
        files={"file": ("Chia_2kg_No_USP.pdf", pdf_large, "application/pdf")},
        data={"product_name": "Bulk Chia 2kg", "brand": "Aura", "packaging_type": "Bag"}
    )
    assert res1.status_code == 201
    insp1_id = res1.json()["inspection_id"]

    res_eval1 = client.get(f"/api/inspections/{insp1_id}/evaluations")
    status_map1 = {e["rule_code"]: e["status"] for e in res_eval1.json()}
    assert status_map1["LMPC-DECL-USP"] == "ISSUE"

    # 2. Pack with 2 kg with valid USP per kg -> PASS
    pdf_large_usp = create_synthetic_artwork_pdf(
        net_qty="2 kg",
        mrp="Rs. 800.00 (inclusive of all taxes)",
        usp="Rs. 400.00 / kg"
    )
    res2 = client.post(
        "/api/upload-check",
        files={"file": ("Chia_2kg_With_USP.pdf", pdf_large_usp, "application/pdf")},
        data={"product_name": "Bulk Chia 2kg", "brand": "Aura", "packaging_type": "Bag"}
    )
    assert res2.status_code == 201
    insp2_id = res2.json()["inspection_id"]

    res_eval2 = client.get(f"/api/inspections/{insp2_id}/evaluations")
    status_map2 = {e["rule_code"]: e["status"] for e in res_eval2.json()}
    assert status_map2["LMPC-DECL-USP"] == "PASS"

def test_imported_product_country_of_origin_check():
    """Test imported product requires country of origin under Rule 6(1)(aa)."""
    # Domestic pack -> N/A
    pdf_domestic = create_synthetic_artwork_pdf()
    res_dom = client.post(
        "/api/upload-check",
        files={"file": ("Domestic.pdf", pdf_domestic, "application/pdf")},
        data={"product_name": "Domestic Jam", "brand": "Aura", "packaging_type": "Jar"}
    )
    insp_dom_id = res_dom.json()["inspection_id"]
    eval_dom = client.get(f"/api/inspections/{insp_dom_id}/evaluations").json()
    status_dom = {e["rule_code"]: e["status"] for e in eval_dom}
    assert status_dom["LMPC-DECL-COUNTRY-ORIGIN"] == "N/A"

    # Imported pack with origin -> PASS
    pdf_imp = create_synthetic_artwork_pdf(origin="Switzerland")
    res_imp = client.post(
        "/api/upload-check",
        files={"file": ("Imported_With_Origin.pdf", pdf_imp, "application/pdf")},
        data={"product_name": "Imported Chocolate", "brand": "Aura", "packaging_type": "Carton"}
    )
    insp_imp_id = res_imp.json()["inspection_id"]
    eval_imp = client.get(f"/api/inspections/{insp_imp_id}/evaluations").json()
    status_imp = {e["rule_code"]: e["status"] for e in eval_imp}
    assert status_imp["LMPC-DECL-COUNTRY-ORIGIN"] == "PASS"

def test_deterministic_reproducibility():
    """Verify that evaluating the exact same package twice yields identical evaluations and scores."""
    pdf = create_synthetic_artwork_pdf()
    
    # Run 1
    res1 = client.post(
        "/api/upload-check",
        files={"file": ("Repro_Test.pdf", pdf, "application/pdf")},
        data={"product_name": "Chia Seeds", "brand": "Aura", "packaging_type": "Pouch"}
    )
    insp1_id = res1.json()["inspection_id"]
    evals1 = client.get(f"/api/inspections/{insp1_id}/evaluations").json()
    score1 = client.get(f"/api/inspections/{insp1_id}").json()["compliance_score"]

    # Re-evaluating inspection directly
    from app.services.pipeline import InspectionPipelineService
    db = SessionLocal()
    InspectionPipelineService.execute_inspection(db, insp1_id)
    db.close()

    evals2 = client.get(f"/api/inspections/{insp1_id}/evaluations").json()
    score2 = client.get(f"/api/inspections/{insp1_id}").json()["compliance_score"]

    assert score1 == score2
    assert len(evals1) == len(evals2)
    for e1, e2 in zip(evals1, evals2):
        assert e1["rule_code"] == e2["rule_code"]
        assert e1["status"] == e2["status"]

def test_human_review_workflow_and_audit_log():
    """Verify human review submission records specialist audit log without corrupting machine evaluation."""
    pdf = create_synthetic_artwork_pdf(
        mfg_address="Manufactured by Aura"  # Incomplete address -> REVIEW
    )
    res = client.post(
        "/api/upload-check",
        files={"file": ("Review_Candidate.pdf", pdf, "application/pdf")},
        data={"product_name": "Chia Review", "brand": "Aura", "packaging_type": "Pouch"}
    )
    insp_id = res.json()["inspection_id"]

    # Get findings
    findings = client.get(f"/api/inspections/{insp_id}/findings").json()
    assert len(findings) > 0
    target_finding = findings[0]

    # Submit human review decision
    review_payload = {
        "inspection_id": insp_id,
        "finding_id": target_finding["id"],
        "reviewer_name": "Devin Vance (Senior Legal Metrology Auditor)",
        "decision": "APPROVED_PASS",
        "notes": "Verified plant registration certificate and verified address on dieline back flap."
    }
    res_review = client.post("/api/reviews", json=review_payload)
    assert res_review.status_code == 201
    review_record = res_review.json()
    assert review_record["decision"] == "APPROVED_PASS"
    assert "registration certificate" in review_record["notes"]

    # Machine evaluation remains intact
    evals = client.get(f"/api/inspections/{insp_id}/evaluations").json()
    assert len(evals) >= 8

def test_cross_company_compliance_isolation():
    """Verify Company B cannot access Company A's evaluations, findings, or reviews."""
    db = SessionLocal()
    comp_a = Company(name="Comp A Enterprise")
    comp_b = Company(name="Comp B Competitor")
    db.add_all([comp_a, comp_b])
    db.commit()
    db.refresh(comp_a)
    db.refresh(comp_b)
    comp_a_id = comp_a.id
    comp_b_id = comp_b.id
    db.close()

    # Company A uploads artwork
    pdf = create_synthetic_artwork_pdf()
    res_a = client.post(
        "/api/upload-check",
        files={"file": ("CompA_Pack.pdf", pdf, "application/pdf")},
        data={"product_name": "Secret Recipe", "brand": "CompA", "packaging_type": "Box"},
        headers={"X-Company-ID": comp_a_id}
    )
    insp_a_id = res_a.json()["inspection_id"]

    # Company B tries to view Company A's evaluations -> 403 Forbidden
    res_eval_b = client.get(f"/api/inspections/{insp_a_id}/evaluations", headers={"X-Company-ID": comp_b_id})
    assert res_eval_b.status_code == 403

    # Company B tries to view Company A's findings -> 403 Forbidden
    res_find_b = client.get(f"/api/inspections/{insp_a_id}/findings", headers={"X-Company-ID": comp_b_id})
    assert res_find_b.status_code == 403

def test_future_effective_ecommerce_rule_not_active_today():
    """Verify that Rule 6(10A) (effective 2027-07-01 for e-commerce listings) is not evaluated as a packaging artwork violation today."""
    # Check rule catalog contains the version
    res_rules = client.get("/api/rules")
    assert res_rules.status_code == 200
    rules = res_rules.json()
    ecom_rule = next((r for r in rules if r["rule_code"] == "LMPC-ECOM-COUNTRY-ORIGIN-FILTER"), None)
    assert ecom_rule is not None
    assert any(v["status"] == "FUTURE_EFFECTIVE" for v in ecom_rule["versions"])

    # On a normal physical package check, this rule should NOT be evaluated as a failure
    pdf = create_synthetic_artwork_pdf()
    res = client.post(
        "/api/upload-check",
        files={"file": ("PhysicalPack.pdf", pdf, "application/pdf")},
        data={"product_name": "Physical Oatmeal", "brand": "Aura", "packaging_type": "Pouch"}
    )
    assert res.status_code == 201
    insp_id = res.json()["inspection_id"]

    evals = client.get(f"/api/inspections/{insp_id}/evaluations").json()
    # Ensure no failure is generated for future e-commerce rule
    assert not any(e["rule_code"] == "LMPC-ECOM-COUNTRY-ORIGIN-FILTER" and e["status"] == "ISSUE" for e in evals)

def test_no_evidence_no_pass_generic_name():
    """Verify that omitting generic product name from artwork returns REVIEW and never PASS."""
    # Create PDF with NO generic product name
    doc = fitz.open()
    page = doc.new_page(width=400, height=600)
    page.insert_text((40, 50), "AURA", fontsize=12) # Only brand
    page.insert_text((40, 380), "Net Qty: 250 g", fontsize=12)
    page.insert_text((40, 410), "MRP: Rs. 299.00 (incl. of all taxes)", fontsize=10)
    page.insert_text((40, 440), "MFG: 09/2026", fontsize=10)
    page.insert_text((40, 470), "Manufactured by: Aura, Plot 1, Bengaluru 560100", fontsize=8)
    page.insert_text((40, 500), "Helpline: 1800-425-9988", fontsize=8)
    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)

    res = client.post(
        "/api/upload-check",
        files={"file": ("NoGenericName.pdf", pdf_bytes, "application/pdf")},
        data={"product_name": "Unknown Product", "brand": "Aura", "packaging_type": "Pouch"}
    )
    insp_id = res.json()["inspection_id"]
    evals = client.get(f"/api/inspections/{insp_id}/evaluations").json()
    status_map = {e["rule_code"]: e["status"] for e in evals}
    assert status_map["LMPC-DECL-COMMODITY-NAME"] != "PASS"

def test_missing_net_quantity_usp_returns_review():
    """Verify that when net quantity is missing, USP evaluation returns REVIEW to prevent assuming N/A."""
    # Create PDF with no net quantity
    doc = fitz.open()
    page = doc.new_page(width=400, height=600)
    page.insert_text((40, 50), "AURA BOTANICALS", fontsize=12)
    page.insert_text((40, 80), "Organic Superfood", fontsize=16)
    page.insert_text((40, 410), "MRP: Rs. 299.00 (incl. of all taxes)", fontsize=10)
    page.insert_text((40, 440), "MFG: 09/2026", fontsize=10)
    page.insert_text((40, 470), "Manufactured by: Aura, Plot 1, Bengaluru 560100", fontsize=8)
    page.insert_text((40, 500), "Helpline: 1800-425-9988", fontsize=8)
    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)

    res = client.post(
        "/api/upload-check",
        files={"file": ("No_NetQty.pdf", pdf_bytes, "application/pdf")},
        data={"product_name": "Superfood", "brand": "Aura", "packaging_type": "Pouch"}
    )
    insp_id = res.json()["inspection_id"]
    evals = client.get(f"/api/inspections/{insp_id}/evaluations").json()
    print("\nDEBUG EVALS:", [{e["rule_code"]: e["status"], "obs": e.get("observed_value"), "expl": e.get("explanation")} for e in evals])
    status_map = {e["rule_code"]: e["status"] for e in evals}
    assert status_map["LMPC-DECL-USP"] == "REVIEW"

def test_statutory_gazette_citations_and_rule_references():
    """Verify that all source citations and rule provisions strictly match official Gazette publications."""
    res_src = client.get("/api/rules/sources")
    assert res_src.status_code == 200
    sources = {s["id"]: s for s in res_src.json()}

    # 1. Principal Rules 2011 must reference G.S.R. 202(E) dated 07.03.2011
    assert "202(E)" in sources["SRC-DCA-LMPC-2011"]["title"]
    assert "427(E)" not in sources["SRC-DCA-LMPC-2011"]["title"]

    # 2. 2023 Amendment must reference G.S.R. 722(E) dated 06.10.2023
    assert "722(E)" in sources["SRC-DCA-LMPC-AMEND-2023"]["title"]

    # 3. 2026 February Amendment must reference G.S.R. 128(E) dated 13.02.2026 (not 118(E))
    assert "128(E)" in sources["SRC-DCA-LMPC-AMEND-2026-FEB"]["title"]
    assert "118(E)" not in sources["SRC-DCA-LMPC-AMEND-2026-FEB"]["title"]

    # 4. 2026 April Amendment must reference G.S.R. 312(E) dated 27.04.2026
    assert "312(E)" in sources["SRC-DCA-LMPC-AMEND-2026-APR"]["title"]
    assert "290(E)" not in sources["SRC-DCA-LMPC-AMEND-2026-APR"]["title"]

    # 5. 2026 May Third Amendment must reference G.S.R. 418(E) dated 29.05.2026
    assert "418(E)" in sources["SRC-DCA-LMPC-AMEND-2026-MAY"]["title"]
    assert "350(E)" not in sources["SRC-DCA-LMPC-AMEND-2026-MAY"]["title"]

    # 6. Verify Rule 6 provisions across catalog
    res_rules = client.get("/api/rules")
    assert res_rules.status_code == 200
    rules_map = {r["rule_code"]: r for r in res_rules.json()}

    # MRP must reference Rule 6(1)(e)
    assert "6(1)(e)" in rules_map["LMPC-DECL-MRP"]["description"]
    assert "6(1)(da)" not in rules_map["LMPC-DECL-MRP"]["description"]

    # Country of Origin must reference Rule 6(1)(aa)
    assert "6(1)(aa)" in rules_map["LMPC-DECL-COUNTRY-ORIGIN"]["description"]

    # Consumer Care must reference Rule 6(2)
    assert "6(2)" in rules_map["LMPC-DECL-CONSUMER-CARE"]["description"]
    assert "6(1)(g)" not in rules_map["LMPC-DECL-CONSUMER-CARE"]["description"]

    # USP must reference Rule 6(11)
    assert "6(11)" in rules_map["LMPC-DECL-USP"]["description"]

def test_usp_500g_per_gram_applicability():
    """Verify 500 g package requires per-gram USP under Rule 6(11)."""
    # 1. With per-gram USP -> PASS
    pdf_pass = create_synthetic_artwork_pdf(net_qty="500 g", mrp="₹ 250.00 (incl. of all taxes)", usp="₹ 0.50 / g")
    res1 = client.post("/api/upload-check", files={"file": ("500g_pass.pdf", pdf_pass, "application/pdf")}, data={"product_name": "Chia 500g", "brand": "Aura", "packaging_type": "Pouch"})
    evals1 = client.get(f"/api/inspections/{res1.json()['inspection_id']}/evaluations").json()
    status_map1 = {e["rule_code"]: e["status"] for e in evals1}
    assert status_map1["LMPC-DECL-USP"] == "PASS"

    # 2. Missing USP -> ISSUE
    pdf_fail = create_synthetic_artwork_pdf(net_qty="500 g", mrp="₹ 250.00 (incl. of all taxes)", usp=None)
    res2 = client.post("/api/upload-check", files={"file": ("500g_fail.pdf", pdf_fail, "application/pdf")}, data={"product_name": "Chia 500g", "brand": "Aura", "packaging_type": "Pouch"})
    evals2 = client.get(f"/api/inspections/{res2.json()['inspection_id']}/evaluations").json()
    status_map2 = {e["rule_code"]: e["status"] for e in evals2}
    assert status_map2["LMPC-DECL-USP"] == "ISSUE"

def test_usp_500ml_per_millilitre_applicability():
    """Verify 500 ml package requires per-millilitre USP under Rule 6(11)."""
    # 1. With per-ml USP -> PASS
    pdf_pass = create_synthetic_artwork_pdf(net_qty="500 ml", mrp="₹ 150.00 (incl. of all taxes)", usp="₹ 0.30 / ml")
    res1 = client.post("/api/upload-check", files={"file": ("500ml_pass.pdf", pdf_pass, "application/pdf")}, data={"product_name": "Juice 500ml", "brand": "Aura", "packaging_type": "Bottle"})
    evals1 = client.get(f"/api/inspections/{res1.json()['inspection_id']}/evaluations").json()
    status_map1 = {e["rule_code"]: e["status"] for e in evals1}
    assert status_map1["LMPC-DECL-USP"] == "PASS"

    # 2. Missing USP -> ISSUE
    pdf_fail = create_synthetic_artwork_pdf(net_qty="500 ml", mrp="₹ 150.00 (incl. of all taxes)", usp=None)
    res2 = client.post("/api/upload-check", files={"file": ("500ml_fail.pdf", pdf_fail, "application/pdf")}, data={"product_name": "Juice 500ml", "brand": "Aura", "packaging_type": "Bottle"})
    evals2 = client.get(f"/api/inspections/{res2.json()['inspection_id']}/evaluations").json()
    status_map2 = {e["rule_code"]: e["status"] for e in evals2}
    assert status_map2["LMPC-DECL-USP"] == "ISSUE"

def test_usp_2l_per_litre_applicability():
    """Verify 2 L package requires per-litre USP under Rule 6(11)."""
    # 1. With per-litre USP -> PASS
    pdf_pass = create_synthetic_artwork_pdf(net_qty="2 l", mrp="₹ 400.00 (incl. of all taxes)", usp="₹ 200.00 / L")
    res1 = client.post("/api/upload-check", files={"file": ("2L_pass.pdf", pdf_pass, "application/pdf")}, data={"product_name": "Oil 2L", "brand": "Aura", "packaging_type": "Can"})
    evals1 = client.get(f"/api/inspections/{res1.json()['inspection_id']}/evaluations").json()
    status_map1 = {e["rule_code"]: e["status"] for e in evals1}
    assert status_map1["LMPC-DECL-USP"] == "PASS"

def test_usp_number_based_package_applicability():
    """Verify commodities sold by number/count (units, tablets, pieces) require per-number/unit USP under Rule 6(11)."""
    # 1. '10 units' with per-unit USP -> PASS
    pdf_units = create_synthetic_artwork_pdf(net_qty="10 units", mrp="₹ 50.00 (incl. of all taxes)", usp="₹ 5.00 / unit")
    res1 = client.post("/api/upload-check", files={"file": ("10units_pass.pdf", pdf_units, "application/pdf")}, data={"product_name": "Soap 10 Units", "brand": "Aura", "packaging_type": "Box"})
    evals1 = client.get(f"/api/inspections/{res1.json()['inspection_id']}/evaluations").json()
    status_map1 = {e["rule_code"]: e["status"] for e in evals1}
    assert status_map1["LMPC-DECL-USP"] == "PASS"

    # 2. '10 tablets' with per-tablet USP -> PASS
    pdf_tabs = create_synthetic_artwork_pdf(net_qty="10 tablets", mrp="₹ 25.00 (incl. of all taxes)", usp="₹ 2.50 per tablet")
    res2 = client.post("/api/upload-check", files={"file": ("10tabs_pass.pdf", pdf_tabs, "application/pdf")}, data={"product_name": "Vitamin C 10 Tablets", "brand": "Aura", "packaging_type": "Blister"})
    evals2 = client.get(f"/api/inspections/{res2.json()['inspection_id']}/evaluations").json()
    status_map2 = {e["rule_code"]: e["status"] for e in evals2}
    assert status_map2["LMPC-DECL-USP"] == "PASS"

    # 3. '10 N' (Newton SI notation) is not interpreted as count for USP -> REVIEW
    pdf_newton = create_synthetic_artwork_pdf(net_qty="10 N", mrp="₹ 50.00 (incl. of all taxes)", usp=None)
    res3 = client.post("/api/upload-check", files={"file": ("10Newton.pdf", pdf_newton, "application/pdf")}, data={"product_name": "Tension Spring", "brand": "Aura", "packaging_type": "Box"})
    evals3 = client.get(f"/api/inspections/{res3.json()['inspection_id']}/evaluations").json()
    status_map3 = {e["rule_code"]: e["status"] for e in evals3}
    assert status_map3["LMPC-DECL-USP"] == "REVIEW"

def test_usp_state_excise_liquor_exemption_na():
    """Verify alcoholic beverages subject to State Excise laws are marked N/A with State Excise scope note under Rule 6(11)."""
    pdf = create_synthetic_artwork_pdf(net_qty="750 ml", mrp="₹ 1200.00 (incl. of all taxes)", usp=None)
    res = client.post("/api/upload-check", files={"file": ("Whisky.pdf", pdf, "application/pdf")}, data={"product_name": "Single Malt Whisky", "brand": "Aura", "packaging_type": "Bottle", "category": "Alcoholic Beverages"})
    evals = client.get(f"/api/inspections/{res.json()['inspection_id']}/evaluations").json()
    status_map = {e["rule_code"]: e["status"] for e in evals}
    expl_map = {e["rule_code"]: e.get("explanation", "") for e in evals}
    assert status_map["LMPC-DECL-USP"] == "N/A"
    assert "State Excise" in expl_map["LMPC-DECL-USP"]

def test_usp_1kg_per_kg_and_proviso():
    """Verify 1 kg package requires per-kg basis and satisfies RSP=USP proviso under Rule 6(11)."""
    # 1. With explicit per-kg USP -> PASS
    pdf_declared = create_synthetic_artwork_pdf(net_qty="1 kg", mrp="₹ 450.00 (incl. of all taxes)", usp="₹ 450.00 / kg")
    res1 = client.post("/api/upload-check", files={"file": ("1kg_decl.pdf", pdf_declared, "application/pdf")}, data={"product_name": "Flour 1kg", "brand": "Aura", "packaging_type": "Bag"})
    evals1 = client.get(f"/api/inspections/{res1.json()['inspection_id']}/evaluations").json()
    status_map1 = {e["rule_code"]: e["status"] for e in evals1}
    assert status_map1["LMPC-DECL-USP"] == "PASS"

    # 2. Without separate USP -> PASS under RSP = USP proviso
    pdf_proviso = create_synthetic_artwork_pdf(net_qty="1 kg", mrp="₹ 450.00 (incl. of all taxes)", usp=None)
    res2 = client.post("/api/upload-check", files={"file": ("1kg_proviso.pdf", pdf_proviso, "application/pdf")}, data={"product_name": "Flour 1kg", "brand": "Aura", "packaging_type": "Bag"})
    evals2 = client.get(f"/api/inspections/{res2.json()['inspection_id']}/evaluations").json()
    status_map2 = {e["rule_code"]: e["status"] for e in evals2}
    assert status_map2["LMPC-DECL-USP"] == "PASS"

def test_usp_1l_and_2l_per_litre_threshold_and_proviso():
    """Verify 1 L (proviso/per-litre) and 2 L (per-litre required) under Rule 6(11)."""
    # 1. 1 L package with declared per-litre USP -> PASS
    pdf_1l_decl = create_synthetic_artwork_pdf(net_qty="1 l", mrp="₹ 180.00 (incl. of all taxes)", usp="₹ 180.00 / L")
    res1 = client.post("/api/upload-check", files={"file": ("1L_decl.pdf", pdf_1l_decl, "application/pdf")}, data={"product_name": "Juice 1L", "brand": "Aura", "packaging_type": "Bottle"})
    evals1 = client.get(f"/api/inspections/{res1.json()['inspection_id']}/evaluations").json()
    assert {e["rule_code"]: e["status"] for e in evals1}["LMPC-DECL-USP"] == "PASS"

    # 2. 1 L package without separate USP -> PASS under RSP = USP proviso
    pdf_1l_proviso = create_synthetic_artwork_pdf(net_qty="1 l", mrp="₹ 180.00 (incl. of all taxes)", usp=None)
    res2 = client.post("/api/upload-check", files={"file": ("1L_proviso.pdf", pdf_1l_proviso, "application/pdf")}, data={"product_name": "Juice 1L", "brand": "Aura", "packaging_type": "Bottle"})
    evals2 = client.get(f"/api/inspections/{res2.json()['inspection_id']}/evaluations").json()
    assert {e["rule_code"]: e["status"] for e in evals2}["LMPC-DECL-USP"] == "PASS"

    # 3. 2 L package without USP -> ISSUE (multi-pack requires separate per-litre declaration)
    pdf_2l_fail = create_synthetic_artwork_pdf(net_qty="2 l", mrp="₹ 350.00 (incl. of all taxes)", usp=None)
    res3 = client.post("/api/upload-check", files={"file": ("2L_fail.pdf", pdf_2l_fail, "application/pdf")}, data={"product_name": "Oil 2L", "brand": "Aura", "packaging_type": "Can"})
    evals3 = client.get(f"/api/inspections/{res3.json()['inspection_id']}/evaluations").json()
    assert {e["rule_code"]: e["status"] for e in evals3}["LMPC-DECL-USP"] == "ISSUE"

def test_usp_length_threshold_per_cm_and_per_metre():
    """Verify length packages: < 1 m (e.g. 500 mm / 50 cm) requires per-cm; >= 1 m (1 m) requires per-metre under Rule 6(11)."""
    # 1. 500 mm (< 1 m) with per-cm USP -> PASS
    pdf_500mm = create_synthetic_artwork_pdf(net_qty="500 mm", mrp="₹ 100.00 (incl. of all taxes)", usp="₹ 2.00 / cm")
    res1 = client.post("/api/upload-check", files={"file": ("500mm_pass.pdf", pdf_500mm, "application/pdf")}, data={"product_name": "Ribbon 500mm", "brand": "Aura", "packaging_type": "Roll"})
    evals1 = client.get(f"/api/inspections/{res1.json()['inspection_id']}/evaluations").json()
    assert {e["rule_code"]: e["status"] for e in evals1}["LMPC-DECL-USP"] == "PASS"

    # 2. 500 mm without USP -> ISSUE
    pdf_500mm_fail = create_synthetic_artwork_pdf(net_qty="500 mm", mrp="₹ 100.00 (incl. of all taxes)", usp=None)
    res2 = client.post("/api/upload-check", files={"file": ("500mm_fail.pdf", pdf_500mm_fail, "application/pdf")}, data={"product_name": "Ribbon 500mm", "brand": "Aura", "packaging_type": "Roll"})
    evals2 = client.get(f"/api/inspections/{res2.json()['inspection_id']}/evaluations").json()
    assert {e["rule_code"]: e["status"] for e in evals2}["LMPC-DECL-USP"] == "ISSUE"

    # 3. 1 m package with per-metre USP -> PASS
    pdf_1m = create_synthetic_artwork_pdf(net_qty="1 m", mrp="₹ 150.00 (incl. of all taxes)", usp="₹ 150.00 / m")
    res3 = client.post("/api/upload-check", files={"file": ("1m_pass.pdf", pdf_1m, "application/pdf")}, data={"product_name": "Wire 1m", "brand": "Aura", "packaging_type": "Pack"})
    evals3 = client.get(f"/api/inspections/{res3.json()['inspection_id']}/evaluations").json()
    assert {e["rule_code"]: e["status"] for e in evals3}["LMPC-DECL-USP"] == "PASS"

    # 4. 1 m package without separate USP -> PASS under RSP = USP proviso
    pdf_1m_proviso = create_synthetic_artwork_pdf(net_qty="1 m", mrp="₹ 150.00 (incl. of all taxes)", usp=None)
    res4 = client.post("/api/upload-check", files={"file": ("1m_proviso.pdf", pdf_1m_proviso, "application/pdf")}, data={"product_name": "Wire 1m", "brand": "Aura", "packaging_type": "Pack"})
    evals4 = client.get(f"/api/inspections/{res4.json()['inspection_id']}/evaluations").json()
    assert {e["rule_code"]: e["status"] for e in evals4}["LMPC-DECL-USP"] == "PASS"




