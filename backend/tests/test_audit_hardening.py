import os
import pytest
from app.db.session import Base, engine, SessionLocal
from app.rules.engine import ComplianceEngine
from app.processors.structurer import PackagingFieldStructurer
from app.schemas.inspection import TextBlock, BoundingBoxCoord
from app.rules.evaluators.generic_name_evaluator import GenericNameEvaluator
from app.rules.evaluators.net_quantity_evaluator import NetQuantityEvaluator
from app.rules.evaluators.mrp_evaluator import MRPEvaluator
from app.rules.evaluators.date_evaluator import DateDeclarationEvaluator
from app.services.suggested_design_engine import SuggestedDesignEngine
from app.services.comparison_engine import ComparisonEngine
from app.services.regression_engine import RegressionEngine
from app.models.company import Company
from app.models.product import Product
from app.models.artwork import Artwork
from app.models.artwork_version import ArtworkVersion
from app.models.inspection import Inspection
from app.models.compliance import Evaluation, Finding, Rule, RuleVersion

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    ComplianceEngine.ensure_rules_seeded(db)
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_company(db_session):
    company = Company(
        name="Test Audit Corp"
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company

def test_storage_text_never_becomes_brand_or_product_name():
    """Verify storage instructions are never misclassified as brand or product name."""
    storage_block = TextBlock(
        id="blk_storage",
        text="Store in a cool and dry place away from direct sunlight",
        confidence=0.95,
        bbox=[10, 10, 50, 20],
        normalized_box=BoundingBoxCoord(x=10, y=10, width=40, height=10, panel_type="FRONT")
    )
    storage_header = TextBlock(
        id="blk_hdr",
        text="Storage Instructions",
        confidence=0.96,
        bbox=[10, 25, 50, 35],
        normalized_box=BoundingBoxCoord(x=10, y=25, width=40, height=10, panel_type="FRONT")
    )

    raw_text = "Storage Instructions\nStore in a cool and dry place away from direct sunlight\nKeep sealed"
    fields = PackagingFieldStructurer.structure_fields(raw_text, [storage_header, storage_block])

    # Brand and Product Name MUST NOT be storage instructions
    assert fields["brand"].extracted_value != "Storage Instructions"
    assert fields["brand"].extracted_value != "Store in a cool and dry place away from direct sunlight"
    assert fields["product_name"].extracted_value != "Store in a cool and dry place away from direct sunlight"
    assert fields["product_name"].extracted_value != "Storage Instructions"

    # GenericNameEvaluator MUST NOT accept storage text
    evaluator = GenericNameEvaluator()
    status, obs, exp, expl, ev_data, act = evaluator.evaluate(
        rule_version=None,
        extracted_fields=fields,
        raw_text=raw_text,
        blocks=[storage_header, storage_block],
        product_context={}
    )
    assert status == "REVIEW"
    assert obs != "Store in a cool and dry place away from direct sunlight"

def test_nutrition_protein_never_becomes_net_quantity():
    """Verify that nutrition protein (e.g. 21.2 g) is never extracted as Net Quantity."""
    nutrition_block = TextBlock(
        id="blk_nutr",
        text="Nutrition Facts per 100g:\nEnergy 550 kcal\nProtein 21.2 g\nCarbohydrate 10.5 g\nFat 50.6 g",
        confidence=0.95,
        bbox=[10, 10, 60, 60],
        normalized_box=BoundingBoxCoord(x=10, y=10, width=50, height=50, panel_type="FRONT")
    )
    raw_text = nutrition_block.text

    fields = PackagingFieldStructurer.structure_fields(raw_text, [nutrition_block])
    assert fields["net_quantity"].status == "NOT_FOUND" or fields["net_quantity"].extracted_value is None

    evaluator = NetQuantityEvaluator()
    status, obs, exp, expl, ev_data, act = evaluator.evaluate(
        rule_version=None,
        extracted_fields=fields,
        raw_text=raw_text,
        blocks=[nutrition_block],
        product_context={}
    )
    assert status == "REVIEW"
    assert obs is None or "21.2" not in str(obs)

def test_mrp_evaluator_requires_tax_clause_in_mrp_block():
    """Verify MRP evaluator fails if MRP line has no tax phrase, even if 'tax' appears elsewhere."""
    evaluator = MRPEvaluator()
    
    # Text with MRP omitting taxes, but unrelated word 'tax' elsewhere
    raw_text = "MRP Rs. 299.00\nThis product is subject to local syntax and tax regulations."
    fields = {
        "mrp": {
            "extracted_value": "299.00",
            "evidence_box": {"x": 10, "y": 10, "width": 30, "height": 5}
        }
    }
    status, obs, exp, expl, ev_data, act = evaluator.evaluate(
        rule_version=None,
        extracted_fields=fields,
        raw_text=raw_text,
        blocks=[],
        product_context={}
    )
    # Must be ISSUE because the MRP declaration itself lacks the statutory tax-inclusive phrase
    assert status == "ISSUE"
    assert "omits mandatory statutory phrase" in expl

    # When tax-inclusive phrase is adjacent to MRP
    raw_text_compliant = "MRP Rs. 299.00 (inclusive of all taxes)"
    fields_compliant = {
        "mrp": {
            "extracted_value": "299.00",
            "evidence_box": {"x": 10, "y": 10, "width": 40, "height": 5}
        }
    }
    status2, obs2, exp2, expl2, ev_data2, act2 = evaluator.evaluate(
        rule_version=None,
        extracted_fields=fields_compliant,
        raw_text=raw_text_compliant,
        blocks=[],
        product_context={}
    )
    assert status2 == "PASS"

def test_date_evaluator_checks_date_markings_key():
    """Verify DateDeclarationEvaluator recognizes date_markings from structurer."""
    evaluator = DateDeclarationEvaluator()
    fields = {
        "date_markings": {
            "extracted_value": "09/2026",
            "evidence_box": {"x": 10, "y": 20, "width": 20, "height": 5}
        }
    }
    raw_text = "Mfg Date: 09/2026"
    status, obs, exp, expl, ev_data, act = evaluator.evaluate(
        rule_version=None,
        extracted_fields=fields,
        raw_text=raw_text,
        blocks=[],
        product_context={}
    )
    assert status == "PASS"
    assert obs == "09/2026"
    assert ev_data["bbox"] is not None

def test_suggested_design_zero_hallucinations(db_session, test_company):
    """Verify that SuggestedDesignEngine does not hallucinate fake dates, fake emails, or fake phones."""
    prod = Product(
        company_id=test_company.id,
        name="Artisanal Tea",
        brand="NatureLeaf",
        category="Beverages",
        packaging_type="Pouch",
        sku="SKU-TEA-001"
    )
    db_session.add(prod)
    db_session.commit()

    art = Artwork(product_id=prod.id, name="Artisanal Tea Master")
    db_session.add(art)
    db_session.commit()

    ver = ArtworkVersion(
        artwork_id=art.id,
        version_number=1,
        file_path="mock/path.png",
        original_filename="tea.png",
        mime_type="image/png",
        file_size_bytes=1024
    )
    db_session.add(ver)
    db_session.commit()

    insp = Inspection(product_id=prod.id, artwork_version_id=ver.id, status="COMPLETED")
    db_session.add(insp)
    db_session.commit()

    # Use seeded RuleVersion for Date
    rv = db_session.query(RuleVersion).filter(RuleVersion.rule_code == "LMPC-DECL-DATE").first()
    assert rv is not None

    ev = Evaluation(
        inspection_id=insp.id,
        rule_version_id=rv.id,
        status="ISSUE",
        expected_condition="Date declaration required",
        explanation="Date not found"
    )
    db_session.add(ev)
    db_session.commit()

    finding = Finding(
        inspection_id=insp.id,
        evaluation_id=ev.id,
        rule_code="LMPC-DECL-DATE",
        severity="MANDATORY",
        status="OPEN",
        title="Missing Date",
        summary="Date not found",
        requirement="Rule 6(1)(d)",
        suggested_action="Add month and year of manufacture"
    )
    db_session.add(finding)
    db_session.commit()

    suggested = SuggestedDesignEngine.generate_suggested_design(db_session, prod.id, ver.id)
    changes = suggested.change_set or []
    date_change = next((c for c in changes if c.get("rule_code") == "LMPC-DECL-DATE"), None)
    assert date_change is not None
    # Must be a placeholder, not a hallucinated date like current month/year
    assert "[MM/YYYY]" in date_change["suggested_value"]

def test_comparison_engine_does_not_fabricate_pass(db_session, test_company):
    """Verify ComparisonEngine reports actual status rather than assuming PASS for V02."""
    prod = Product(company_id=test_company.id, name="Snack Pack", brand="SnackCo", category="Food", packaging_type="Pouch", sku="SKU-SNACK-1")
    db_session.add(prod)
    db_session.commit()

    art = Artwork(product_id=prod.id, name="Snack Master")
    db_session.add(art)
    db_session.commit()

    ver1 = ArtworkVersion(artwork_id=art.id, version_number=1, file_path="v1.png", original_filename="v1.png", mime_type="image/png", file_size_bytes=1024)
    ver2 = ArtworkVersion(artwork_id=art.id, version_number=2, file_path="v2.png", original_filename="v2.png", mime_type="image/png", file_size_bytes=1024)
    db_session.add_all([ver1, ver2])
    db_session.commit()

    insp1 = Inspection(product_id=prod.id, artwork_version_id=ver1.id, status="COMPLETED")
    insp2 = Inspection(product_id=prod.id, artwork_version_id=ver2.id, status="COMPLETED")
    db_session.add_all([insp1, insp2])
    db_session.commit()

    rv = db_session.query(RuleVersion).filter(RuleVersion.rule_code == "LMPC-DECL-NET-QTY").first()
    assert rv is not None

    # V01 was PASS, V02 had an ISSUE (Regression)
    ev1 = Evaluation(inspection_id=insp1.id, rule_version_id=rv.id, status="PASS", expected_condition="Req", explanation="Good")
    ev2 = Evaluation(inspection_id=insp2.id, rule_version_id=rv.id, status="ISSUE", expected_condition="Req", explanation="Regression issue")
    db_session.add_all([ev1, ev2])
    db_session.commit()

    comp = ComparisonEngine.compare_artwork_versions(db_session, prod.id, ver1.id, ver2.id)
    assert comp.new_issue_count == 1
    detail = next(d for d in comp.details if d.rule_code == "LMPC-DECL-NET-QTY")
    assert detail.change_type == "New Issue"
    assert "Accidental regression" in detail.detail

    reg = RegressionEngine.analyze_regression(db_session, prod.id, ver1.id, ver2.id)
    assert reg.regression_verdict == "REGRESSION_DETECTED"
    assert len(reg.new_issues_introduced) == 1

def test_human_review_dynamic_recalculation(db_session, test_company):
    """Verify that human review decisions dynamically update evaluation status, counts, score, and verdict."""
    from app.api.routes.compliance import submit_human_review
    from app.schemas.compliance import HumanReviewCreate

    prod = Product(company_id=test_company.id, name="Nutiva Oil", brand="Nutiva", category="Food", packaging_type="Bottle", sku="SKU-OIL-1")
    db_session.add(prod)
    db_session.commit()

    art = Artwork(product_id=prod.id, name="Nutiva Oil Master")
    db_session.add(art)
    db_session.commit()

    ver = ArtworkVersion(artwork_id=art.id, version_number=1, file_path="oil.png", original_filename="oil.png", mime_type="image/png", file_size_bytes=1024)
    db_session.add(ver)
    db_session.commit()

    insp = Inspection(
        product_id=prod.id,
        artwork_version_id=ver.id,
        status="COMPLETED",
        findings_summary={"total": 2, "pass_count": 1, "issue_count": 0, "review_count": 1, "na_count": 0},
        compliance_score=50.0,
        compliance_verdict="NEEDS_REVIEW"
    )
    db_session.add(insp)
    db_session.commit()

    rv1 = db_session.query(RuleVersion).filter(RuleVersion.rule_code == "LMPC-DECL-NET-QTY").first()
    rv2 = db_session.query(RuleVersion).filter(RuleVersion.rule_code == "LMPC-DECL-MRP").first()
    assert rv1 is not None and rv2 is not None

    ev1 = Evaluation(inspection_id=insp.id, rule_version_id=rv1.id, status="PASS", expected_condition="Req", explanation="Good")
    ev2 = Evaluation(inspection_id=insp.id, rule_version_id=rv2.id, status="REVIEW", expected_condition="Req", explanation="Requires check")
    db_session.add_all([ev1, ev2])
    db_session.commit()

    finding = Finding(
        inspection_id=insp.id,
        evaluation_id=ev2.id,
        rule_code=rv2.rule_code,
        severity="REVIEW",
        status="OPEN",
        title="Check MRP",
        summary="Review",
        requirement="Req",
        suggested_action="Verify MRP declaration"
    )
    db_session.add(finding)
    db_session.commit()

    # 1. Specialist confirms pass
    payload_pass = HumanReviewCreate(
        inspection_id=insp.id,
        finding_id=finding.id,
        reviewer_name="Auditor One",
        decision="CONFIRM_PASS",
        notes="Verified on high-res packshot"
    )
    submit_human_review(payload=payload_pass, company=test_company, db=db_session)

    db_session.refresh(insp)
    db_session.refresh(finding)
    db_session.refresh(ev2)

    assert finding.status == "RESOLVED"
    assert ev2.status == "PASS"
    assert insp.findings_summary["pass_count"] == 2
    assert insp.findings_summary["review_count"] == 0
    assert insp.compliance_score == 100.0
    assert insp.compliance_verdict == "COMPLIANT"

    # 2. If specialist later marks as issue
    payload_issue = HumanReviewCreate(
        inspection_id=insp.id,
        finding_id=finding.id,
        reviewer_name="Auditor One",
        decision="MARK_AS_ISSUE",
        notes="Found illegible text"
    )
    submit_human_review(payload=payload_issue, company=test_company, db=db_session)

    db_session.refresh(insp)
    db_session.refresh(finding)
    db_session.refresh(ev2)

    assert finding.status == "OPEN"
    assert ev2.status == "ISSUE"
    assert insp.findings_summary["issue_count"] == 1
    assert insp.compliance_verdict == "NON_COMPLIANT"

