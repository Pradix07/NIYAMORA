import re
from typing import Dict, List, Optional
from app.schemas.inspection import TextBlock, ExtractedField, BoundingBoxCoord

class PackagingFieldStructurer:
    """
    Parses raw extracted text blocks into declared packaging fields with high precision.
    Preserves exact tight bounding box coordinates and marks absent fields as NOT_FOUND.
    Never guesses or invents values.
    
    IMPORTANT: This extracts declared facts ONLY. It does NOT make legal compliance decisions.
    """

    NUTRITION_KEYWORDS = [
        "per 100", "per serving", "serving size", "servings", "carbohydrate", "carb",
        "sugar", "protein", "fat", "saturated", "trans fat", "cholesterol", "sodium",
        "dietary fiber", "dietary fibre", "energy", "calories", "kcal", "kj", "% rda",
        "% daily", "nutritional", "nutrition facts", "approximate values", "approx values"
    ]

    STORAGE_KEYWORDS = [
        "storage", "store in", "keep in", "cool, dry", "cool dry", "cool and dry",
        "direct sunlight", "sunlight", "dry place", "room temperature", "refrigerat",
        "airtight", "sealed container", "hygienic", "preserve in", "after opening",
        "consume within", "instructions for use", "directions for use", "preparation instructions",
        "best consumed", "humidity", "ambient"
    ]

    SLOGAN_PATTERNS = [
        r"\b(?:simple\s+ingredients|real\s+benefits)\b",
        r"\b(?:100%\s+almonds?|100%\s+natural|100%\s+pure|100%\s+organic)\b",
        r"\b(?:no\s+added\s+preservatives|no\s+preservatives|no\s+added\s+sugar|gluten\s+free|plant\s+based)\b",
        r"\b(?:tear\s+here|reseal\s+for\s+freshness|keep\s+in\s+cool|store\s+in\s+a\s+cool|open\s+here|best\s+quality)\b",
        r"\b(?:rich\s+in|source\s+of|high\s+protein|zero\s+cholesterol|healthy\s+snack)\b",
        r"\b(?:serving\s+suggestion|image\s+for\s+illustration|crunchy\s+&\s+delicious)\b",
        r"\b(?:great\s+taste|premium\s+quality|finest\s+quality|authentic\s+taste)\b",
    ]

    PATTERNS = {
        "net_quantity_explicit": [
            r"(?:Net\s*(?:Qty|Quantity|Weight|Wt|Volume|Vol|Length)\.?\s*[:\-]?\s*)([0-9]+(?:\.[0-9]+)?\s*(?:gms?|kgs?|ml|lts?|litres?|grams?|kg|g|mg|cl|N|units?|pieces?|tablets?|capsules?|items?|nos?|count|ct|l|L|cm|mm|m|metres?|meters?))\b",
        ],
        "net_quantity_standalone": [
            r"^\s*(?:Net\s*(?:Qty|Quantity|Weight|Wt)?\s*[:\-]?)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|mg|ml|l|L|cl|cm|mm|m|N|units?))\s*$",
            r"\b([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|mg|ml|l|L))\b",
        ],
        "mrp": [
            r"(?:MRP|M\.R\.P\.?|Maximum\s*Retail\s*Price)\s*(?:[\(:]?[^\n0-9]*\s*)?(?:Rs\.?|₹|INR|\?)?\s*([0-9]+(?:\.[0-9]{2})?)",
            r"(?:₹|Rs\.?|\?)\s*([0-9]+(?:\.[0-9]{2}))\b",
        ],
        "usp": [
            r"(?:USP|Unit\s*Sale\s*Price|U\.S\.P\.?)\s*[:\-]?\s*(?:₹|Rs\.?|INR|\?)?\s*([0-9]+(?:\.[0-9]{1,2})?\s*(?:per|/)\s*(?:gms?|kgs?|ml|lts?|litres?|grams?|kg|g|mg|cl|unit|piece|item|count|nos?|cm|m))\b",
            r"(?:₹|Rs\.?)\s*([0-9]+(?:\.[0-9]{1,2})?\s*(?:per|/)\s*(?:g|kg|ml|l|L|cm|m|unit|piece|item))\b",
        ],
        "license_number": [
            r"(?:fssai|FSSAI|Lic\.?\s*No\.?|License\s*No\.?)\s*[:\-]?\s*([0-9]{14})",
            r"\b([0-9]{14})\b",
        ],
        "consumer_care": [
            r"(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll\s*Free|Feedback|Queries|Grievance)\s*[:\-]?\s*([0-9\-\s]{8,15}|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)",
            r"(?:Email|Mail)\s*[:\-]?\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)",
        ],
        "ingredients": [
            r"(?:Ingredients|INGREDIENTS)\s*[:\-]?\s*([^\n]+(?:\n[^\n]+)?)",
        ],
        "allergen_warning": [
            r"(?:Allergen\s*(?:Advice|Information|Warning)?|Contains)\s*[:\-]?\s*([^\n]+)",
        ],
        "date_markings": [
            r"(?:Packed\s*On|PKD|PKD\.?|MFD|Mfg\.?\s*Date|Manufactured|Expiry|Best\s*Before|EXP|Use\s*By)\s*[:\-]?\s*([0-9]{1,2}[\/\.\-][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{2,4}|[A-Za-z]{3}\s*[0-9]{2,4})",
        ],
        "country_of_origin": [
            r"(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:\-]?\s*([A-Za-z\s]{3,20})",
        ],
        "manufacturer": [
            r"(?:Mfg\s*by|Manufactured\s*by|Packed\s*by|Marketed\s*by|Imported\s*by|Produced\s*by)\s*[:\-]?\s*([A-Za-z0-9\s,.\-#/&()]+)",
        ],
        "barcode": [
            r"(?:Barcode|EAN|GTIN|UPC|EAN-13|GTIN-13)\s*[:\-]?\s*([0-9]{8,14})\b",
            r"\b(890[0-9]{10})\b",
            r"\b([0-9]{12,14})\b",
        ],
        "generic_name": [
            r"(?:Generic\s*Name|Commodity\s*Name|Name\s*of\s*Commodity|Commodity|Common\s*Name)\s*[:\-]?\s*([A-Za-z0-9\s,.\-()]{3,50})",
        ],
        "storage_instructions": [
            r"(?:Storage\s*(?:Instructions|Conditions)?|Store\s*in|Keep\s*in)\s*[:\-]?\s*([^\n]+(?:\n[^\n]+)?)",
        ]
    }

    @classmethod
    def is_slogan_or_marketing(cls, text: str) -> bool:
        if not text:
            return False
        clean = text.strip().lower()
        return any(re.search(pat, clean, re.IGNORECASE) for pat in cls.SLOGAN_PATTERNS)

    @classmethod
    def is_nutrition_text(cls, text: str) -> bool:
        if not text:
            return False
        clean = text.strip().lower()
        return any(kw in clean for kw in cls.NUTRITION_KEYWORDS)

    @classmethod
    def is_storage_text(cls, text: str) -> bool:
        if not text:
            return False
        clean = text.strip().lower()
        return any(kw in clean for kw in cls.STORAGE_KEYWORDS)

    @classmethod
    def structure_fields(
        cls,
        raw_text: str,
        blocks: List[TextBlock],
        product_name_hint: Optional[str] = None,
        brand_hint: Optional[str] = None
    ) -> Dict[str, ExtractedField]:
        fields: Dict[str, ExtractedField] = {}

        # 1. Net Quantity: Enforce strict priority on explicit declarations and exclude nutrition facts
        fields["net_quantity"] = cls._extract_net_quantity(raw_text, blocks)

        # 2. MRP / Maximum Retail Price
        fields["mrp"] = cls._extract_entity(
            key="mrp",
            name="Maximum Retail Price (MRP)",
            patterns=cls.PATTERNS["mrp"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 3. Unit Sale Price (USP)
        fields["unit_sale_price"] = cls._extract_entity(
            key="unit_sale_price",
            name="Unit Sale Price (USP)",
            patterns=cls.PATTERNS["usp"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 4. FSSAI / Statutory License
        fields["license_number"] = cls._extract_entity(
            key="license_number",
            name="FSSAI License / Registration No.",
            patterns=cls.PATTERNS["license_number"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 5. Consumer Care Contact
        fields["consumer_care"] = cls._extract_entity(
            key="consumer_care",
            name="Consumer Care Details",
            patterns=cls.PATTERNS["consumer_care"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 6. Ingredients List
        fields["ingredients"] = cls._extract_entity(
            key="ingredients",
            name="Ingredients Declaration",
            patterns=cls.PATTERNS["ingredients"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 7. Allergen Statement
        fields["allergen_warning"] = cls._extract_entity(
            key="allergen_warning",
            name="Allergen Warning",
            patterns=cls.PATTERNS["allergen_warning"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 8. Date of Manufacture / Best Before / Packed On
        fields["date_markings"] = cls._extract_entity(
            key="date_markings",
            name="Date of Manufacture / Expiry / Packed On",
            patterns=cls.PATTERNS["date_markings"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 9. Country of Origin
        fields["country_of_origin"] = cls._extract_entity(
            key="country_of_origin",
            name="Country of Origin",
            patterns=cls.PATTERNS["country_of_origin"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 10. Manufacturer / Packer Address
        fields["manufacturer"] = cls._extract_entity(
            key="manufacturer",
            name="Manufacturer / Packer Name & Address",
            patterns=cls.PATTERNS["manufacturer"],
            raw_text=raw_text,
            blocks=blocks,
            require_alpha=True
        )

        # 11. Barcode / GTIN / EAN
        fields["barcode"] = cls._extract_entity(
            key="barcode",
            name="Barcode / GTIN / EAN",
            patterns=cls.PATTERNS["barcode"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 12. Generic / Common Commodity Name
        fields["generic_name"] = cls._extract_entity(
            key="generic_name",
            name="Generic / Common Commodity Name",
            patterns=cls.PATTERNS["generic_name"],
            raw_text=raw_text,
            blocks=blocks,
            require_alpha=True
        )

        # 13. Storage Instructions
        fields["storage_instructions"] = cls._extract_entity(
            key="storage_instructions",
            name="Storage Instructions",
            patterns=cls.PATTERNS["storage_instructions"],
            raw_text=raw_text,
            blocks=blocks
        )

        # 14. Brand Identity & Product Name (with strict marketing slogan & storage filtering)
        brand_field, prod_name_field = cls._extract_brand_and_product_name(
            raw_text=raw_text,
            blocks=blocks,
            product_name_hint=product_name_hint,
            brand_hint=brand_hint
        )
        fields["brand"] = brand_field
        fields["product_name"] = prod_name_field

        return fields

    @classmethod
    def _extract_net_quantity(cls, raw_text: str, blocks: List[TextBlock]) -> ExtractedField:
        """
        Extracts Net Quantity strictly from explicit declarations or PDP standalone metric text.
        Rejects nutrition table entries and marketing slogans (e.g. 37g carbohydrates).
        """
        # Step 1: Search for explicit "Net Qty: X g" in non-nutrition blocks
        # Prioritize FRONT panel blocks first
        front_blocks = [b for b in blocks if b.normalized_box and b.normalized_box.panel_type == "FRONT"]
        other_blocks = [b for b in blocks if not (b.normalized_box and b.normalized_box.panel_type == "FRONT")]
        ordered_blocks = front_blocks + other_blocks

        # 1a. Explicit keyword match across text blocks
        for block in ordered_blocks:
            if cls.is_nutrition_text(block.text):
                continue
            for pat in cls.PATTERNS["net_quantity_explicit"]:
                match = re.search(pat, block.text, re.IGNORECASE)
                if match:
                    val = match.group(1).strip()
                    tight_box = cls._compute_tight_box(block, match.group(0))
                    return ExtractedField(
                        field_key="net_quantity",
                        field_name="Declared Net Quantity",
                        extracted_value=val,
                        status="EXTRACTED",
                        confidence=block.confidence or 0.96,
                        evidence_box=tight_box,
                        source="Explicit Packaging Declaration"
                    )

        # 1b. Standalone metric declaration on FRONT panel (e.g. "250 g")
        for block in front_blocks:
            if cls.is_nutrition_text(block.text) or cls.is_slogan_or_marketing(block.text):
                continue
            for pat in cls.PATTERNS["net_quantity_standalone"]:
                match = re.search(pat, block.text, re.IGNORECASE)
                if match:
                    val = match.group(1).strip()
                    tight_box = cls._compute_tight_box(block, match.group(0))
                    return ExtractedField(
                        field_key="net_quantity",
                        field_name="Declared Net Quantity",
                        extracted_value=val,
                        status="EXTRACTED",
                        confidence=0.92,
                        evidence_box=tight_box,
                        source="Front Panel Metric Declaration"
                    )

        # 1c. Explicit pattern in raw text if not in parsed blocks (rare fallback)
        for line in raw_text.splitlines():
            if cls.is_nutrition_text(line):
                continue
            for pat in cls.PATTERNS["net_quantity_explicit"]:
                match = re.search(pat, line, re.IGNORECASE)
                if match:
                    val = match.group(1).strip()
                    return ExtractedField(
                        field_key="net_quantity",
                        field_name="Declared Net Quantity",
                        extracted_value=val,
                        status="EXTRACTED",
                        confidence=0.85,
                        evidence_box=None,
                        source="Raw Text Stream"
                    )

        # Not found
        return ExtractedField(
            field_key="net_quantity",
            field_name="Declared Net Quantity",
            extracted_value=None,
            status="NOT_FOUND",
            confidence=0.0,
            evidence_box=None,
            source="Unidentified"
        )

    @classmethod
    def _extract_brand_and_product_name(
        cls,
        raw_text: str,
        blocks: List[TextBlock],
        product_name_hint: Optional[str] = None,
        brand_hint: Optional[str] = None
    ) -> tuple[ExtractedField, ExtractedField]:
        """
        Extracts Brand and Product Name without mistaking marketing slogans/taglines for product identity.
        """
        clean_name_hint = product_name_hint if not cls._is_filename_like(product_name_hint) else None
        clean_brand_hint = brand_hint if not cls._is_filename_like(brand_hint) else None

        # Filter candidate blocks from FRONT panel
        front_blocks = [b for b in blocks if b.normalized_box and b.normalized_box.panel_type == "FRONT"]
        eligible_blocks = front_blocks if front_blocks else blocks

        # Filter out slogans, dates, prices, net qty, nutrition, and storage instructions
        non_marketing_blocks = []
        for b in eligible_blocks:
            t = b.text.strip()
            if not t or len(t) < 2:
                continue
            if cls.is_slogan_or_marketing(t) or cls.is_nutrition_text(t) or cls.is_storage_text(t):
                continue
            if any(k in t.lower() for k in [
                "mrp", "m.r.p", "₹", "rs.", "mfg", "pkd", "fssai", "batch", "lot", "barcode",
                "consumer care", "customer care", "helpline", "toll free", "email", "phone", "tel:",
                "lic", "license", "best before", "use by", "expiry", "exp:", "exp date",
                "net qty", "net quantity", "net weight", "net wt", "net vol", "net volume",
                "ingredients", "allergen", "manufactured", "packed by", "marketed by", "imported by",
                "storage", "store in", "keep in", "cool, dry", "cool dry", "sunlight", "dry place",
                "directions", "how to use", "warning", "caution"
            ]):
                continue
            if re.match(r"^\s*\d+(?:\.\d+)?\s*(?:g|kg|ml|l|mg|gms|kgs|units?|pieces?|tablets?|capsules?|nos?|count)\b", t, re.IGNORECASE):
                continue
            if cls._is_filename_like(t):
                continue
            non_marketing_blocks.append(b)

        # 1. Brand Extraction
        brand_field = None
        if clean_brand_hint and clean_brand_hint.lower() in raw_text.lower():
            matching_box = next((b.normalized_box for b in blocks if clean_brand_hint.lower() in b.text.lower()), None)
            brand_field = ExtractedField(
                field_key="brand",
                field_name="Brand Identity",
                extracted_value=clean_brand_hint,
                status="EXTRACTED",
                confidence=0.99,
                evidence_box=matching_box
            )
        elif non_marketing_blocks and not cls.is_storage_text(non_marketing_blocks[0].text) and not cls.is_slogan_or_marketing(non_marketing_blocks[0].text):
            candidate_brand = non_marketing_blocks[0].text.strip()
            brand_field = ExtractedField(
                field_key="brand",
                field_name="Brand Identity",
                extracted_value=candidate_brand,
                status="EXTRACTED",
                confidence=0.88,
                evidence_box=non_marketing_blocks[0].normalized_box
            )
        else:
            brand_field = ExtractedField(
                field_key="brand",
                field_name="Brand Identity",
                extracted_value=None,
                status="NOT_FOUND",
                confidence=0.0,
                evidence_box=None
            )

        # 2. Product Name Extraction
        prod_field = None
        if clean_name_hint and clean_name_hint.lower() in raw_text.lower():
            matching_box = next((b.normalized_box for b in blocks if clean_name_hint.lower() in b.text.lower()), None)
            prod_field = ExtractedField(
                field_key="product_name",
                field_name="Product Name / Commercial Descriptor",
                extracted_value=clean_name_hint,
                status="EXTRACTED",
                confidence=0.99,
                evidence_box=matching_box
            )
        elif len(non_marketing_blocks) > 1:
            candidate_name = non_marketing_blocks[1].text.strip()
            # Double check candidate is not a marketing slogan or storage instruction
            if not cls.is_slogan_or_marketing(candidate_name) and not cls.is_storage_text(candidate_name) and not cls._is_filename_like(candidate_name):
                prod_field = ExtractedField(
                    field_key="product_name",
                    field_name="Product Name / Commercial Descriptor",
                    extracted_value=candidate_name,
                    status="EXTRACTED",
                    confidence=0.85,
                    evidence_box=non_marketing_blocks[1].normalized_box
                )
            else:
                prod_field = ExtractedField(
                    field_key="product_name",
                    field_name="Product Name / Commercial Descriptor",
                    extracted_value=None,
                    status="NOT_FOUND",
                    confidence=0.0,
                    evidence_box=None
                )
        else:
            prod_field = ExtractedField(
                field_key="product_name",
                field_name="Product Name / Commercial Descriptor",
                extracted_value=None,
                status="NOT_FOUND",
                confidence=0.0,
                evidence_box=None
            )

        return brand_field, prod_field

    @classmethod
    def _compute_tight_box(cls, block: TextBlock, matched_subtext: str) -> BoundingBoxCoord:
        """
        Computes a tight bounding box around the matched line/subtext within a multi-line block.
        """
        if not block.normalized_box:
            return BoundingBoxCoord(x=10, y=10, width=20, height=5, label=matched_subtext[:20])

        box = block.normalized_box
        lines = [l.strip() for l in block.text.splitlines() if l.strip()]
        if len(lines) <= 1:
            return box

        # Find which line contains the match
        matched_line_idx = 0
        for idx, line in enumerate(lines):
            if matched_subtext.lower() in line.lower() or any(w in line.lower() for w in matched_subtext.lower().split()):
                matched_line_idx = idx
                break

        line_height_pct = box.height / len(lines)
        tight_y = round(box.y + (matched_line_idx * line_height_pct), 2)
        tight_h = round(max(line_height_pct, 2.0), 2)

        return BoundingBoxCoord(
            x=box.x,
            y=tight_y,
            width=box.width,
            height=tight_h,
            label=f"[{box.panel_type or 'PANEL'}] {matched_subtext[:20]}",
            panel_type=box.panel_type,
            panel_id=box.panel_id
        )

    @staticmethod
    def _is_filename_like(name: Optional[str]) -> bool:
        if not name:
            return False
        lower = name.lower().strip()
        filename_prefixes = [
            "screenshot", "screen shot", "img_", "img-", "dsc_", "whatsapp",
            "pasted", "image", "photo", "scan", "artboard", "panel_", "picture",
            "untitled", "download", "document", "capture", "front", "back", "left", "right", "top"
        ]
        if any(lower.startswith(prefix) for prefix in filename_prefixes):
            return True
        if re.search(r"\b(screenshot|dsc_\d|img_\d|\d{4}-\d{2}-\d{2})\b", lower):
            return True
        if any(lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".pdf", ".webp", ".ai", ".psd", ".svg", ".tiff"]):
            return True
        return False

    @classmethod
    def _extract_entity(
        cls,
        key: str,
        name: str,
        patterns: List[str],
        raw_text: str,
        blocks: List[TextBlock],
        require_alpha: bool = False
    ) -> ExtractedField:
        # Check patterns across text blocks first to bind exact tight coordinates
        for block in blocks:
            for pat in patterns:
                match = re.search(pat, block.text, re.IGNORECASE)
                if match:
                    val = match.group(1).strip() if match.groups() else match.group(0).strip()
                    if require_alpha and len(re.sub(r'[^a-zA-Z]', '', val)) < 3:
                        continue
                    tight_box = cls._compute_tight_box(block, match.group(0))
                    return ExtractedField(
                        field_key=key,
                        field_name=name,
                        extracted_value=val,
                        status="EXTRACTED",
                        confidence=block.confidence or 0.92,
                        evidence_box=tight_box,
                        source="Vector/OCR Layout"
                    )

        # Fallback to full raw text regex search
        for pat in patterns:
            match = re.search(pat, raw_text, re.IGNORECASE)
            if match:
                val = match.group(1).strip() if match.groups() else match.group(0).strip()
                if require_alpha and len(re.sub(r'[^a-zA-Z]', '', val)) < 3:
                    continue
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
