import re
from typing import Dict, Any, Optional, Tuple
from app.rules.evaluators.base import BaseRuleEvaluator

class DateDeclarationEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(d) (as amended in 2021/2022):
    Month and year in which the commodity is manufactured or pre-packed or imported (e.g. MM/YYYY or Month YYYY).
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare month and year of manufacture, packaging, or import in clear format (e.g. 'MM/YYYY' or 'Month YYYY') (Rule 6(1)(d))."

        date_field = extracted_fields.get("dates") or {}
        extracted_val = date_field.get("extracted_value")
        evidence_box = date_field.get("evidence_box")

        candidate_text = extracted_val
        if not candidate_text:
            # Look for date keywords in raw text lines
            date_cues = ["mfg", "mfd", "pkd", "packed", "date of mfg", "date of packing", "batch", "exp", "use by"]
            for line in raw_text.splitlines():
                if any(cue in line.lower() for cue in date_cues) and re.search(r"\d{2,4}", line):
                    candidate_text = line.strip()
                    break

        if not candidate_text:
            return (
                "REVIEW",
                None,
                expected_cond,
                "Manufacturing or packaging date declaration (MM/YYYY) could not be located in artwork.",
                None,
                "Add explicit date declaration on packaging (e.g. 'Mfg Date: 09/2026' or 'Packed: Sep 2026')."
            )

        observed = candidate_text.strip()
        
        # Check for month/year patterns: 09/2026, 09/26, Sep 2026, September 2026
        date_pattern = r"(?:0[1-9]|1[0-2]|[A-Za-z]{3,9})[/\s.-]+(?:20\d{2}|\d{2})"
        has_valid_format = bool(re.search(date_pattern, observed))

        evidence_data = {
            "source_type": "OCR",
            "observed_text": observed,
            "extracted_value": observed,
            "bbox": evidence_box,
            "evidence_quality": "HIGH" if has_valid_format else "MEDIUM"
        }

        if has_valid_format:
            return (
                "PASS",
                observed,
                expected_cond,
                f"Statutory date declaration identified: '{observed}'.",
                evidence_data,
                None
            )
        else:
            return (
                "REVIEW",
                observed,
                expected_cond,
                f"Date-related text found ('{observed}'), but standard month/year structure (MM/YYYY) requires visual verification.",
                evidence_data,
                "Ensure date is legibly formatted as MM/YYYY or Month Year."
            )
