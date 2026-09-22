import re
from typing import Dict, Any, Optional, Tuple
from app.rules.evaluators.base import BaseRuleEvaluator

class LanguageDeclarationEvaluator(BaseRuleEvaluator):
    """
    Evaluates Legal Metrology Rule 9(1):
    Every declaration which is required to be made on package shall appear in Hindi in Devanagari script or in English.
    """
    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        if not raw_text or not raw_text.strip():
            return (
                "REVIEW",
                None,
                "Declarations must be legible in English or Hindi (Devanagari script)",
                "No legible text recognized on packaging to verify language compliance.",
                None,
                "Ensure label panel images have sufficient lighting and print clarity."
            )

        has_devanagari = bool(re.search(r"[\u0900-\u097F]", raw_text))
        has_english = bool(re.search(r"[a-zA-Z]{3,}", raw_text))

        if has_english or has_devanagari:
            lang_found = "English" if has_english and not has_devanagari else ("Hindi (Devanagari)" if has_devanagari and not has_english else "English & Hindi Bilingual")
            return (
                "PASS",
                f"Recognized: {lang_found}",
                "Declarations in English or Hindi (Devanagari script) per Rule 9(1)",
                f"Packaging declarations satisfy Rule 9(1) of Legal Metrology (Packaged Commodities) Rules, 2011 ({lang_found}).",
                None,
                None
            )
        else:
            return (
                "ISSUE",
                "Non-compliant script/language",
                "Declarations must appear in English or Hindi (Devanagari script)",
                "Statutory declarations must be in Hindi in Devanagari script or English under Rule 9(1).",
                None,
                "Provide all mandatory statutory declarations in English or Hindi (Devanagari)."
            )
