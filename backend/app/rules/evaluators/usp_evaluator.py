import re
from typing import Dict, Any, Optional, Tuple
from app.rules.evaluators.base import BaseRuleEvaluator

class UnitSalePriceEvaluator(BaseRuleEvaluator):
    """
    Evaluates Rule 6(11) (inserted by G.S.R. 779(E)):
    Unit Sale Price (USP) declaration on pre-packaged commodities:
    - per gram (₹/g) where net quantity is less than 1 kg (< 1 kg)
    - per kilogram (₹/kg) where net quantity is more or equal to 1 kg (>= 1 kg)
    - per millilitre (₹/ml) where net volume is less than 1 litre (< 1 L)
    - per litre (₹/l) where net volume is more or equal to 1 litre (>= 1 L)
    - per centimetre (₹/cm) where net length is less than 1 metre (< 1 m)
    - per metre (₹/m) where net length is more or equal to 1 metre (>= 1 m)
    - per number / per unit (₹/unit, ₹/piece, ₹/item, ₹/tablet, ₹/capsule) for commodities sold by number/unit
    
    Statutory Exceptions & Scope Notes:
    - Central Rule 6(11) USP evaluation is not applied where State Excise laws/rules govern; N/A with State Excise scope note.
    - Retail Sale Price equals Unit Sale Price proviso: For packages containing quantities of exactly 1 kg, 1 L, 1 m, or 1 unit, the retail sale price and the unit sale price are the same and no separate unit sale price is required to be mentioned (Rule 6(11) proviso).
    - Multi-unit or non-unit packages (e.g. 2 kg, 2 L, 500 g, 500 ml, 10 units) must evaluate the applicable declared Unit Sale Price.
    """

    def evaluate(
        self,
        rule_version: Any,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        blocks: list,
        product_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str], str, str, Optional[Dict[str, Any]], Optional[str]]:
        expected_cond = "Must declare Unit Sale Price (USP) rounded to 2 decimal places on applicable statutory unit basis (per g, kg, ml, l, cm, m, or number/unit) under Rule 6(11)."

        # 1. Check State Excise Scope (Alcoholic Beverages / Spirituous Liquor)
        category = (product_context.get("category") or "").lower()
        desc = (product_context.get("description") or "").lower()
        name = (product_context.get("name") or "").lower()
        liquor_keywords = ["liquor", "alcohol", "alcoholic", "spirituous", "beer", "wine", "whisky", "whiskey", "rum", "vodka", "gin", "brandy"]
        if any(exc in category or exc in desc or exc in name or exc in raw_text.lower() for exc in liquor_keywords):
            return (
                "N/A",
                None,
                expected_cond,
                "Central Rule 6(11) USP evaluation is not applied where State Excise laws/rules govern; N/A with State Excise scope note.",
                None,
                None
            )

        # 2. Extract and parse Net Quantity / Measure
        net_qty_str = (extracted_fields.get("net_quantity") or {}).get("extracted_value") or product_context.get("net_quantity") or ""
        
        if not net_qty_str or len(net_qty_str.strip()) == 0:
            return (
                "REVIEW",
                None,
                expected_cond,
                "Package net quantity / measure could not be determined to verify statutory Unit Sale Price (USP) unit basis under Rule 6(11).",
                None,
                "Verify packaging net quantity / measure to determine statutory USP unit basis (per g/kg/ml/l/cm/m/unit)."
            )

        # Parse numeric value and unit
        parsed = self._parse_measure(net_qty_str)
        if not parsed:
            return (
                "REVIEW",
                net_qty_str,
                expected_cond,
                f"Net measure '{net_qty_str}' is ambiguous or unrecognized; cannot deterministically establish statutory USP unit basis under Rule 6(11).",
                None,
                "Ensure net quantity specifies an approved standard metric unit or count."
            )

        val, unit_type, normalized_unit = parsed
        
        # Determine required unit basis and regex pattern
        expected_basis, expected_unit_name, usp_pattern, is_equal_rsp = self._determine_usp_basis(val, unit_type, normalized_unit)

        # If retail sale price equals unit sale price (1 kg, 1 L, 1 m, 1 unit), separate USP declaration is not mandatory
        if is_equal_rsp:
            usp_match = self._find_usp_in_text(raw_text, usp_pattern)
            if usp_match:
                observed = usp_match.strip()
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
                    f"Unit Sale Price (USP) declared: '{observed}' (Retail Sale Price equals Unit Sale Price for unit pack).",
                    evidence_data,
                    None
                )
            else:
                return (
                    "PASS",
                    None,
                    expected_cond,
                    f"Retail Sale Price equals Unit Sale Price for package measure '{net_qty_str}' (1 {normalized_unit}); separate USP declaration is not required (Rule 6(11) proviso).",
                    None,
                    None
                )

        # Look for matching USP declaration in raw text
        usp_match = self._find_usp_in_text(raw_text, usp_pattern)

        if usp_match:
            observed = usp_match.strip()
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
                f"Statutory Unit Sale Price (USP) declaration verified on applicable {expected_basis} basis: '{observed}'.",
                evidence_data,
                None
            )
        else:
            return (
                "ISSUE",
                None,
                expected_cond,
                f"Package measure '{net_qty_str}' requires Unit Sale Price (USP) declared on a {expected_basis} basis ({expected_unit_name}) under Rule 6(11), but declaration was not found.",
                None,
                f"Declare Unit Sale Price rounded off to two decimal places on {expected_basis} basis (e.g. 'USP: ₹ X.XX {expected_unit_name}')."
            )

    @staticmethod
    def _parse_measure(text: str) -> Optional[Tuple[float, str, str]]:
        """Parses measure string into (value, measure_type, base_unit)."""
        clean = text.lower().strip()
        
        # Match number + unit
        match = re.search(r"(\d+(?:\.\d+)?)\s*([a-zA-Z]+)", clean)
        if not match:
            return None
        
        num = float(match.group(1))
        unit = match.group(2)
        
        # Weight
        if unit in ["g", "gm", "gms", "gram", "grams"]:
            return (num, "weight", "g")
        elif unit in ["kg", "kgs", "kilo", "kilos", "kilogram", "kilograms"]:
            return (num * 1000.0, "weight", "g")
        elif unit in ["mg", "mgs", "milligram", "milligrams"]:
            return (num / 1000.0, "weight", "g")
            
        # Volume
        elif unit in ["ml", "mls", "millilitre", "millilitres", "milliliter", "milliliters"]:
            return (num, "volume", "ml")
        elif unit in ["l", "lt", "lts", "ltr", "ltrs", "litre", "litres", "liter", "liters"]:
            return (num * 1000.0, "volume", "ml")
        elif unit in ["cl", "cls", "centilitre", "centilitres"]:
            return (num * 10.0, "volume", "ml")
            
        # Length
        elif unit in ["cm", "cms", "centimetre", "centimetres", "centimeter", "centimeters"]:
            return (num, "length", "cm")
        elif unit in ["m", "meter", "meters", "metre", "metres"]:
            return (num * 100.0, "length", "cm")
        elif unit in ["mm", "mms", "millimetre", "millimetres"]:
            return (num / 10.0, "length", "cm")
            
        # Count / Number (Explicit count words only; 'N' is Newton in SI and excluded from count)
        elif unit in ["unit", "units", "piece", "pieces", "item", "items", "tablet", "tablets", "capsule", "capsules", "count", "ct", "nos", "no", "packet", "packets", "pouch", "pouches", "pair", "pairs"]:
            return (num, "count", "unit")
            
        return None

    @staticmethod
    def _determine_usp_basis(val: float, unit_type: str, normalized_unit: str) -> Tuple[str, str, str, bool]:
        """
        Returns (basis_description, unit_symbol_string, regex_pattern, is_equal_rsp).
        val is in normalized base units (grams for weight, ml for volume, cm for length, count for number).
        
        Exact Rule 6(11) Statutory Thresholds:
        - Weight < 1 kg (1000g) -> per g; Weight >= 1 kg -> per kg
        - Volume < 1 L (1000ml) -> per ml; Volume >= 1 L -> per L
        - Length < 1 m (100cm) -> per cm; Length >= 1 m -> per m
        - Count / Number -> per number / per unit
        
        Rule 6(11) Proviso (RSP == USP):
        - Single base unit packs (exactly 1 kg, 1 L, 1 m, 1 unit) satisfy RSP == USP.
        """
        if unit_type == "weight":
            is_equal_rsp = abs(val - 1000.0) < 1e-3
            if val < 1000.0:
                return ("per-gram", "/ g", r"(?:/|\bper\s*)(?:g|gm|gram)\b", False)
            else:
                # >= 1 kg (e.g. 1 kg, 2 kg) -> per-kilogram
                return ("per-kilogram", "/ kg", r"(?:/|\bper\s*)(?:kg|kilo|kilogram)\b", is_equal_rsp)
                
        elif unit_type == "volume":
            is_equal_rsp = abs(val - 1000.0) < 1e-3
            if val < 1000.0:
                return ("per-millilitre", "/ ml", r"(?:/|\bper\s*)(?:ml|millilitre|milliliter)\b", False)
            else:
                # >= 1 L (e.g. 1 L, 2 L) -> per-litre
                return ("per-litre", "/ L", r"(?:/|\bper\s*)(?:l|lt|ltr|litre|liter)\b", is_equal_rsp)
                
        elif unit_type == "length":
            is_equal_rsp = abs(val - 100.0) < 1e-3
            if val < 100.0:
                return ("per-centimetre", "/ cm", r"(?:/|\bper\s*)(?:cm|centimetre|centimeter)\b", False)
            else:
                # >= 1 m (e.g. 1 m, 5 m) -> per-metre
                return ("per-metre", "/ m", r"(?:/|\bper\s*)(?:m|metre|meter)\b", is_equal_rsp)
                
        elif unit_type == "count":
            is_equal_rsp = abs(val - 1.0) < 1e-3
            return ("per-unit", "/ unit", r"(?:/|\bper\s*)(?:unit|piece|item|tablet|capsule|count|number)\b", is_equal_rsp)
                
        return ("applicable unit", "", r"", False)

    @staticmethod
    def _find_usp_in_text(raw_text: str, unit_regex: str) -> Optional[str]:
        # 1. Look for explicit USP keyword with unit
        usp_kw_pattern = rf"(?:usp|unit\s*sale\s*price|u\.s\.p\.?)[:\s\-\.]*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d{{1,2}})?\s*{unit_regex}"
        match = re.search(usp_kw_pattern, raw_text, re.IGNORECASE)
        if match:
            return match.group(0)
            
        # 2. Look for price number with statutory unit representation
        price_unit_pattern = rf"(?:₹|rs\.?|inr)\s*\d+(?:\.\d{{1,2}})?\s*{unit_regex}"
        match = re.search(price_unit_pattern, raw_text, re.IGNORECASE)
        if match:
            return match.group(0)
            
        # 3. Look for explicit USP keyword line
        match = re.search(r"(?:usp|unit\s*sale\s*price|u\.s\.p\.?)[:\s\-\.]*([^\n]+)", raw_text, re.IGNORECASE)
        if match:
            candidate = match.group(0)
            if re.search(unit_regex, candidate, re.IGNORECASE) or re.search(r"\d+(?:\.\d{1,2})?", candidate):
                return candidate
                
        return None
