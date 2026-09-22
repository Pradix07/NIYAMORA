import os
import re
import json
import logging
from typing import Dict, Any, Optional, List
from groq import Groq

from app.core.config import settings
from app.schemas.inspection import ExtractedField, TextBlock, BoundingBoxCoord

logger = logging.getLogger("niyamora.ai_extractor")

EXTRACTED_FIELD_DEFAULTS: Dict[str, Any] = {
    "manufacturer_address": None,
    "commodity_name": None,
    "brand": None,
    "net_quantity": None,
    "mfg_date": None,
    "mrp": None,
    "usp": None,
    "consumer_care": None,
    "fssai_number": None,
    "category": "general",
    "package_weight_value": None,
    "package_weight_unit": None,
    "ingredients": None,
    "allergen_warning": None,
    "country_of_origin": None,
}

SYSTEM_PROMPT = (
    "You extract structured statutory declaration data from packaging text and OCR blocks for packaging compliance checking. "
    "Always respond with valid JSON only, no other text, no markdown formatting."
)

EXTRACTION_PROMPT = """You are analyzing packaging text extracted from a product label or artwork for compliance checking under India's Legal Metrology (Packaged Commodities) Rules, 2011 and FSSAI statutory regulations.

The text below may contain multi-panel declarations (Front, Back, Sides, Top, Bottom) or OCR text variations:
- Currency symbols like ₹ may be misread as "Rs", "R", "INR" or missing entirely
- A label and its value may appear separated or across different lines
- Minor OCR spelling errors (e.g. "FSSAI" read as "Issat", "Ssaf", or "Lic No")
- Information from multiple packaging panels is included

Extract these fields as JSON. Use null if a field is genuinely absent from the packaging text. NEVER invent or hallucinate missing information:
- manufacturer_address: full name and physical address of manufacturer/packer/importer
- commodity_name: common/generic name of the product
- brand: the brand or trade name printed on the label (NOT the manufacturer's corporate legal entity name)
- net_quantity: net quantity with unit (e.g. "30ml", "200g", "1 kg")
- mfg_date: month and year of manufacture/packing/import (e.g. "08/2026", "AUG 2026")
- mrp: retail sale price as a plain number string (e.g. "250.00" or "250")
- usp: unit sale price if explicitly declared (e.g. "₹1.00 per g" or "Rs. 2.50/ml")
- consumer_care: phone number, email, or helpline address for consumer complaints
- fssai_number: 14-digit FSSAI license number if present, null otherwise
- category: best classification - one of "food", "cosmetic", "general"
- package_weight_value: the numeric part of net quantity only (e.g. 250 for "250g"), null if absent
- package_weight_unit: "g" for mass (g, gm, gms, kg converted to g), "ml" for volume (ml, l, litre converted to ml), null if absent
- ingredients: list or string of ingredients if present
- allergen_warning: allergen advice or declaration if present
- country_of_origin: country of origin or manufacture (e.g. "India")

Return ONLY valid JSON, exactly this shape:
{"manufacturer_address": null, "commodity_name": null, "brand": null, "net_quantity": null, "mfg_date": null, "mrp": null, "usp": null, "consumer_care": null, "fssai_number": null, "category": "general", "package_weight_value": null, "package_weight_unit": null, "ingredients": null, "allergen_warning": null, "country_of_origin": null}

PACKAGING TEXT:
"""


class AIExtractionService:
    """
    AI-assisted packaging statutory declaration extractor using Groq LLM.
    Acts as an intelligent understanding layer for OCR text.
    The deterministic ComplianceEngine remains the final compliance authority.
    """

    @classmethod
    def _coerce(cls, payload: dict) -> dict:
        """Normalize the LLM output into the exact shape expected by the pipeline."""
        result = dict(EXTRACTED_FIELD_DEFAULTS)

        for key in EXTRACTED_FIELD_DEFAULTS:
            value = payload.get(key)
            if isinstance(value, str):
                value = value.strip()
                if not value or value.lower() in ("null", "none", "n/a", "na", "unknown", "undefined"):
                    value = None
            result[key] = value

        category = result.get("category")
        if not isinstance(category, str) or category.lower() not in ("food", "cosmetic", "general"):
            result["category"] = "general"
        else:
            result["category"] = category.lower()

        unit = result.get("package_weight_unit")
        if isinstance(unit, str):
            unit = unit.strip().lower()
            if unit.startswith("k") and unit in ("kg", "kgs", "kilogram", "kilograms"):
                try:
                    result["package_weight_value"] = float(result["package_weight_value"]) * 1000
                    result["package_weight_unit"] = "g"
                except (TypeError, ValueError):
                    pass
            elif unit.startswith("l") and unit in ("l", "litre", "litres", "liter", "liters"):
                try:
                    result["package_weight_value"] = float(result["package_weight_value"]) * 1000
                    result["package_weight_unit"] = "ml"
                except (TypeError, ValueError):
                    pass
            elif unit in ("g", "gm", "gms", "gram", "grams"):
                result["package_weight_unit"] = "g"
            elif unit in ("ml", "m.l.", "millilitre", "milliliter"):
                result["package_weight_unit"] = "ml"
            else:
                result["package_weight_unit"] = None

        if result.get("package_weight_value") is not None:
            try:
                result["package_weight_value"] = float(result["package_weight_value"])
            except (TypeError, ValueError):
                result["package_weight_value"] = None

        return result

    @classmethod
    def extract_fields(
        cls,
        raw_text: str,
        panel_context: Optional[List[Dict[str, Any]]] = None,
        timeout_seconds: float = 8.0,
        groq_client: Optional[Any] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Extract structured Legal Metrology fields from OCR text using Groq LLM.
        Returns normalized dictionary or None if LLM is unavailable/fails.
        """
        if not raw_text or not raw_text.strip():
            logger.debug("Empty raw text provided to AI extractor.")
            return None

        api_key = settings.GROQ_API_KEY
        if not api_key and groq_client is None:
            logger.debug("GROQ_API_KEY not configured. Skipping AI extraction; using deterministic structurer.")
            return None

        # Build prompt with panel context if available
        text_payload = raw_text.strip()
        if panel_context:
            context_blocks = []
            for p in panel_context:
                p_type = p.get("panel_type", "PANEL")
                p_txt = p.get("raw_text", "").strip()
                if p_txt:
                    context_blocks.append(f"--- [{p_type} PANEL] ---\n{p_txt}")
            if context_blocks:
                text_payload = "\n\n".join(context_blocks)

        model = settings.GROQ_MODEL or "openai/gpt-oss-120b"

        try:
            client = groq_client or Groq(api_key=api_key, timeout=timeout_seconds)
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"{EXTRACTION_PROMPT}\n{text_payload}"},
                ],
                temperature=0.1,
                max_tokens=1024,
            )
            content = response.choices[0].message.content or ""
        except Exception as exc:
            logger.warning(f"Groq AI extraction request failed or timed out: {exc}. Falling back to deterministic structurer.")
            return None

        # Clean markdown fences if present
        cleaned = content.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()

        try:
            payload = json.loads(cleaned)
            if not isinstance(payload, dict):
                logger.warning(f"Groq extraction returned non-dict JSON: {cleaned[:200]}")
                return None
            return cls._coerce(payload)
        except Exception as exc:
            logger.warning(f"Failed to parse Groq extraction JSON response: {exc}. Raw content: {cleaned[:200]}")
            return None

    @classmethod
    def enrich_fields_with_ai(
        cls,
        deterministic_fields: Dict[str, ExtractedField],
        ai_data: Dict[str, Any],
        blocks: List[TextBlock]
    ) -> Dict[str, ExtractedField]:
        """
        Enriches deterministic fields with AI extraction results.
        Preserves verified evidence bounding boxes and spatial coordinates.
        """
        enriched = dict(deterministic_fields)

        # Mapping between AI keys and ExtractedField keys & metadata
        field_mapping = {
            "net_quantity": ("net_quantity", "Declared Net Quantity"),
            "mrp": ("mrp", "Maximum Retail Price (MRP)"),
            "usp": ("usp", "Unit Sale Price (USP)"),
            "fssai_number": ("license_number", "FSSAI License / Registration"),
            "mfg_date": ("date_markings", "Date of Manufacture / Packing / Expiry"),
            "manufacturer_address": ("manufacturer", "Manufacturer / Packer Name & Address"),
            "consumer_care": ("consumer_care", "Consumer Care Contact Details"),
            "commodity_name": ("generic_name", "Generic / Common Commodity Name"),
            "country_of_origin": ("country_of_origin", "Country of Origin"),
            "brand": ("brand", "Brand Identity"),
            "ingredients": ("ingredients", "Ingredients Declaration"),
            "allergen_warning": ("allergen_warning", "Allergen Advisory"),
        }

        for ai_key, (field_key, field_name) in field_mapping.items():
            ai_val = ai_data.get(ai_key)
            if not ai_val or not str(ai_val).strip():
                continue

            ai_val_str = str(ai_val).strip()
            existing = enriched.get(field_key)

            # If existing field was NOT_FOUND or lacks value, populate from AI
            if not existing or existing.status != "EXTRACTED" or not existing.extracted_value:
                # Find matching spatial block for evidence box
                matching_box = cls._find_spatial_box_for_text(ai_val_str, blocks)
                enriched[field_key] = ExtractedField(
                    field_key=field_key,
                    field_name=field_name,
                    extracted_value=ai_val_str,
                    status="EXTRACTED",
                    confidence=0.92,
                    evidence_box=matching_box,
                    source="AI Packaging Extractor (Groq)"
                )
            else:
                # If existing field already extracted with high-confidence tight box, preserve it
                # but if existing was low confidence without evidence box, attach AI context
                if not existing.evidence_box:
                    matching_box = cls._find_spatial_box_for_text(ai_val_str, blocks)
                    if matching_box:
                        existing.evidence_box = matching_box

        # Also store commodity name as product_name if product_name was NOT_FOUND
        if ai_data.get("commodity_name"):
            existing_prod = enriched.get("product_name")
            if not existing_prod or existing_prod.status != "EXTRACTED" or not existing_prod.extracted_value:
                prod_box = cls._find_spatial_box_for_text(str(ai_data["commodity_name"]), blocks)
                enriched["product_name"] = ExtractedField(
                    field_key="product_name",
                    field_name="Product Name / Commercial Descriptor",
                    extracted_value=str(ai_data["commodity_name"]).strip(),
                    status="EXTRACTED",
                    confidence=0.90,
                    evidence_box=prod_box,
                    source="AI Packaging Extractor (Groq)"
                )

        return enriched

    @classmethod
    def _find_spatial_box_for_text(cls, query_text: str, blocks: List[TextBlock]) -> Optional[BoundingBoxCoord]:
        """Finds the tightest spatial bounding box in blocks matching query text or tokens."""
        if not query_text or not blocks:
            return None

        query_clean = query_text.lower().strip()
        tokens = [t for t in re.split(r"\s+", query_clean) if len(t) >= 3]

        # 1. Exact substring match in block text
        for b in blocks:
            if query_clean in b.text.lower():
                return b.normalized_box

        # 2. Token overlap match
        best_block = None
        max_overlap = 0
        for b in blocks:
            b_lower = b.text.lower()
            overlap = sum(1 for tok in tokens if tok in b_lower)
            if overlap > max_overlap and overlap >= max(1, len(tokens) // 2):
                max_overlap = overlap
                best_block = b

        if best_block:
            return best_block.normalized_box

        return None
