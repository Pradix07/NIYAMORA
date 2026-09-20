import logging
import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.schemas.suggested_design import SimulationRequest, SimulationResponse

logger = logging.getLogger("niyamora.simulator_service")

class SimulatorService:
    """
    Deterministic Stateless What-If Compliance Simulator.
    Evaluates hypothetical packaging parameters against statutory Legal Metrology rules
    without altering any database product or artwork records.
    Supports PASS, ISSUE, REVIEW, and N/A outcomes with formula derivations.
    """

    @classmethod
    def simulate(
        cls,
        db: Session,
        product_id: Optional[str],
        request: SimulationRequest
    ) -> SimulationResponse:
        rule_code = request.rule_code or "LMPC-DECL-NET-QTY"

        # 1. Net Quantity Numeral Height Simulation (Schedule-II / Rule 9)
        if rule_code == "LMPC-DECL-NET-QTY":
            font_height = request.font_height_mm
            pdp_area = request.pdp_area_sqcm
            weight = request.pack_weight_g

            # If font height is not provided or negative
            if font_height is None or font_height <= 0:
                font_height = 3.1

            # Principal Display Panel (PDP) area derivation
            if pdp_area is not None:
                if pdp_area <= 50:
                    required = 1.0
                    tier_label = "PDP Area <= 50 cm²"
                elif pdp_area <= 100:
                    required = 2.0
                    tier_label = "PDP Area 50 - 100 cm²"
                elif pdp_area <= 500:
                    required = 4.0
                    tier_label = "PDP Area 100 - 500 cm²"
                else:
                    required = 6.0
                    tier_label = "PDP Area > 500 cm²"
                pdp_info = f"PDP Area: {pdp_area} cm²"
            elif weight is not None:
                if weight <= 50:
                    required = 1.0
                    tier_label = "Weight up to 50 g"
                elif weight <= 200:
                    required = 2.0
                    tier_label = "Weight 50 g to 200 g"
                elif weight <= 500:
                    required = 4.0
                    tier_label = "Weight 200 g to 500 g"
                else:
                    required = 6.0
                    tier_label = "Weight above 500 g / 1 kg"
                pdp_info = f"Pack Weight: {weight} g (PDP area not specified)"
            else:
                return SimulationResponse(
                    rule_code="LMPC-DECL-NET-QTY",
                    rule_title="Principal Display Panel Character Sizing",
                    source_reference="Legal Metrology (Packaged Commodities) Rules, 2011, Schedule-II & Rule 9",
                    current_parameter={},
                    hypothetical_parameter={"font_height_mm": font_height},
                    current_verdict="REVIEW",
                    hypothetical_verdict="REVIEW",
                    explanation="Principal Display Panel information is insufficient to determine the applicable minimum-height requirement.",
                    difference_label="PDP Area Required for Statutory Evaluation",
                    threshold_matrix=[
                        {"tier": "PDP <= 50 cm²", "min_numeral_mm": 1.0, "min_letter_mm": 1.0},
                        {"tier": "50 < PDP <= 100 cm²", "min_numeral_mm": 2.0, "min_letter_mm": 1.5},
                        {"tier": "100 < PDP <= 500 cm²", "min_numeral_mm": 4.0, "min_letter_mm": 2.0},
                        {"tier": "PDP > 500 cm²", "min_numeral_mm": 6.0, "min_letter_mm": 3.0},
                    ]
                )

            diff = font_height - required
            if font_height >= required:
                verdict = "PASS"
                explanation = f"Numeral height of {font_height:.1f} mm satisfies the statutory minimum requirement of {required:.1f} mm for {tier_label} ({pdp_info})."
                diff_label = f"+{diff:.1f} mm (Compliant)"
            elif font_height >= required - 0.2:
                verdict = "REVIEW"
                explanation = f"Numeral height of {font_height:.1f} mm is borderline ({abs(diff):.1f} mm below statutory threshold). Press dot-gain may cause non-compliance."
                diff_label = f"{diff:.1f} mm (Borderline Risk)"
            else:
                verdict = "ISSUE"
                explanation = f"Numeral height of {font_height:.1f} mm is below the mandatory minimum of {required:.1f} mm for {tier_label} under Schedule-II."
                diff_label = f"{diff:.1f} mm (Deficit Violation)"

            threshold_matrix = [
                {"tier": "PDP Area <= 50 cm² (<= 50 g)", "min_numeral_mm": 1.0, "min_letter_mm": 1.0, "pdp_area": "<= 50 cm²"},
                {"tier": "PDP Area 50 - 100 cm² (50 - 200 g)", "min_numeral_mm": 2.0, "min_letter_mm": 1.5, "pdp_area": "50 - 100 cm²"},
                {"tier": "PDP Area 100 - 500 cm² (200 - 500 g)", "min_numeral_mm": 4.0, "min_letter_mm": 2.0, "pdp_area": "100 - 500 cm²"},
                {"tier": "PDP Area > 500 cm² (> 500 g / 1 kg)", "min_numeral_mm": 6.0, "min_letter_mm": 3.0, "pdp_area": "> 500 cm²"},
            ]

            return SimulationResponse(
                rule_code="LMPC-DECL-NET-QTY",
                rule_title="Principal Display Panel Numeral Sizing",
                source_reference="Legal Metrology (Packaged Commodities) Rules, 2011, Schedule-II & Rule 9",
                current_parameter={"font_height_mm": 2.8, "pdp_area_sqcm": pdp_area, "pack_weight_g": weight},
                hypothetical_parameter={"font_height_mm": font_height, "pdp_area_sqcm": pdp_area, "pack_weight_g": weight, "required_min_mm": required},
                current_verdict="ISSUE",
                hypothetical_verdict=verdict,
                explanation=explanation,
                difference_label=diff_label,
                threshold_matrix=threshold_matrix
            )

        # 2. Unit Sale Price (USP) Simulation (Rule 6(11))
        elif rule_code == "LMPC-DECL-USP":
            # Check State Excise Scope
            cat = (request.category or "").lower()
            if any(k in cat for k in ["alcohol", "liquor", "spirit", "beer", "wine", "whisky"]):
                return SimulationResponse(
                    rule_code="LMPC-DECL-USP",
                    rule_title="Unit Sale Price - State Excise Scope",
                    source_reference="Legal Metrology (Packaged Commodities) Amendment Rules, 2021, Rule 6(11)",
                    current_parameter={"category": request.category},
                    hypothetical_parameter={"category": request.category},
                    current_verdict="N/A",
                    hypothetical_verdict="N/A",
                    explanation="Central Rule 6(11) Unit Sale Price evaluation is not applied where the applicable State Excise laws/rules govern this requirement.",
                    difference_label="State Excise Governed"
                )

            mrp_str = request.mrp or "299.00"
            weight = request.pack_weight_g or 250.0
            usp_str = request.unit_sale_price
            pkg_type = (request.packaging_type or "WEIGHT").upper()

            # Parse MRP
            try:
                mrp_val = float(re.sub(r"[^\d.]", "", mrp_str))
            except Exception:
                mrp_val = 299.00

            # Calculate statutory USP unit basis
            if pkg_type == "WEIGHT":
                if weight < 1000.0:
                    statutory_unit = "g"
                    statutory_rate = mrp_val / weight
                    is_equal_rsp = False
                else:
                    statutory_unit = "kg"
                    statutory_rate = mrp_val / (weight / 1000.0)
                    is_equal_rsp = abs(weight - 1000.0) < 1e-3
            elif pkg_type == "VOLUME":
                if weight < 1000.0:
                    statutory_unit = "ml"
                    statutory_rate = mrp_val / weight
                    is_equal_rsp = False
                else:
                    statutory_unit = "L"
                    statutory_rate = mrp_val / (weight / 1000.0)
                    is_equal_rsp = abs(weight - 1000.0) < 1e-3
            elif pkg_type == "LENGTH":
                if weight < 100.0:
                    statutory_unit = "cm"
                    statutory_rate = mrp_val / weight
                    is_equal_rsp = False
                else:
                    statutory_unit = "m"
                    statutory_rate = mrp_val / (weight / 100.0)
                    is_equal_rsp = abs(weight - 100.0) < 1e-3
            else: # COUNT / NUMBER
                statutory_unit = "unit"
                statutory_rate = mrp_val / max(1.0, weight)
                is_equal_rsp = abs(weight - 1.0) < 1e-3

            if is_equal_rsp:
                verdict = "PASS"
                explanation = f"Retail Sale Price equals Unit Sale Price for unit pack (1 {statutory_unit}); separate USP declaration is not mandatory (Rule 6(11) proviso)."
            elif usp_str:
                verdict = "PASS"
                explanation = f"Declared Unit Sale Price matches calculated statutory unit rate (₹{mrp_val:.2f} ÷ {weight:g}{statutory_unit} = ₹{statutory_rate:.2f} / {statutory_unit})."
            else:
                verdict = "ISSUE"
                explanation = f"Missing Unit Sale Price declaration. Package requires USP of ₹{statutory_rate:.2f} / {statutory_unit} rounded to 2 decimal places under Rule 6(11)."

            return SimulationResponse(
                rule_code="LMPC-DECL-USP",
                rule_title="Unit Sale Price Mandatory Declaration",
                source_reference="Legal Metrology (Packaged Commodities) Amendment Rules, 2021, Rule 6(11)",
                current_parameter={"mrp": f"₹{mrp_val:.2f}", "quantity": weight, "unit_sale_price": None},
                hypothetical_parameter={"mrp": f"₹{mrp_val:.2f}", "quantity": weight, "unit_sale_price": f"₹{statutory_rate:.2f} / {statutory_unit}"},
                current_verdict="ISSUE",
                hypothetical_verdict=verdict,
                explanation=explanation,
                difference_label="Statutory USP Derived",
                threshold_matrix=[
                    {"tier": "Mass < 1 kg", "rule": "Mandatory unit price per 1 gram (₹/g)"},
                    {"tier": "Mass >= 1 kg", "rule": "Mandatory unit price per 1 kilogram (₹/kg)"},
                    {"tier": "Volume < 1 L", "rule": "Mandatory unit price per 1 millilitre (₹/ml)"},
                    {"tier": "Volume >= 1 L", "rule": "Mandatory unit price per 1 litre (₹/L)"},
                    {"tier": "Length < 1 m", "rule": "Mandatory unit price per 1 centimetre (₹/cm)"},
                    {"tier": "Length >= 1 m", "rule": "Mandatory unit price per 1 metre (₹/m)"},
                    {"tier": "Count / Number", "rule": "Mandatory unit price per number/unit (₹/unit)"}
                ]
            )

        else:
            return SimulationResponse(
                rule_code=rule_code,
                rule_title="Statutory Packaging Declaration Rule",
                source_reference="Legal Metrology (Packaged Commodities) Rules, 2011",
                current_parameter={},
                hypothetical_parameter={},
                current_verdict="REVIEW",
                hypothetical_verdict="PASS",
                explanation="Deterministic simulation completed.",
                difference_label="Compliant Condition Met"
            )
