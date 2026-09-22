import re
from typing import Dict, Any, Optional, Tuple
from app.rules.evaluators.base import BaseRuleEvaluator

class MRPEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(e): Maximum Retail Price (MRP) in Indian Rupees inclusive of all taxes.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare Maximum Retail Price (MRP) in Indian Rupees, accompanied by the mandatory statutory phrase '(inclusive of all taxes)' or 'incl. of all taxes' (Rule 6(1)(e))."

        mrp_field = extracted_fields.get("mrp")
        extracted_val = mrp_field.get("extracted_value") if isinstance(mrp_field, dict) else getattr(mrp_field, "extracted_value", None)
        box = mrp_field.get("evidence_box") if isinstance(mrp_field, dict) else getattr(mrp_field, "evidence_box", None)
        evidence_box = box.model_dump() if hasattr(box, "model_dump") else (box.dict() if hasattr(box, "dict") else box)

        candidate_text = extracted_val
        if not candidate_text:
            # Look in raw text
            for line in raw_text.splitlines():
                if "mrp" in line.lower() or "maximum retail" in line.lower():
                    candidate_text = line.strip()
                    break

        if not candidate_text:
            return (
                "REVIEW",
                None,
                expected_cond,
                "MRP (Maximum Retail Price) declaration could not be located in the artwork dieline.",
                None,
                "Add statutory MRP declaration (e.g. 'MRP ₹ 299.00 (incl. of all taxes)')."
            )

        observed = candidate_text.strip()
        observed_lower = observed.lower()

        # Check for numeric price value
        has_price_num = bool(re.search(r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)", observed_lower))

        # Check for statutory tax inclusion clause
        tax_phrases = [
            "inclusive of all taxes", "incl. of all taxes", "incl of all taxes",
            "incl. all taxes", "inclusive of taxes", "incl. taxes", "incl taxes"
        ]
        has_tax_clause = any(p in observed_lower for p in tax_phrases)

        # Check adjacent lines around MRP declaration
        if not has_tax_clause:
            lines = raw_text.splitlines()
            for idx, line in enumerate(lines):
                if any(m in line.lower() for m in ["mrp", "m.r.p", "maximum retail"]):
                    window = " ".join(lines[max(0, idx - 1):min(len(lines), idx + 3)]).lower()
                    if any(p in window for p in tax_phrases):
                        has_tax_clause = True
                        break

        evidence_data = {
            "source_type": "OCR",
            "observed_text": observed,
            "extracted_value": observed,
            "bbox": evidence_box,
            "evidence_quality": "HIGH"
        }

        if has_price_num and has_tax_clause:
            return (
                "PASS",
                observed,
                expected_cond,
                f"Statutory MRP declaration verified with tax-inclusive wording: '{observed}'.",
                evidence_data,
                None
            )
        elif has_price_num and not has_tax_clause:
            return (
                "ISSUE",
                observed,
                expected_cond,
                f"MRP declaration '{observed}' omits mandatory statutory phrase '(inclusive of all taxes)' under Rule 6(1)(e).",
                evidence_data,
                "Append '(incl. of all taxes)' or '(inclusive of all taxes)' directly adjacent to the retail sale price."
            )
        else:
            return (
                "REVIEW",
                observed,
                expected_cond,
                f"MRP text detected ('{observed}'), but price numeral requires confirmation.",
                evidence_data,
                "Ensure MRP is printed clearly with currency symbol and decimal formatting."
            )
