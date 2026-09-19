from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple

class BaseRuleEvaluator(ABC):
    """
    Abstract base evaluator for deterministic compliance checks.
    Evaluators receive:
    - rule_version: RuleVersion model or dictionary
    - extracted_fields: Dict of parsed packaging field dictionaries
    - raw_text: Entire raw OCR/vector text
    - blocks: List of spatial text block objects
    - product_context: Product master details (brand, category, net_qty, is_imported, etc.)

    Returns:
    (status, observed_value, expected_condition, explanation, evidence_data, suggested_action)
    where status is one of: "PASS", "ISSUE", "REVIEW", "N/A"
    """

    @abstractmethod
    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        pass
