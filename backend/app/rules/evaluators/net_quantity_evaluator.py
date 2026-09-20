import re
from typing import Dict, Any, Optional, Tuple
from app.rules.evaluators.base import BaseRuleEvaluator

class NetQuantityEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(c) & Rule 11 & Second Schedule:
    Net quantity in terms of standard unit of weight or measure using statutory metric symbols.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare net quantity in standard statutory metric units (e.g. 'g', 'kg', 'ml', 'l', 'N') without prohibited abbreviations like 'gms' or 'lts' (Rule 6(1)(c), Rule 11)."

        qty_field = extracted_fields.get("net_quantity") or {}
        extracted_val = qty_field.get("extracted_value")
        evidence_box = qty_field.get("evidence_box")

        # Fallback raw text search if extracted_val is empty
        candidate_text = extracted_val
        if not candidate_text:
            match = re.search(r"(?:net\s*(?:qty|quantity|wt|weight)?[:.\s-]*)?(\d+(?:\.\d+)?\s*(?:gms?|kgs?|ml|lts?|litres?|grams?|kg|g|mg|N|units?))\b", raw_text, re.IGNORECASE)
            if match:
                candidate_text = match.group(0).strip()

        if not candidate_text:
            return (
                "REVIEW",
                None,
                expected_cond,
                "Net quantity declaration could not be reliably located on the packaging dieline.",
                None,
                "Add clear Net Quantity declaration on the principal display panel (e.g. 'Net Qty: 250 g')."
            )

        observed = candidate_text.strip()
        observed_lower = observed.lower()

        # Check for prohibited non-standard abbreviations under Rule 11 & Schedule II
        prohibited_abbrs = ["gms", "gms.", "kgs", "kgs.", "lts", "lts.", "cc", "cc.", "kilos"]
        for p_abbr in prohibited_abbrs:
            # Match prohibited as a standalone unit token e.g. 500 gms
            if re.search(rf"\b\d+\s*{re.escape(p_abbr)}\b", observed_lower) or re.search(rf"\b{re.escape(p_abbr)}\b", observed_lower):
                evidence_data = {
                    "source_type": "OCR",
                    "observed_text": observed,
                    "extracted_value": observed,
                    "bbox": evidence_box,
                    "evidence_quality": "HIGH"
                }
                return (
                    "ISSUE",
                    observed,
                    expected_cond,
                    f"Declared unit representation '{observed}' contains prohibited abbreviation '{p_abbr}'. Statutory Legal Metrology rules mandate standard metric symbols ('g' instead of 'gms', 'kg' instead of 'kgs', 'l'/'ml' instead of 'lts').",
                    evidence_data,
                    f"Replace prohibited abbreviation '{p_abbr}' with approved statutory metric symbol (e.g. 'g', 'kg', 'ml', 'l')."
                )

        # Verify valid metric unit presence
        valid_unit_pattern = r"\b(\d+(?:\.\d+)?)\s*(mg|g|kg|ml|l|cl|N|U|units?|pieces?|g\b|kg\b|ml\b|l\b)\b"
        unit_match = re.search(valid_unit_pattern, observed_lower)

        evidence_data = {
            "source_type": "OCR",
            "observed_text": observed,
            "extracted_value": observed,
            "bbox": evidence_box,
            "evidence_quality": "HIGH"
        }

        if unit_match:
            qty_num = unit_match.group(1)
            unit_sym = unit_match.group(2)
            return (
                "PASS",
                observed,
                expected_cond,
                f"Net quantity '{observed}' satisfies statutory metric unit representation ({qty_num} {unit_sym}).",
                evidence_data,
                None
            )
        else:
            return (
                "REVIEW",
                observed,
                expected_cond,
                f"Net quantity text located ('{observed}'), but metric unit could not be deterministically verified.",
                evidence_data,
                "Ensure net quantity specifies an approved standard metric unit (e.g. '250 g' or '500 ml')."
            )
