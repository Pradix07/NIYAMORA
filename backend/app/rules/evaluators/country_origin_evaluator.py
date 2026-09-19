import re
from typing import Dict, Any, Optional, Tuple
from backend.app.rules.evaluators.base import BaseRuleEvaluator

class CountryOfOriginEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(g) & Rule 6(10): Country of Origin declaration.
    Mandatory for imported pre-packaged commodities.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare Country of Origin for imported commodities ('Country of Origin: [Country]' or 'Made in [Country]') (Rule 6(1)(g))."

        is_imported = product_context.get("is_imported", False) or "import" in (product_context.get("description") or "").lower()

        # Check for origin declaration in raw text or extracted fields
        origin_match = re.search(r"(?:country\s*of\s*origin|made\s*in|product\s*of|origin)\s*[:.-]?\s*([a-zA-Z\s]{3,20})\b", raw_text, re.IGNORECASE)

        if origin_match:
            observed = origin_match.group(0).strip()
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
                f"Country of Origin declaration explicitly verified: '{observed}'.",
                evidence_data,
                None
            )

        if not is_imported:
            return (
                "N/A",
                None,
                expected_cond,
                "Country of Origin check is N/A for domestically manufactured commodities (origin satisfied via domestic manufacturer address).",
                None,
                None
            )
        else:
            return (
                "ISSUE",
                None,
                expected_cond,
                "Commodity is designated as imported, but mandatory Country of Origin declaration was not located under Rule 6(1)(g).",
                None,
                "Print explicit 'Country of Origin: [Name of Country]' on the packaging label."
            )
