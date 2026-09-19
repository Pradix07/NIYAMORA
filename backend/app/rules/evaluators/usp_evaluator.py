import re
from typing import Dict, Any, Optional, Tuple
from backend.app.rules.evaluators.base import BaseRuleEvaluator

class UnitSalePriceEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(ea): Unit Sale Price (USP) declaration on pre-packaged commodities.
    Applicable when package net quantity exceeds 1 kg or 1 L.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare Unit Sale Price (USP) in Rupees rounded to 2 decimal places per g/kg/ml/l when net quantity exceeds 1 kg or 1 L (Rule 6(1)(ea))."

        # 1. Determine Net Quantity threshold
        net_qty_str = (extracted_fields.get("net_quantity") or {}).get("extracted_value") or product_context.get("net_quantity") or ""
        
        is_large_pack = False
        qty_match = re.search(r"(\d+(?:\.\d+)?)\s*(kg|g|l|ml)", net_qty_str.lower())
        if qty_match:
            num = float(qty_match.group(1))
            unit = qty_match.group(2)
            if (unit == "kg" and num > 1.0) or (unit == "g" and num > 1000.0) or (unit == "l" and num > 1.0) or (unit == "ml" and num > 1000.0):
                is_large_pack = True

        # 2. Check for USP presence in raw text
        usp_match = (
            re.search(r"(?:usp|unit\s*sale\s*price|u\.s\.p\.?)[:\s\-\.]*([^\n]+)", raw_text, re.IGNORECASE)
            or re.search(r"(\d+(?:\.\d{1,2})?)\s*(?:/|\s*per\s*)\s*(?:g|gm|kg|ml|l|unit|piece)\b", raw_text, re.IGNORECASE)
        )
        
        if usp_match:
            observed = usp_match.group(0).strip()
            evidence_data = {
                "source_type": "OCR",
                "observed_text": observed,
                "extracted_value": observed,
                "evidence_quality": "HIGH"
            }
            return (
                "PASS",
                observed,
                expected_cond,
                f"Unit Sale Price (USP) declaration verified: '{observed}'.",
                evidence_data,
                None
            )

        if not is_large_pack:
            # Not mandatory for packages containing <= 1 kg / 1 L
            return (
                "N/A",
                None,
                expected_cond,
                f"Unit Sale Price (USP) is not mandatory for package net quantity '{net_qty_str}' (<= 1 kg / 1 L).",
                None,
                None
            )
        else:
            # Package > 1kg/1L and missing USP -> ISSUE
            return (
                "ISSUE",
                None,
                expected_cond,
                f"Package net quantity '{net_qty_str}' exceeds 1 kg / 1 L, but mandatory Unit Sale Price (USP) was not declared under Rule 6(1)(ea).",
                None,
                "Declare Unit Sale Price rounded off to two decimal places (e.g. 'USP: ₹ 0.85 / g' or 'USP: ₹ 850.00 / kg')."
            )
