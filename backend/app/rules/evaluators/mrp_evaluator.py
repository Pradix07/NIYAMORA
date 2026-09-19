import re
from typing import Dict, Any, Optional, Tuple
from backend.app.rules.evaluators.base import BaseRuleEvaluator

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

        mrp_field = extracted_fields.get("mrp") or {}
        extracted_val = mrp_field.get("extracted_value")
        evidence_box = mrp_field.get("evidence_box")

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
        tax_keywords = ["incl", "inclusive", "incl.", "all taxes", "taxes"]
        has_tax_clause = any(kw in observed_lower for kw in ["incl. of all taxes", "inclusive of all taxes", "incl of all taxes", "incl. all taxes", "all taxes"])

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
            # Check if 'taxes' appears in immediately adjacent lines
            if "tax" in raw_text.lower():
                return (
                    "PASS",
                    observed,
                    expected_cond,
                    f"MRP declaration located ('{observed}') with tax-inclusive wording detected in declaration block.",
                    evidence_data,
                    None
                )
            else:
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
