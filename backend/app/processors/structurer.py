import re
from typing import Dict, List, Optional
from backend.app.schemas.inspection import TextBlock, ExtractedField, BoundingBoxCoord

class PackagingFieldStructurer:
    """
    Parses raw extracted text blocks into declared packaging fields.
    Preserves exact bounding box coordinates and marks absent fields as NOT_FOUND.
    
    IMPORTANT: This extracts declared facts ONLY. It does NOT make legal compliance decisions.
    """

    PATTERNS = {
        "net_quantity": [
            r"(?:Net\s*(?:Qty|Quantity|Weight|Wt|Volume|Vol)\.?\s*[:\-]?\s*)([0-9]+(?:\.[0-9]+)?\s*(?:gms?|kgs?|ml|lts?|litres?|grams?|kg|g|mg|cl|N|units?|pieces?))\b",
            r"\b([0-9]+(?:\.[0-9]+)?\s*(?:gms?|kgs?|ml|lts?|litres?|grams?|kg|g|mg|cl|N|units?)\b(?!\s*fat|\s*protein|\s*carb))",
        ],
        "mrp": [
            r"(?:MRP|M\.R\.P\.?|Maximum\s*Retail\s*Price)\s*(?:[\(:]?[^\n0-9]*\s*)?(?:Rs\.?|₹|INR|\?)?\s*([0-9]+(?:\.[0-9]{2})?)",
            r"(?:₹|Rs\.?|\?)\s*([0-9]+(?:\.[0-9]{2})?)",
        ],
        "license_number": [
            r"(?:fssai|FSSAI|Lic\.?\s*No\.?|License\s*No\.?)\s*[:\-]?\s*([0-9]{14})",
            r"\b([0-9]{14})\b",
        ],
        "consumer_care": [
            r"(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll\s*Free|Feedback)\s*[:\-]?\s*([0-9\-\s]{8,15}|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)",
            r"(?:Email|Mail)\s*[:\-]?\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)",
        ],
        "ingredients": [
            r"(?:Ingredients|INGREDIENTS)\s*[:\-]?\s*([^\n]+(?:\n[^\n]+)?)",
        ],
        "allergen_warning": [
            r"(?:Allergen|ALLERGEN|Contains)\s*[:\-]?\s*([^\n]+)",
        ],
        "date_markings": [
            r"(?:MFD|Mfg\.?\s*Date|Manufactured|Packed|PKD|Expiry|Best\s*Before|EXP)\s*[:\-]?\s*([0-9]{1,2}[\/\.\-][0-9]{2,4}|[A-Za-z]{3}\s*[0-9]{2,4})",
        ],
        "country_of_origin": [
            r"(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:\-]?\s*([A-Za-z\s]{3,20})",
        ],
        "manufacturer": [
            r"(?:Mfg\s*by|Manufactured\s*by|Packed\s*by|Marketed\s*by)\s*[:\-]?\s*([^\n]+)",
        ]
    }

    @classmethod
    def structure_fields(
        cls,
        raw_text: str,
        blocks: List[TextBlock],
        product_name_hint: Optional[str] = None,
        brand_hint: Optional[str] = None
    ) -> Dict[str, ExtractedField]:
        fields: Dict[str, ExtractedField] = {}

        # 1. Net Quantity
        fields["net_quantity"] = cls._extract_entity(
            key="net_quantity",
            name="Declared Net Quantity",
            patterns=cls.PATTERNS["net_quantity"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 2. MRP / Unit Sale Price
        fields["mrp"] = cls._extract_entity(
            key="mrp",
            name="Maximum Retail Price (MRP)",
            patterns=cls.PATTERNS["mrp"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 3. FSSAI / Statutory License
        fields["license_number"] = cls._extract_entity(
            key="license_number",
            name="FSSAI License / Registration No.",
            patterns=cls.PATTERNS["license_number"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 4. Consumer Care Contact
        fields["consumer_care"] = cls._extract_entity(
            key="consumer_care",
            name="Consumer Care Details",
            patterns=cls.PATTERNS["consumer_care"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 5. Ingredients List
        fields["ingredients"] = cls._extract_entity(
            key="ingredients",
            name="Ingredients Declaration",
            patterns=cls.PATTERNS["ingredients"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 6. Allergen Statement
        fields["allergen_warning"] = cls._extract_entity(
            key="allergen_warning",
            name="Allergen Warning",
            patterns=cls.PATTERNS["allergen_warning"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 7. Date of Manufacture / Best Before
        fields["date_markings"] = cls._extract_entity(
            key="date_markings",
            name="Date of Manufacture / Expiry",
            patterns=cls.PATTERNS["date_markings"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 8. Country of Origin
        fields["country_of_origin"] = cls._extract_entity(
            key="country_of_origin",
            name="Country of Origin",
            patterns=cls.PATTERNS["country_of_origin"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 9. Manufacturer / Packer Address
        fields["manufacturer"] = cls._extract_entity(
            key="manufacturer",
            name="Manufacturer / Packer Name & Address",
            patterns=cls.PATTERNS["manufacturer"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 10. Product Name & Brand from Hints or Top Text Blocks
        if brand_hint and brand_hint.lower() in raw_text.lower():
            matching_box = next((b.normalized_box for b in blocks if brand_hint.lower() in b.text.lower()), None)
            fields["brand"] = ExtractedField(
                field_key="brand",
                field_name="Brand Identity",
                extracted_value=brand_hint,
                status="EXTRACTED",
                confidence=0.99,
                evidence_box=matching_box or (blocks[0].normalized_box if blocks else None)
            )
        elif blocks:
            fields["brand"] = ExtractedField(
                field_key="brand",
                field_name="Brand Identity",
                extracted_value=blocks[0].text,
                status="EXTRACTED",
                confidence=0.85,
                evidence_box=blocks[0].normalized_box
            )
        else:
            fields["brand"] = ExtractedField(
                field_key="brand",
                field_name="Brand Identity",
                extracted_value=None,
                status="NOT_FOUND",
                confidence=0.0,
                evidence_box=None
            )

        if product_name_hint and product_name_hint.lower() in raw_text.lower():
            matching_box = next((b.normalized_box for b in blocks if product_name_hint.lower() in b.text.lower()), None)
            fields["product_name"] = ExtractedField(
                field_key="product_name",
                field_name="Product Name / Commercial Descriptor",
                extracted_value=product_name_hint,
                status="EXTRACTED",
                confidence=0.99,
                evidence_box=matching_box or (blocks[1].normalized_box if len(blocks) > 1 else None)
            )
        elif len(blocks) > 1 and not any(k in blocks[1].text.lower() for k in ["net", "mrp", "mfg", "pkd", "care", "helpline", "price", "taxes", "lot", "batch"]):
            fields["product_name"] = ExtractedField(
                field_key="product_name",
                field_name="Product Name / Commercial Descriptor",
                extracted_value=blocks[1].text,
                status="EXTRACTED",
                confidence=0.80,
                evidence_box=blocks[1].normalized_box
            )
        else:
            fields["product_name"] = ExtractedField(
                field_key="product_name",
                field_name="Product Name / Commercial Descriptor",
                extracted_value=None,
                status="NOT_FOUND",
                confidence=0.0,
                evidence_box=None
            )

        return fields

    @classmethod
    def _extract_entity(
        cls,
        key: str,
        name: str,
        patterns: List[str],
        raw_text: str,
        blocks: List[TextBlock]
    ) -> ExtractedField:
        # Check patterns across text blocks first to bind exact coordinates
        for block in blocks:
            for pat in patterns:
                match = re.search(pat, block.text, re.IGNORECASE)
                if match:
                    val = match.group(1).strip() if match.groups() else match.group(0).strip()
                    return ExtractedField(
                        field_key=key,
                        field_name=name,
                        extracted_value=val,
                        status="EXTRACTED",
                        confidence=block.confidence or 0.90,
                        evidence_box=block.normalized_box,
                        source="Vector/OCR Layout"
                    )

        # Fallback to full raw text regex search
        for pat in patterns:
            match = re.search(pat, raw_text, re.IGNORECASE)
            if match:
                val = match.group(1).strip() if match.groups() else match.group(0).strip()
                return ExtractedField(
                    field_key=key,
                    field_name=name,
                    extracted_value=val,
                    status="EXTRACTED",
                    confidence=0.80,
                    evidence_box=None,
                    source="Full Text Stream"
                )

        # Entity not found in artwork
        return ExtractedField(
            field_key=key,
            field_name=name,
            extracted_value=None,
            status="NOT_FOUND",
            confidence=0.0,
            evidence_box=None,
            source="Unidentified"
        )
