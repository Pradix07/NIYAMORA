import json
from unittest.mock import MagicMock, patch
import pytest
from app.services.ai_extractor import AIExtractionService, EXTRACTED_FIELD_DEFAULTS
from app.schemas.inspection import ExtractedField, TextBlock, BoundingBoxCoord
from app.core.config import settings


def test_coerce_normalization():
    """Verify _coerce normalizes LLM outputs, cleans missing values, and calculates weight units."""
    raw_payload = {
        "manufacturer_address": "  M/s Organic Foods Ltd, Plot 42, Mumbai - 400001  ",
        "commodity_name": "Organic Almonds",
        "brand": "PureHarvest",
        "net_quantity": "500 g",
        "mfg_date": "08/2026",
        "mrp": "350.00",
        "usp": "₹0.70 per g",
        "consumer_care": "care@pureharvest.in, 1800-123-456",
        "fssai_number": "10020011002345",
        "category": "Food",
        "package_weight_value": 500,
        "package_weight_unit": "g",
        "ingredients": "Raw Almonds (100%)",
        "allergen_warning": "Contains tree nuts (almonds)",
        "country_of_origin": "India"
    }
    coerced = AIExtractionService._coerce(raw_payload)
    assert coerced["manufacturer_address"] == "M/s Organic Foods Ltd, Plot 42, Mumbai - 400001"
    assert coerced["commodity_name"] == "Organic Almonds"
    assert coerced["brand"] == "PureHarvest"
    assert coerced["net_quantity"] == "500 g"
    assert coerced["fssai_number"] == "10020011002345"
    assert coerced["category"] == "food"
    assert coerced["package_weight_value"] == 500.0
    assert coerced["package_weight_unit"] == "g"


def test_coerce_converts_kg_and_litres():
    """Verify _coerce converts kilograms and litres to grams and millilitres."""
    kg_payload = {
        "net_quantity": "1.5 kg",
        "package_weight_value": 1.5,
        "package_weight_unit": "kg"
    }
    coerced = AIExtractionService._coerce(kg_payload)
    assert coerced["package_weight_value"] == 1500.0
    assert coerced["package_weight_unit"] == "g"

    l_payload = {
        "net_quantity": "2 Litres",
        "package_weight_value": 2,
        "package_weight_unit": "litre"
    }
    coerced_l = AIExtractionService._coerce(l_payload)
    assert coerced_l["package_weight_value"] == 2000.0
    assert coerced_l["package_weight_unit"] == "ml"


def test_coerce_cleans_null_strings_no_hallucination():
    """Verify strings like 'N/A', 'none', 'unknown' are coerced to None."""
    payload = {
        "manufacturer_address": "n/a",
        "fssai_number": "none",
        "usp": "null",
        "allergen_warning": "UNKNOWN"
    }
    coerced = AIExtractionService._coerce(payload)
    assert coerced["manufacturer_address"] is None
    assert coerced["fssai_number"] is None
    assert coerced["usp"] is None
    assert coerced["allergen_warning"] is None


def test_extract_fields_mocked_groq_success():
    """Verify extract_fields calls Groq chat completion and parses JSON properly."""
    mock_groq_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "manufacturer_address": "NutriLife Agro, Industrial Area, Pune 411001",
        "commodity_name": "Chia Seeds",
        "brand": "Aura",
        "net_quantity": "250 g",
        "mfg_date": "06/2026",
        "mrp": "220",
        "usp": "₹0.88/g",
        "consumer_care": "support@auralife.com",
        "fssai_number": "10018022007890",
        "category": "food",
        "package_weight_value": 250,
        "package_weight_unit": "g",
        "ingredients": "Raw Chia Seeds",
        "allergen_warning": None,
        "country_of_origin": "India"
    })
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_groq_client.chat.completions.create.return_value = mock_response

    raw_text = "Aura Chia Seeds Net Qty: 250 g MRP: Rs 220 FSSAI: 10018022007890"
    result = AIExtractionService.extract_fields(
        raw_text=raw_text,
        groq_client=mock_groq_client
    )

    assert result is not None
    assert result["brand"] == "Aura"
    assert result["commodity_name"] == "Chia Seeds"
    assert result["net_quantity"] == "250 g"
    assert result["fssai_number"] == "10018022007890"
    assert result["mrp"] == "220"
    mock_groq_client.chat.completions.create.assert_called_once()


def test_extract_fields_with_markdown_fences():
    """Verify extract_fields handles responses wrapped in markdown ```json ``` code fences."""
    mock_groq_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = """```json
{
    "manufacturer_address": "Spice Valley Pvt Ltd, Kochi, Kerala",
    "commodity_name": "Organic Black Pepper",
    "brand": "SpiceValley",
    "net_quantity": "100 g",
    "mfg_date": "04/2026",
    "mrp": "120",
    "usp": "₹1.20 per g",
    "consumer_care": "customercare@spicevalley.com",
    "fssai_number": "11319001000123",
    "category": "food",
    "package_weight_value": 100,
    "package_weight_unit": "g",
    "ingredients": "Whole Black Peppercorns",
    "allergen_warning": null,
    "country_of_origin": "India"
}
```"""
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_groq_client.chat.completions.create.return_value = mock_response

    result = AIExtractionService.extract_fields("Sample text", groq_client=mock_groq_client)
    assert result is not None
    assert result["brand"] == "SpiceValley"
    assert result["commodity_name"] == "Organic Black Pepper"


def test_extract_fields_fallback_when_api_key_absent():
    """Verify extract_fields returns None gracefully when GROQ_API_KEY is not configured."""
    with patch.object(settings, "GROQ_API_KEY", None):
        result = AIExtractionService.extract_fields("Some packaging text", groq_client=None)
        assert result is None


def test_extract_fields_fallback_when_groq_raises_exception():
    """Verify extract_fields catches provider exceptions/timeouts and returns None."""
    mock_groq_client = MagicMock()
    mock_groq_client.chat.completions.create.side_effect = TimeoutError("Connection to Groq timed out")

    result = AIExtractionService.extract_fields("Some packaging text", groq_client=mock_groq_client)
    assert result is None


def test_extract_fields_fallback_when_malformed_json():
    """Verify extract_fields handles malformed/corrupted JSON from LLM and returns None."""
    mock_groq_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "INVALID JSON {unclosed string"
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_groq_client.chat.completions.create.return_value = mock_response

    result = AIExtractionService.extract_fields("Some packaging text", groq_client=mock_groq_client)
    assert result is None


def test_enrich_fields_with_ai_preserves_evidence_boxes():
    """Verify enrich_fields_with_ai merges AI values while attaching spatial bounding boxes."""
    existing_fields = {
        "net_quantity": ExtractedField(
            field_key="net_quantity",
            field_name="Declared Net Quantity",
            extracted_value="250 g",
            status="EXTRACTED",
            confidence=0.95,
            evidence_box=BoundingBoxCoord(x=10, y=20, width=30, height=5, label="250 g", panel_type="FRONT"),
            source="Explicit Packaging Declaration"
        ),
        "license_number": ExtractedField(
            field_key="license_number",
            field_name="FSSAI License",
            extracted_value=None,
            status="NOT_FOUND",
            confidence=0.0,
            evidence_box=None
        )
    }

    ai_data = {
        "fssai_number": "10020011002345",
        "manufacturer_address": "Packed by Himalayan Herbs, Shimla, HP",
        "commodity_name": "Herbal Tea"
    }

    blocks = [
        TextBlock(
            id="blk_1",
            text="FSSAI Lic. No. 10020011002345",
            confidence=0.92,
            bbox=[10, 50, 40, 60],
            normalized_box=BoundingBoxCoord(x=10, y=50, width=30, height=10, label="FSSAI 10020011002345", panel_type="BACK")
        ),
        TextBlock(
            id="blk_2",
            text="Packed by Himalayan Herbs, Shimla, HP",
            confidence=0.90,
            bbox=[10, 70, 50, 85],
            normalized_box=BoundingBoxCoord(x=10, y=70, width=40, height=15, label="Packed by...", panel_type="BACK")
        )
    ]

    enriched = AIExtractionService.enrich_fields_with_ai(existing_fields, ai_data, blocks)

    # Net quantity should keep its existing high-confidence verified evidence box
    assert enriched["net_quantity"].extracted_value == "250 g"
    assert enriched["net_quantity"].evidence_box.x == 10
    assert enriched["net_quantity"].evidence_box.panel_type == "FRONT"

    # FSSAI license was NOT_FOUND before, should now be EXTRACTED with spatial bounding box
    assert enriched["license_number"].status == "EXTRACTED"
    assert enriched["license_number"].extracted_value == "10020011002345"
    assert enriched["license_number"].evidence_box is not None
    assert enriched["license_number"].evidence_box.panel_type == "BACK"

    # Manufacturer was missing before, now populated with spatial evidence box
    assert enriched["manufacturer"].status == "EXTRACTED"
    assert "Himalayan Herbs" in enriched["manufacturer"].extracted_value
    assert enriched["manufacturer"].evidence_box is not None


def test_multi_panel_context_formatting():
    """Verify multi-panel context is included in AI extraction request."""
    mock_groq_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "manufacturer_address": "Packed by Co, Bangalore",
        "commodity_name": "Premium Tea",
        "brand": "Naturals",
        "net_quantity": "500 g",
        "mfg_date": "05/2026",
        "mrp": "450",
        "usp": "₹0.90/g",
        "consumer_care": "care@naturals.in",
        "fssai_number": "10015043000111",
        "category": "food",
        "package_weight_value": 500,
        "package_weight_unit": "g"
    })
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_groq_client.chat.completions.create.return_value = mock_response

    panel_context = [
        {"panel_type": "FRONT", "raw_text": "Naturals Premium Tea Net Wt: 500 g"},
        {"panel_type": "BACK", "raw_text": "MRP Rs 450 FSSAI 10015043000111 Packed by Co, Bangalore"}
    ]

    result = AIExtractionService.extract_fields(
        raw_text="Naturals Premium Tea 500g MRP 450",
        panel_context=panel_context,
        groq_client=mock_groq_client
    )

    assert result is not None
    # Check that call passed the multi-panel headers
    call_args = mock_groq_client.chat.completions.create.call_args
    user_msg = call_args[1]["messages"][1]["content"]
    assert "[FRONT PANEL]" in user_msg
    assert "[BACK PANEL]" in user_msg
