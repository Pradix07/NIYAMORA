import re
from typing import Dict, Any, Optional, Tuple
from backend.app.rules.evaluators.base import BaseRuleEvaluator

class ConsumerCareEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(1)(g) / Rule 6(1) Consumer Care Details:
    Name, address, telephone number, and e-mail address of consumer care cell / complaints contact.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare contact details (telephone/toll-free number and/or e-mail address, contact person/address) for consumer grievances (Rule 6(1)(g))."

        care_field = extracted_fields.get("consumer_care") or {}
        extracted_val = care_field.get("extracted_value")
        evidence_box = care_field.get("evidence_box")

        candidate_text = extracted_val
        if not candidate_text:
            for line in raw_text.splitlines():
                if any(k in line.lower() for k in ["consumer care", "customer care", "feedback", "helpline", "toll free", "care@"]):
                    candidate_text = line.strip()
                    break

        if not candidate_text:
            return (
                "REVIEW",
                None,
                expected_cond,
                "Consumer care & complaint contact declaration could not be located in artwork.",
                None,
                "Add statutory Consumer Care cell details: 'For feedback/complaints contact Customer Care at [Email / Helpline / Address]'."
            )

        observed = candidate_text.strip()
        observed_lower = observed.lower()

        has_phone = bool(re.search(r"(?:1800|1860|\+91|\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|\b\d{10}\b)", observed))
        has_email = bool(re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", observed))

        evidence_data = {
            "source_type": "OCR",
            "observed_text": observed,
            "extracted_value": observed,
            "bbox": evidence_box,
            "evidence_quality": "HIGH" if (has_phone or has_email) else "MEDIUM"
        }

        if has_phone or has_email:
            return (
                "PASS",
                observed,
                expected_cond,
                f"Consumer care contact declaration verified with active channels (Phone/Email): '{observed}'.",
                evidence_data,
                None
            )
        else:
            return (
                "REVIEW",
                observed,
                expected_cond,
                f"Consumer care section found ('{observed}'), but distinct phone number or email address could not be fully parsed.",
                evidence_data,
                "Ensure both email and telephone helpline are legibly declared."
            )
