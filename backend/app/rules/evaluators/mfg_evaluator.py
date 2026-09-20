import re
from typing import Dict, Any, Optional, Tuple
from app.rules.evaluators.base import BaseRuleEvaluator

class ManufacturerAddressEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(a): Name and complete physical address of the manufacturer/packer/importer.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare complete name and physical address of the manufacturer, packer, or importer (Rule 6(1)(a))."
        
        mfg_field = extracted_fields.get("manufacturer") or {}
        extracted_val = mfg_field.get("extracted_value")
        evidence_box = mfg_field.get("evidence_box")

        # Check in extracted fields or raw text regex
        mfg_keywords = ["manufactured by", "mfg by", "packed by", "marketed by", "imported by", "mfd by", "produced by"]
        found_line = None

        if extracted_val and len(extracted_val.strip()) > 5:
            found_line = extracted_val.strip()
        else:
            for line in raw_text.splitlines():
                line_lower = line.lower()
                if any(kw in line_lower for kw in mfg_keywords):
                    found_line = line.strip()
                    break

        if not found_line:
            return (
                "REVIEW",
                None,
                expected_cond,
                "Manufacturer/packer declaration could not be reliably located in the uploaded artwork.",
                None,
                "Add explicit 'Manufactured by / Packed by: [Name & Address]' block on packaging dieline."
            )

        # Assess completeness: does it contain an entity name and some address indication (city, state, pin, street)?
        lower_val = found_line.lower()
        has_address_cues = any(cue in lower_val for cue in ["road", "street", "plot", "phase", "ind.", "industrial", "pincode", "pin", "estate", "nagai", "nagar", "dist", "delhi", "mumbai", "bengaluru", "chennai", "kolkata", "pune", "gujarat", "maharashtra", "karnataka", "india", "box", "po", "fssai", "zone", "sector", "lane"]) or bool(re.search(r"\b\d{6}\b", found_line))

        evidence_data = {
            "source_type": "OCR",
            "observed_text": found_line,
            "extracted_value": found_line,
            "bbox": evidence_box,
            "evidence_quality": "HIGH" if has_address_cues else "MEDIUM"
        }

        if has_address_cues:
            return (
                "PASS",
                found_line,
                expected_cond,
                f"Manufacturer declaration verified with address indicators: '{found_line}'.",
                evidence_data,
                None
            )
        else:
            return (
                "REVIEW",
                found_line,
                expected_cond,
                f"Manufacturer name located ('{found_line}'), but complete postal address / pincode requires manual verification.",
                evidence_data,
                "Ensure complete postal address including city, state, and postal code is legibly printed."
            )
