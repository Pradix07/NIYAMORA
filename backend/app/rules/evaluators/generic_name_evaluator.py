from typing import Dict, Any, Optional, Tuple
from backend.app.rules.evaluators.base import BaseRuleEvaluator

class GenericNameEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(b): Common or generic names of the commodity contained in the package.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must prominently display the common or generic name of the commodity (Rule 6(1)(b))."

        name_field = extracted_fields.get("product_name") or {}
        extracted_val = name_field.get("extracted_value")
        evidence_box = name_field.get("evidence_box")

        found_val = None
        if extracted_val and len(extracted_val.strip()) >= 3:
            found_val = extracted_val.strip()
        else:
            # Fallback: check if product_context name appears in raw_text
            product_name_hint = (product_context.get("name") or "").strip()
            if product_name_hint and len(product_name_hint) >= 3 and product_name_hint.lower() in raw_text.lower():
                found_val = product_name_hint

        if not found_val:
            return (
                "REVIEW",
                None,
                expected_cond,
                "Generic or common commodity name could not be reliably verified from the artwork evidence.",
                None,
                "Prominently print the generic/common commodity name on the principal display panel."
            )

        clean_val = found_val.strip()
        evidence_data = {
            "source_type": "OCR",
            "observed_text": clean_val,
            "extracted_value": clean_val,
            "bbox": evidence_box,
            "evidence_quality": "HIGH" if extracted_val else "MEDIUM"
        }

        return (
            "PASS",
            clean_val,
            expected_cond,
            f"Common/generic commodity name identified on packaging: '{clean_val}'.",
            evidence_data,
            None
        )
