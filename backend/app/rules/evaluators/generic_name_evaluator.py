from typing import Dict, Any, Optional, Tuple
import re
from app.rules.evaluators.base import BaseRuleEvaluator

class GenericNameEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(b): Common or generic names of the commodity contained in the package.
    Mandates that the packaging prominently state the genuine commodity name (e.g. Almonds, Tea, Biscuits).
    Never mistakes storage instructions, slogans, or nutrition table terms for commodity name.
    """

    INVALID_SUBSTRINGS = [
        "cool", "dry place", "sunlight", "store in", "keep in", "storage",
        "per 100", "protein", "carbohydrate", "fat", "kcal", "serving",
        "mrp", "m.r.p", "₹", "rs.", "mfg", "pkd", "fssai", "batch",
        "consumer care", "helpline", "email", "all taxes", "inclusive",
        "best before", "expiry", "use by", "ingredients:", "allergen",
        "screenshot", "img_", "pasted", ".png", ".jpg", ".pdf"
    ]

    def _is_valid_commodity(self, text: Optional[str]) -> bool:
        if not text or len(text.strip()) < 2 or len(text.strip()) > 80:
            return False
        lower = text.lower().strip()
        if any(inv in lower for inv in self.INVALID_SUBSTRINGS):
            return False
        # Must contain letters
        if not re.search(r"[a-zA-Z]{2,}", lower):
            return False
        return True

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must prominently display the common or generic name of the commodity (Rule 6(1)(b))."

        found_val = None
        evidence_box = None
        quality = "HIGH"

        # 1. Check explicit generic_name field
        gen_field = extracted_fields.get("generic_name")
        gen_val = gen_field.get("extracted_value") if isinstance(gen_field, dict) else getattr(gen_field, "extracted_value", None)
        if self._is_valid_commodity(gen_val):
            found_val = gen_val.strip()
            box = gen_field.get("evidence_box") if isinstance(gen_field, dict) else getattr(gen_field, "evidence_box", None)
            evidence_box = box.model_dump() if hasattr(box, "model_dump") else (box.dict() if hasattr(box, "dict") else box)

        # 2. Check product_name field
        if not found_val:
            name_field = extracted_fields.get("product_name")
            prod_val = name_field.get("extracted_value") if isinstance(name_field, dict) else getattr(name_field, "extracted_value", None)
            if self._is_valid_commodity(prod_val):
                found_val = prod_val.strip()
                box = name_field.get("evidence_box") if isinstance(name_field, dict) else getattr(name_field, "evidence_box", None)
                evidence_box = box.model_dump() if hasattr(box, "model_dump") else (box.dict() if hasattr(box, "dict") else box)

        # 3. Check product_context name
        if not found_val:
            hint = (product_context.get("name") or "").strip()
            if self._is_valid_commodity(hint) and hint.lower() in raw_text.lower():
                found_val = hint
                quality = "MEDIUM"

        if not found_val:
            return (
                "REVIEW",
                None,
                expected_cond,
                "Generic or common commodity name could not be reliably verified from the artwork evidence.",
                None,
                "Prominently print the generic/common commodity name on the principal display panel (e.g. 'California Almonds')."
            )

        clean_val = found_val.strip()
        evidence_data = {
            "source_type": "OCR",
            "observed_text": clean_val,
            "extracted_value": clean_val,
            "bbox": evidence_box,
            "evidence_quality": quality
        }

        return (
            "PASS",
            clean_val,
            expected_cond,
            f"Common/generic commodity name identified on packaging: '{clean_val}'.",
            evidence_data,
            None
        )
