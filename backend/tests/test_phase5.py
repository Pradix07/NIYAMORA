import os
import io
import uuid
import pytest
from fastapi.testclient import TestClient
import fitz  # PyMuPDF
from PIL import Image

os.environ["DATABASE_URL"] = "sqlite:///./test_niyamora_phase5.db"
os.environ["STORAGE_DIR"] = "./test_storage/uploads_phase5"

import app.models
from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.artwork import Artwork
from app.models.artwork_version import ArtworkVersion
from app.models.inspection import Inspection
from app.models.compliance import Evaluation, Finding, Evidence, HumanReview
from app.models.suggested_design import AuditEvent
from app.rules.engine import ComplianceEngine
from app.core.security import hash_password, verify_password, decode_access_token

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
    page.insert_text((40, 500), f"Consumer Care: {consumer_care}", fontsize=8)
    if origin:
        page.insert_text((40, 530), f"Country of Origin: {origin}", fontsize=8)
    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()
    pdf_bytes.seek(0)
    return pdf_bytes


# ============================================================
# PHASE 5 TEST 1: User Signup and Cryptographic Password Hashing
# ============================================================
def test_user_signup_and_password_hashing():
    payload = {
        "name": "Jane Compliance Officer",
        "email": "jane@aurabotanicals.com",
        "password": "SecurePassword123!",
        "company_name": "Aura Botanicals Ltd",
        "role": "COMPANY_USER"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "jane@aurabotanicals.com"
    assert data["user"]["name"] == "Jane Compliance Officer"
    assert data["user"]["company_name"] == "Aura Botanicals Ltd"

    # Verify directly in DB that password is salted & hashed (not plain text)
    db = SessionLocal()
    user = db.query(User).filter(User.email == "jane@aurabotanicals.com").first()
    assert user is not None
    assert user.password_hash != "SecurePassword123!"
    assert verify_password("SecurePassword123!", user.password_hash) is True
    assert verify_password("WrongPassword", user.password_hash) is False

    # Check audit event recorded
    audit = db.query(AuditEvent).filter(AuditEvent.entity_id == user.id, AuditEvent.action == "AUTH_SIGNUP").first()
    assert audit is not None
    db.close()


# ============================================================
# PHASE 5 TEST 2: User Login & JWT Token Issuance & Credential Rejection
# ============================================================
def test_user_login_success_and_invalid_credentials():
    # 1. Signup user
    signup_payload = {
        "name": "Alex Reviewer",
        "email": "alex@nutrisnacks.in",
        "password": "CorrectSecret456!",
        "company_name": "NutriSnacks India",
        "role": "REVIEWER"
    }
    signup_res = client.post("/api/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201

    # 2. Login with correct credentials
    login_payload = {
        "email": "alex@nutrisnacks.in",
        "password": "CorrectSecret456!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    decoded = decode_access_token(token_data["access_token"])
    assert decoded is not None
    assert decoded["email"] == "alex@nutrisnacks.in"
    assert decoded["role"] == "REVIEWER"

    # 3. Login with wrong password -> 401
    bad_login = client.post("/api/auth/login", json={"email": "alex@nutrisnacks.in", "password": "WrongPassword!"})
    assert bad_login.status_code == 401

    # 4. Login with non-existent user -> 401
    unknown_login = client.post("/api/auth/login", json={"email": "unknown@domain.com", "password": "anypassword"})
    assert unknown_login.status_code == 401


# ============================================================
# PHASE 5 TEST 3: Protected Route Authentication (/api/auth/me)
# ============================================================
def test_auth_me_protected_endpoint():
    # 1. Request without token -> 401
    no_auth_res = client.get("/api/auth/me")
    assert no_auth_res.status_code == 401

    # 2. Request with malformed token -> 401
    bad_auth_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert bad_auth_res.status_code == 401

    # 3. Create user & request with valid Bearer token -> 200
    signup_res = client.post("/api/auth/signup", json={
        "name": "Priya Sharma",
        "email": "priya@organics.in",
        "password": "ValidPassword999!",
        "company_name": "Organics India",
        "role": "COMPANY_USER"
    })
    token = signup_res.json()["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "priya@organics.in"
    assert me_data["name"] == "Priya Sharma"
    assert me_data["company_name"] == "Organics India"


# ============================================================
# PHASE 5 TEST 4: Multi-Tenant Company Isolation on Product CRUD
# ============================================================
def test_multi_tenant_product_isolation():
    # Create Company A and User A
    res_a = client.post("/api/auth/signup", json={
        "name": "User Alpha",
        "email": "alpha@companya.com",
        "password": "PasswordA123!",
        "company_name": "Company Alpha",
        "role": "COMPANY_USER"
    })
    token_a = res_a.json()["access_token"]

    # Create Company B and User B
    res_b = client.post("/api/auth/signup", json={
        "name": "User Beta",
        "email": "beta@companyb.com",
        "password": "PasswordB123!",
        "company_name": "Company Beta",
        "role": "COMPANY_USER"
    })
    token_b = res_b.json()["access_token"]

    # User A creates a product
    prod_payload = {
        "name": "Alpha Premium Tea Pouch",
        "brand": "Alpha Teas",
        "category": "Beverages",
        "packaging_type": "POUCH",
        "net_quantity": "500g",
        "sku": "ALP-TEA-500"
    }
    prod_res = client.post("/api/products", json=prod_payload, headers={"Authorization": f"Bearer {token_a}"})
    assert prod_res.status_code == 201
    product_a_id = prod_res.json()["id"]

    # User A can list their product
    list_a = client.get("/api/products", headers={"Authorization": f"Bearer {token_a}"})
    assert list_a.status_code == 200
    assert any(p["id"] == product_a_id for p in list_a.json())

    # User B lists products -> User A's product is NOT visible to User B
    list_b = client.get("/api/products", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    assert not any(p["id"] == product_a_id for p in list_b.json())

    # User B attempts direct access to User A's product -> 403 Forbidden
    direct_b = client.get(f"/api/products/{product_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert direct_b.status_code == 403


# ============================================================
# PHASE 5 TEST 5: Cross-Company Inspection and Finding Boundary
# ============================================================
def test_cross_company_inspection_and_finding_isolation():
    # User A
    res_a = client.post("/api/auth/signup", json={
        "name": "Alice QA",
        "email": "alice@foodcorp.com",
        "password": "PasswordA123!",
        "company_name": "FoodCorp Alpha",
        "role": "COMPANY_USER"
    })
    token_a = res_a.json()["access_token"]

    # User B
    res_b = client.post("/api/auth/signup", json={
        "name": "Bob QA",
        "email": "bob@dairycorp.com",
        "password": "PasswordB123!",
        "company_name": "DairyCorp Beta",
        "role": "COMPANY_USER"
    })
    token_b = res_b.json()["access_token"]

    # User A uploads artwork and runs inspection via upload-check
    pdf_stream = create_synthetic_artwork_pdf(origin=None)  # Missing COO -> will trigger finding
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("label.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={
            "product_name": "Alpha Crunch Cereal",
            "brand": "Alpha Crunch",
            "category": "Breakfast",
            "packaging_type": "BOX",
            "net_quantity": "400g"
        },
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert upload_res.status_code == 201
    upload_data = upload_res.json()
    inspection_id = upload_data["inspection_id"]

    # User A can view evaluations, findings, evidence
    eval_a = client.get(f"/api/inspections/{inspection_id}/evaluations", headers={"Authorization": f"Bearer {token_a}"})
    assert eval_a.status_code == 200
    find_a = client.get(f"/api/inspections/{inspection_id}/findings", headers={"Authorization": f"Bearer {token_a}"})
    assert find_a.status_code == 200

    # User B cannot access evaluations, findings, evidence (403 Forbidden)
    eval_b = client.get(f"/api/inspections/{inspection_id}/evaluations", headers={"Authorization": f"Bearer {token_b}"})
    assert eval_b.status_code == 403
    find_b = client.get(f"/api/inspections/{inspection_id}/findings", headers={"Authorization": f"Bearer {token_b}"})
    assert find_b.status_code == 403
    evi_b = client.get(f"/api/inspections/{inspection_id}/evidence", headers={"Authorization": f"Bearer {token_b}"})
    assert evi_b.status_code == 403


# ============================================================
# PHASE 5 TEST 6: Human Review Decision Persistence & Audit Trail
# ============================================================
def test_human_review_persistence_and_audit():
    res = client.post("/api/auth/signup", json={
        "name": "Sarah Reviewer",
        "email": "sarah@packagingco.com",
        "password": "Password123!",
        "company_name": "Packaging Co",
        "role": "REVIEWER"
    })
    token = res.json()["access_token"]

    pdf_stream = create_synthetic_artwork_pdf()
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("label.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Herbal Tea", "brand": "Herbal Co", "category": "Tea", "packaging_type": "POUCH"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_res.status_code == 201
    inspection_id = upload_res.json()["inspection_id"]

    findings = client.get(f"/api/inspections/{inspection_id}/findings", headers={"Authorization": f"Bearer {token}"}).json()
    finding_id = findings[0]["id"] if findings else None

    # Submit human review decision
    review_payload = {
        "inspection_id": inspection_id,
        "finding_id": finding_id,
        "reviewer_name": "Sarah Reviewer",
        "decision": "ACCEPT_RISK",
        "notes": "Verified domestic exemption under statutory guidelines. Approved for print trial."
    }
    review_res = client.post("/api/reviews", json=review_payload, headers={"Authorization": f"Bearer {token}"})
    assert review_res.status_code == 201
    review_data = review_res.json()
    assert review_data["decision"] == "ACCEPT_RISK"
    assert review_data["reviewer_name"] == "Sarah Reviewer"

    # Verify review list
    list_rev = client.get(f"/api/reviews?inspection_id={inspection_id}", headers={"Authorization": f"Bearer {token}"})
    assert list_rev.status_code == 200
    assert len(list_rev.json()) >= 1
    assert list_rev.json()[0]["decision"] == "ACCEPT_RISK"


# ============================================================
# PHASE 5 TEST 7: Label Passport Ledger & Provenance Aggregation
# ============================================================
def test_label_passport_endpoint_provenance():
    res = client.post("/api/auth/signup", json={
        "name": "Deepak Auditor",
        "email": "deepak@organicsplus.in",
        "password": "Password123!",
        "company_name": "Organics Plus",
        "role": "COMPANY_USER"
    })
    token = res.json()["access_token"]

    pdf_stream = create_synthetic_artwork_pdf(product_name="Millet Flakes")
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("label.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Millet Flakes", "brand": "Organics Plus", "category": "Food", "packaging_type": "POUCH"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_res.status_code == 201
    product_id = upload_res.json()["product_id"]

    # Fetch Label Passport
    passport_res = client.get(f"/api/products/{product_id}/passport", headers={"Authorization": f"Bearer {token}"})
    assert passport_res.status_code == 200
    passport = passport_res.json()

    assert passport["product_id"] == product_id
    assert passport["product_name"] == "Millet Flakes"
    assert len(passport["versions"]) >= 1
    assert len(passport["inspections"]) >= 1
    assert "disclaimer" in passport
    assert "not a government certificate" in passport["disclaimer"].lower()


# ============================================================
# PHASE 5 TEST 8: Secure File Access & Storage Boundary
# ============================================================
def test_secure_file_access_boundary():
    # User A
    res_a = client.post("/api/auth/signup", json={
        "name": "User Alpha",
        "email": "alpha_files@companya.com",
        "password": "PasswordA123!",
        "company_name": "Alpha Files Corp",
        "role": "COMPANY_USER"
    })
    token_a = res_a.json()["access_token"]

    # User B
    res_b = client.post("/api/auth/signup", json={
        "name": "User Beta",
        "email": "beta_files@companyb.com",
        "password": "PasswordB123!",
        "company_name": "Beta Files Corp",
        "role": "COMPANY_USER"
    })
    token_b = res_b.json()["access_token"]

    # Upload file under User A
    pdf_stream = create_synthetic_artwork_pdf()
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("alpha_label.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Alpha Drink", "brand": "Alpha", "category": "Drink", "packaging_type": "BOTTLE"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert upload_res.status_code == 201
    version_id = upload_res.json()["version_id"]

    # User A can get file preview
    preview_a = client.get(f"/api/files/preview/{version_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert preview_a.status_code == 200

    # User B cannot access User A's artwork preview -> 403 Forbidden
    preview_b = client.get(f"/api/files/preview/{version_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert preview_b.status_code == 403

    # Non-existent version -> 404
    non_existent = client.get(f"/api/files/preview/{str(uuid.uuid4())}", headers={"Authorization": f"Bearer {token_a}"})
    assert non_existent.status_code == 404


# ============================================================
# PHASE 5 TEST 9: Role-Based Access Control (RBAC) Server-Side Enforcement
# ============================================================
def test_rbac_require_role_enforcement():
    from app.api.deps import require_role
    from fastapi import Depends

    # Define a temporary test endpoint in the FastAPI app to verify server-side role enforcement
    @app.get("/api/test-rbac-admin")
    def rbac_admin_only_route(user=Depends(require_role(["ADMIN"]))):
        return {"status": "ok", "user": user.email}

    # 1. Create standard company user
    res_user = client.post("/api/auth/signup", json={
        "name": "Standard Operator",
        "email": "operator@standard.com",
        "password": "Password123!",
        "company_name": "Standard Co",
        "role": "COMPANY_USER"
    })
    token_user = res_user.json()["access_token"]

    # 2. Create admin user
    res_admin = client.post("/api/auth/signup", json={
        "name": "Super Admin",
        "email": "admin@standard.com",
        "password": "Password123!",
        "company_name": "Standard Co",
        "role": "ADMIN"
    })
    token_admin = res_admin.json()["access_token"]

    # 3. Standard user attempts admin route -> 403 Forbidden
    res_forbidden = client.get("/api/test-rbac-admin", headers={"Authorization": f"Bearer {token_user}"})
    assert res_forbidden.status_code == 403
    assert "Forbidden" in res_forbidden.json()["detail"]

    # 4. Admin user accesses admin route -> 200 OK
    res_allowed = client.get("/api/test-rbac-admin", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_allowed.status_code == 200
    assert res_allowed.json()["status"] == "ok"


# ============================================================
# PHASE 5 TEST 10: Cross-Company Report & PDF Download Isolation
# ============================================================
def test_cross_company_report_pdf_download_isolation():
    # User A (Company A)
    res_a = client.post("/api/auth/signup", json={
        "name": "User Alpha",
        "email": "alpha_reports@companya.com",
        "password": "PasswordA123!",
        "company_name": "Alpha Reports Corp",
        "role": "COMPANY_USER"
    })
    token_a = res_a.json()["access_token"]

    # User B (Company B)
    res_b = client.post("/api/auth/signup", json={
        "name": "User Beta",
        "email": "beta_reports@companyb.com",
        "password": "PasswordB123!",
        "company_name": "Beta Reports Corp",
        "role": "COMPANY_USER"
    })
    token_b = res_b.json()["access_token"]

    # User A uploads artwork
    pdf_stream = create_synthetic_artwork_pdf(product_name="Alpha Crunch")
    upload_res = client.post(
        "/api/upload-check",
        files={"file": ("alpha_report.pdf", pdf_stream.getvalue(), "application/pdf")},
        data={"product_name": "Alpha Crunch", "brand": "Alpha", "category": "Food", "packaging_type": "BOX"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert upload_res.status_code == 201
    product_id = upload_res.json()["product_id"]
    version_id = upload_res.json()["version_id"]

    # User A generates suggested design improvement
    suggest_res = client.post(
        f"/api/products/{product_id}/artworks/{version_id}/suggest",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert suggest_res.status_code == 201
    design_id = suggest_res.json()["id"]

    # User A can download their report PDF
    pdf_a = client.get(f"/api/suggested-designs/{design_id}/pdf", headers={"Authorization": f"Bearer {token_a}"})
    assert pdf_a.status_code == 200
    assert pdf_a.headers["content-type"] == "application/pdf"
    assert len(pdf_a.content) > 100

    # User B cannot download User A's report PDF -> 403 Forbidden
    pdf_b = client.get(f"/api/suggested-designs/{design_id}/pdf", headers={"Authorization": f"Bearer {token_b}"})
    assert pdf_b.status_code == 403

    # User B cannot get User A's suggested design details -> 403 Forbidden
    detail_b = client.get(f"/api/suggested-designs/{design_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert detail_b.status_code == 403


# ============================================================
# PHASE 5 TEST 11: Production JWT Secret Fail-Closed Hardening
# ============================================================
def test_production_jwt_secret_fail_closed(monkeypatch):
    from app.core.security import get_jwt_secret

    # 1. In production with no JWT_SECRET_KEY -> Must fail fast
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError) as exc_info:
        get_jwt_secret()
    assert "JWT_SECRET_KEY must be explicitly configured" in str(exc_info.value)

    # 2. In production with development fallback secret -> Must fail fast
    monkeypatch.setenv("JWT_SECRET_KEY", "dev_secret_key_niyamora")
    with pytest.raises(RuntimeError) as exc_info:
        get_jwt_secret()
    assert "Development fallbacks are strictly prohibited" in str(exc_info.value)

    # 3. In production with explicit cryptographic secret -> Must succeed
    monkeypatch.setenv("JWT_SECRET_KEY", "prod_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0")
    secret = get_jwt_secret()
    assert secret == "prod_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0"


# ============================================================
# PHASE 5 TEST 12: Production Database Safety & PostgreSQL Enforcement
# ============================================================
def test_production_database_safety_postgresql_enforced():
    from app.db.session import validate_database_configuration

    # 1. Production with SQLite -> Must fail fast
    with pytest.raises(RuntimeError) as exc_info:
        validate_database_configuration("sqlite:///./niyamora.db", "production")
    assert "PostgreSQL DATABASE_URL" in str(exc_info.value)

    # 2. Production with empty database URL -> Must fail fast
    with pytest.raises(RuntimeError) as exc_info:
        validate_database_configuration("", "production")
    assert "PostgreSQL DATABASE_URL" in str(exc_info.value)

    # 3. Production with valid PostgreSQL URL -> Must succeed
    validate_database_configuration("postgresql://niyamora_admin:secure_pass@db.prod.internal:5432/niyamora_prod", "production")

    # 4. Development with SQLite -> Permitted
    validate_database_configuration("sqlite:///./niyamora_dev.db", "development")


