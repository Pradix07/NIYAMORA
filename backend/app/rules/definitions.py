"""
Statutory Legal Metrology Rule Definitions & Official DCA Sources.

All rules are verified against official publications of the Department of Consumer Affairs (DCA),
Ministry of Consumer Affairs, Food and Public Distribution, Government of India:
- Legal Metrology (Packaged Commodities) Rules, 2011 (G.S.R. 202(E) / G.S.R. 147(E))
- Legal Metrology (Packaged Commodities) Amendment Rules, 2021 (G.S.R. 779(E))
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
        "id": "SRC-DCA-LMPC-AMEND-2021",
        "title": "Legal Metrology (Packaged Commodities) Amendment Rules, 2021 (Unit Sale Price & Date Format)",
        "issuing_authority": "Department of Consumer Affairs, Government of India",
        "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
        "document_type": "GAZETTE_AMENDMENT",
        "publication_date": "2021-11-02",
        "effective_date": "2022-12-01",
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
        "description": "Rule 6(1)(a) mandates the clear declaration of the name and complete address of the manufacturer, packer, or importer on every pre-packaged commodity.",
        "version": {
            "version_id": "RV-LMPC-MFG-ADDR-2011-V1",
            "version_number": 1,
            "title": "Manufacturer/Packer/Importer Name & Address",
            "requirement_text": "The name and complete physical address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer, and for any imported package the name and address of the importer.",
            "source_id": "SRC-DCA-LMPC-2011",
            "source_reference": "Rule 6(1)(a)",
            "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
            "effective_from": "2011-04-01",
            "effective_to": None,
            "applicability": "ALL_PREPACKAGED_COMMODITIES",
            "evaluation_type": "DETERMINISTIC_FIELD",
            "parameters": {
                "required_elements": ["name", "address"],
                "keywords": ["manufactured by", "mfg by", "packed by", "marketed by", "imported by"]
            }
        }
    },
    {
        "rule_id": "RULE-LMPC-COMMODITY-NAME",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-COMMODITY-NAME",
        "title": "Common or Generic Commodity Name",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(b) requires the common or generic name of the commodity contained in the package to be explicitly declared.",
        "version": {
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
            }
        }
    },
    {
        "rule_id": "RULE-LMPC-NET-QTY",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-NET-QTY",
        "title": "Net Quantity in Standard Metric Units",
        "category": "Legal Metrology",
        "severity": "CRITICAL",
        "description": "Rule 6(1)(c) and Rule 11 require net quantity to be declared in terms of standard unit of weight or measure, using statutory metric symbols (g, kg, ml, l, N).",
        "version": {
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
            }
        }
    },
    {
        "rule_id": "RULE-LMPC-DATE",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-DATE",
        "title": "Month and Year of Manufacture / Packaging",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(d) mandates the declaration of month and year in which the commodity is manufactured or pre-packed or imported.",
        "version": {
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
            }
        }
    },
    {
        "rule_id": "RULE-LMPC-MRP",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-MRP",
        "title": "Maximum Retail Price (MRP) & Tax Inclusion",
        "category": "Legal Metrology",
        "severity": "CRITICAL",
        "description": "Rule 6(1)(e) mandates the retail sale price of the package in the format 'MRP Rs. XX.XX' or 'MRP ₹ XX.XX' inclusive of all taxes.",
        "version": {
            "version_id": "RV-LMPC-MRP-2011-V1",
            "version_number": 1,
            "title": "Maximum Retail Price Declaration",
            "requirement_text": "The retail sale price of the package shall clearly indicate Maximum Retail Price (MRP) in Indian Rupees, inclusive of all taxes.",
            "source_id": "SRC-DCA-LMPC-2011",
            "source_reference": "Rule 6(1)(e)",
            "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
            "effective_from": "2011-04-01",
            "effective_to": None,
            "applicability": "ALL_PREPACKAGED_COMMODITIES",
            "evaluation_type": "DETERMINISTIC_CURRENCY_PRICE",
            "parameters": {
                "mrp_indicators": ["mrp", "maximum retail price", "max retail price"],
                "tax_clause_required": True,
                "tax_clause_keywords": ["incl. of all taxes", "inclusive of all taxes", "incl of all taxes"]
            }
        }
    },
    {
        "rule_id": "RULE-LMPC-USP",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-USP",
        "title": "Unit Sale Price (USP) Declaration",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(ea) requires the Unit Sale Price (USP) to be declared on pre-packaged commodities where the package contains more than 1 kg or 1 L (e.g. ₹ X / g or ₹ X / kg).",
        "version": {
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
            }
        }
    },
    {
        "rule_id": "RULE-LMPC-CONSUMER-CARE",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-CONSUMER-CARE",
        "title": "Consumer Care & Complaint Contact Details",
        "category": "Legal Metrology",
        "severity": "CRITICAL",
        "description": "Rule 6(1)(f) mandates the name, address, telephone number, and e-mail address of the person or office which may be contacted in case of consumer complaints.",
        "version": {
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
            }
        }
    },
    {
        "rule_id": "RULE-LMPC-COUNTRY-ORIGIN",
        "domain": "LEGAL_METROLOGY_PACKAGED_COMMODITIES",
        "rule_code": "LMPC-DECL-COUNTRY-ORIGIN",
        "title": "Country of Origin for Imported Commodities",
        "category": "Legal Metrology",
        "severity": "MAJOR",
        "description": "Rule 6(1)(g) and Rule 6(10) require the country of origin or manufacturer country to be stated on packages containing imported commodities.",
        "version": {
            "version_id": "RV-LMPC-COUNTRY-ORIGIN-2017-V1",
            "version_number": 1,
            "title": "Country of Origin Declaration",
            "requirement_text": "Name of the country of origin or manufacturer or assembly in case of imported products shall be declared on the package.",
            "source_id": "SRC-DCA-LMPC-2011",
            "source_reference": "Rule 6(1)(g) & Rule 6(10)",
            "source_url": "https://consumeraffairs.gov.in/pages/legal-metrology-act",
            "effective_from": "2017-06-23",
            "effective_to": None,
            "applicability": "IMPORTED_COMMODITIES_ONLY",
            "evaluation_type": "DETERMINISTIC_ORIGIN_DECLARATION",
            "parameters": {
                "keywords": ["country of origin", "made in", "product of", "manufactured in", "origin:"]
            }
        }
    }
]
