"""
Statutory Legal Metrology Rule Definitions & Official DCA Sources.

All rules are verified against official publications of the Department of Consumer Affairs (DCA),
Ministry of Consumer Affairs, Food and Public Distribution, Government of India:
- Legal Metrology (Packaged Commodities) Rules, 2011 (G.S.R. 202(E), dated 07.03.2011, w.e.f. 01.04.2011)
- Legal Metrology (Packaged Commodities) Amendment Rules, 2017 (G.S.R. 592(E), dated 23.06.2017, w.e.f. 01.01.2018)
- Legal Metrology (Packaged Commodities) Amendment Rules, 2021 (G.S.R. 779(E), dated 02.11.2021, w.e.f. 01.12.2022)
- Legal Metrology (Packaged Commodities) Amendment Rules, 2023 (G.S.R. 747(E), QR code declarations)
- Legal Metrology (Packaged Commodities) Amendment Rules, 2025 (Gazette notification dated 24.10.2025)
- Legal Metrology (Packaged Commodities) Second Amendment Rules, 2025 (Gazette notification dated 02.12.2025)
- Legal Metrology (Packaged Commodities) Amendment Rules, 2026 (G.S.R. 106(E), dated 13.02.2026 - Rule 6(10A) e-commerce origin filter)
- Legal Metrology (Packaged Commodities) Second Amendment Rules, 2026 (G.S.R. 274(E), dated 27.04.2026 - Rule 6(10A) substituted, w.e.f. 01.07.2027)
- Legal Metrology (Packaged Commodities) Third Amendment Rules, 2026 (Gazette notification dated 29.05.2026)
"""

VERIFIED_RULE_SOURCES = [
    {
        "id": "SRC-DCA-LMPC-2011",
        "title": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "issuing_authority": "Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "PRINCIPAL_STATUTE_RULES",
        "publication_date": "2011-03-07",
        "effective_date": "2011-04-01",
        "status": "ACTIVE"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2017",
        "title": "Legal Metrology (Packaged Commodities) Amendment Rules, 2017 (Country of Origin Rule 6(1)(aa))",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2017-06-23",
        "effective_date": "2018-01-01",
        "status": "ACTIVE"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2021",
        "title": "Legal Metrology (Packaged Commodities) Amendment Rules, 2021 (Unit Sale Price & Date Format, G.S.R. 779(E))",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2021-11-02",
        "effective_date": "2022-12-01",
        "status": "ACTIVE"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2023",
        "title": "Legal Metrology (Packaged Commodities) Amendment Rules, 2023 (G.S.R. 747(E))",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2023-10-06",
        "effective_date": "2024-01-01",
        "status": "ACTIVE"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2025-OCT",
        "title": "Legal Metrology (Packaged Commodities) Amendment Rules, 2025 (Standard Pack Provisions)",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2025-10-24",
        "effective_date": "2026-01-01",
        "status": "ACTIVE"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2025-DEC",
        "title": "Legal Metrology (Packaged Commodities) Second Amendment Rules, 2025 (Multipack Provisions)",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2025-12-02",
        "effective_date": "2026-03-01",
        "status": "ACTIVE"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2026-FEB",
        "title": "Legal Metrology (Packaged Commodities) Amendment Rules, 2026 (G.S.R. 106(E), Initial Rule 6(10A))",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2026-02-13",
        "effective_date": "2026-02-13",
        "status": "SUPERSEDED"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2026-APR",
        "title": "Legal Metrology (Packaged Commodities) Second Amendment Rules, 2026 (G.S.R. 274(E), Substituted Rule 6(10A), w.e.f. 01.07.2027)",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2026-04-27",
        "effective_date": "2027-07-01",
        "status": "FUTURE_EFFECTIVE"
    },
    {
        "id": "SRC-DCA-LMPC-AMEND-2026-MAY",
        "title": "Legal Metrology (Packaged Commodities) Third Amendment Rules, 2026 (Exemption Thresholds)",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2026-05-29",
        "effective_date": "2026-08-01",
        "status": "ACTIVE"
    }
]

VERIFIED_RULES_CATALOG = [
    {
        "rule_id": "RULE-LMPC-MFG-ADDR",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-MFG-ADDR",
        "title": "Manufacturer, Packer, or Importer Declaration",
        "category": "Legal Metrology",
        "severity": "CRITICAL",
        "description": "Rule 6(1)(a) & 6(1)(ab) mandate the clear declaration of the name and complete physical address of the manufacturer, packer, or importer on every pre-packaged commodity.",
        "versions": [
            {
                "version_id": "RV-LMPC-MFG-ADDR-2011-V1",
                "version_number": 1,
                "title": "Manufacturer/Packer/Importer Name & Address",
                "requirement_text": "The name and complete physical address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer, and for any imported package the name and address of the importer.",
                "source_id": "SRC-DCA-LMPC-2011",
                "source_reference": "Rule 6(1)(a) & Rule 6(1)(ab)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2011-04-01",
                "effective_to": None,
                "applicability": "ALL_PREPACKAGED_COMMODITIES",
                "evaluation_type": "DETERMINISTIC_FIELD",
                "parameters": {
                    "required_elements": ["name", "address"],
                    "keywords": ["manufactured by", "mfg by", "packed by", "marketed by", "imported by"]
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-COMMODITY-NAME",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-COMMODITY-NAME",
        "title": "Common or Generic Commodity Name",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(b) requires the common or generic name of the commodity contained in the package to be explicitly declared on the Principal Display Panel.",
        "versions": [
            {
                "version_id": "RV-LMPC-COMMODITY-NAME-2011-V1",
                "version_number": 1,
                "title": "Generic Name of Commodity",
                "requirement_text": "The common or generic names of the commodity contained in the package and in case of packages with more than one product, the name and number or quantity of each product shall be mentioned on the package.",
                "source_id": "SRC-DCA-LMPC-2011",
                "source_reference": "Rule 6(1)(b)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2011-04-01",
                "effective_to": None,
                "applicability": "ALL_PREPACKAGED_COMMODITIES",
                "evaluation_type": "DETERMINISTIC_FIELD",
                "parameters": {
                    "require_non_empty": True
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-NET-QTY",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-NET-QTY",
        "title": "Net Quantity in Standard Metric Units",
        "category": "Legal Metrology",
        "severity": "CRITICAL",
        "description": "Rule 6(1)(c), Rule 11 & Second Schedule require net quantity to be declared in terms of standard metric units (g, kg, ml, l, N) and prohibit non-standard abbreviations (e.g. gms, kgs, lts).",
        "versions": [
            {
                "version_id": "RV-LMPC-NET-QTY-2011-V1",
                "version_number": 1,
                "title": "Net Quantity Metric Standard",
                "requirement_text": "The net quantity, in terms of standard unit of weight or measure of the commodity contained in the package or where the commodity is packed or sold by number, the number of the commodity contained in the package shall be mentioned.",
                "source_id": "SRC-DCA-LMPC-2011",
                "source_reference": "Rule 6(1)(c), Rule 11 & Second Schedule",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2011-04-01",
                "effective_to": None,
                "applicability": "ALL_PREPACKAGED_COMMODITIES",
                "evaluation_type": "DETERMINISTIC_METRIC_UNIT",
                "parameters": {
                    "legal_weight_units": ["g", "kg", "mg"],
                    "legal_volume_units": ["ml", "l", "cl"],
                    "legal_number_units": ["n", "u", "unit", "units", "piece", "pieces"],
                    "prohibited_abbreviations": ["gms", "gms.", "kgs", "kgs.", "lts", "lts.", "cc", "cc."]
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-DATE",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-DATE",
        "title": "Month and Year of Manufacture / Packaging",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(d) mandates the declaration of month and year in which the commodity is manufactured or pre-packed or imported.",
        "versions": [
            {
                "version_id": "RV-LMPC-DATE-2021-V1",
                "version_number": 1,
                "title": "Month & Year of Packaging (MM/YYYY format)",
                "requirement_text": "The month and year in which the commodity is manufactured or pre-packed or imported shall be clearly indicated on the package.",
                "source_id": "SRC-DCA-LMPC-AMEND-2021",
                "source_reference": "Rule 6(1)(d) as amended by G.S.R. 779(E)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2022-12-01",
                "effective_to": None,
                "applicability": "ALL_PREPACKAGED_COMMODITIES",
                "evaluation_type": "DETERMINISTIC_DATE_FORMAT",
                "parameters": {
                    "date_prefixes": ["mfg", "pkd", "packed", "manufactured", "imported"],
                    "patterns": ["MM/YYYY", "MM/YY", "Month YYYY"]
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-MRP",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-MRP",
        "title": "Maximum Retail Price (MRP) & Tax Inclusion",
        "category": "Legal Metrology",
        "severity": "CRITICAL",
        "description": "Rule 6(1)(e) mandates the retail sale price of the package in the format 'MRP Rs. XX.XX' or 'MRP ₹ XX.XX' inclusive of all taxes.",
        "versions": [
            {
                "version_id": "RV-LMPC-MRP-2011-V1",
                "version_number": 1,
                "title": "Maximum Retail Price Declaration",
                "requirement_text": "The retail sale price of the package shall clearly indicate Maximum Retail Price (MRP) in Indian Rupees, inclusive of all taxes.",
                "source_id": "SRC-DCA-LMPC-2011",
                "source_reference": "Rule 6(1)(e) & G.S.R. 779(E)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2011-04-01",
                "effective_to": None,
                "applicability": "ALL_PREPACKAGED_COMMODITIES",
                "evaluation_type": "DETERMINISTIC_CURRENCY_PRICE",
                "parameters": {
                    "mrp_indicators": ["mrp", "maximum retail price", "max retail price"],
                    "tax_clause_required": True,
                    "tax_clause_keywords": ["incl. of all taxes", "inclusive of all taxes", "incl of all taxes"]
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-USP",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-USP",
        "title": "Unit Sale Price (USP) Declaration",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(ea) requires the Unit Sale Price (USP) to be declared on pre-packaged commodities where the package contains more than 1 kg or 1 L (e.g. ₹ X / g or ₹ X / kg).",
        "versions": [
            {
                "version_id": "RV-LMPC-USP-2021-V1",
                "version_number": 1,
                "title": "Unit Sale Price Representation",
                "requirement_text": "The unit sale price in rupees rounded off to the nearest two decimal places, per gram, per kilogram, per millilitre, per litre, or per item.",
                "source_id": "SRC-DCA-LMPC-AMEND-2021",
                "source_reference": "Rule 6(1)(ea) as inserted by G.S.R. 779(E)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2022-12-01",
                "effective_to": None,
                "applicability": "QUANTITY_TIERED_COMMODITIES",
                "evaluation_type": "DETERMINISTIC_UNIT_SALE_PRICE",
                "parameters": {
                    "mandatory_net_weight_threshold_grams": 1000.0,
                    "mandatory_net_volume_threshold_ml": 1000.0,
                    "usp_indicators": ["usp", "unit sale price", "/g", "/kg", "/ml", "/l", "per g", "per kg"]
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-CONSUMER-CARE",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-CONSUMER-CARE",
        "title": "Consumer Care & Complaint Contact Details",
        "category": "Legal Metrology",
        "severity": "CRITICAL",
        "description": "Rule 6(1)(f) mandates the name, address, telephone number, and e-mail address of the person or office which may be contacted in case of consumer complaints.",
        "versions": [
            {
                "version_id": "RV-LMPC-CONSUMER-CARE-2011-V1",
                "version_number": 1,
                "title": "Consumer Care Contact Information",
                "requirement_text": "The name, address, telephone number, and e-mail address of the person or office which may be contacted in case of consumer complaints shall be explicitly mentioned.",
                "source_id": "SRC-DCA-LMPC-2011",
                "source_reference": "Rule 6(1)(f)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2011-04-01",
                "effective_to": None,
                "applicability": "ALL_PREPACKAGED_COMMODITIES",
                "evaluation_type": "DETERMINISTIC_CONTACT_INFO",
                "parameters": {
                    "required_channels": ["phone_or_email", "contact_entity"],
                    "keywords": ["consumer care", "customer care", "helpline", "toll free", "feedback", "complaints"]
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-COUNTRY-ORIGIN",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-COUNTRY-ORIGIN",
        "title": "Country of Origin for Imported Commodities",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(aa) mandates that the name of the country of origin or manufacture or assembly in case of imported products shall be declared on the package.",
        "versions": [
            {
                "version_id": "RV-LMPC-COUNTRY-ORIGIN-2017-V1",
                "version_number": 1,
                "title": "Country of Origin Declaration",
                "requirement_text": "Name of the country of origin or manufacturer or assembly in case of imported products shall be declared on the package.",
                "source_id": "SRC-DCA-LMPC-AMEND-2017",
                "source_reference": "Rule 6(1)(aa) as inserted by G.S.R. 592(E)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2018-01-01",
                "effective_to": None,
                "applicability": "IMPORTED_COMMODITIES_ONLY",
                "evaluation_type": "DETERMINISTIC_ORIGIN_DECLARATION",
                "parameters": {
                    "keywords": ["country of origin", "made in", "product of", "manufactured in", "origin:"]
                },
                "status": "ACTIVE"
            }
        ]
    },
    {
        "rule_id": "RULE-LMPC-ECOM-ORIGIN-FILTER",
        "domain": "LEGAL_METROLOGY_ECOMMERCE",
        "rule_code": "LMPC-ECOM-COUNTRY-ORIGIN-FILTER",
        "title": "E-Commerce Searchable/Sortable Country of Origin Filter",
        "category": "E-Commerce Listing (Out of Physical Artwork Scope)",
        "severity": "MAJOR",
        "description": "Rule 6(10A) requires e-commerce entities selling imported products to provide a mechanism to search and sort by country of origin. (Substituted by GSR 274(E) dated 27.04.2026, with future effective date 01.07.2027).",
        "versions": [
            {
                "version_id": "RV-LMPC-ECOM-ORIGIN-2026-FEB-V1",
                "version_number": 1,
                "title": "E-Commerce Origin Filter (Initial February 2026 Notification)",
                "requirement_text": "E-commerce marketplace entities shall display country of origin filter on catalog pages.",
                "source_id": "SRC-DCA-LMPC-AMEND-2026-FEB",
                "source_reference": "Rule 6(10A) as inserted by G.S.R. 106(E) (13.02.2026)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2026-02-13",
                "effective_to": "2026-04-27",
                "applicability": "ECOMMERCE_LISTINGS_ONLY",
                "evaluation_type": "ECOMMERCE_PLATFORM_FEATURE",
                "parameters": {
                    "scope": "e_commerce_listing",
                    "note": "Superceded by G.S.R. 274(E) dated 27.04.2026."
                },
                "status": "SUPERSEDED"
            },
            {
                "version_id": "RV-LMPC-ECOM-ORIGIN-2026-APR-V2",
                "version_number": 2,
                "title": "E-Commerce Origin Search/Sort Mechanism (Future Effective 01.07.2027)",
                "requirement_text": "Substituted Rule 6(10A): E-commerce entities offering imported goods shall enable consumer filtering and sorting by country of origin. Effective from 1st July, 2027.",
                "source_id": "SRC-DCA-LMPC-AMEND-2026-APR",
                "source_reference": "Rule 6(10A) substituted by G.S.R. 274(E) (27.04.2026)",
                "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
                "effective_from": "2027-07-01",
                "effective_to": None,
                "applicability": "ECOMMERCE_LISTINGS_ONLY",
                "evaluation_type": "ECOMMERCE_PLATFORM_FEATURE",
                "parameters": {
                    "scope": "e_commerce_listing",
                    "future_effective_date": "2027-07-01"
                },
                "status": "FUTURE_EFFECTIVE"
            }
        ]
    }
]

