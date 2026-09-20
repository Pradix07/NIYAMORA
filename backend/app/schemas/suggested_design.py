from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class StructuredUSPModel(BaseModel):
    quantity_basis: str # MASS, VOLUME, LENGTH, COUNT
    quantity_value: float
    quantity_unit: str
    usp_basis: str # per g, per kg, per ml, per L, per cm, per m, per number/unit
    usp_value: Optional[float] = None
    usp_unit: str
    mrp_value: Optional[float] = None
    rounding_rule: str = "ROUND_TWO_DECIMALS"
    rule_version: str = "RV-LMPC-USP-2021-V1"
    applicability: str = "QUANTITY_TIERED_COMMODITIES"
    evaluation_status: str = "PASS" # PASS, ISSUE, REVIEW, N/A
    scope_note: Optional[str] = None

class SuggestedDesignChange(BaseModel):
    change_id: str
    finding_id: Optional[str] = None
    field_key: str
    field_name: str
    original_value: Optional[str] = None
    suggested_value: str
    original_location: Optional[Dict[str, Any]] = None
    suggested_location: Optional[Dict[str, Any]] = None
    original_style: Optional[Dict[str, Any]] = None
    suggested_style: Optional[Dict[str, Any]] = None
    reason: str
    rule_code: str
    rule_reference: Optional[str] = None
    evidence_reference: Optional[str] = None
    change_type: str = "CORRECTION" # CORRECTION, ADDITION, REPOSITION, REFORMAT, REVIEW_REQUIRED
    status: str = "FIXED" # FIXED, IMPROVED, REVIEW, REVIEW_REQUIRED
    structured_usp: Optional[StructuredUSPModel] = None

    model_config = ConfigDict(from_attributes=True)

class SuggestedDesignRead(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    source_artwork_version_id: str
    source_inspection_id: str
    suggested_artwork_version_id: Optional[str] = None
    version_label: str
    status: str
    change_set: List[SuggestedDesignChange] = []
    rendered_artwork_reference: Optional[str] = None
    preview_url: Optional[str] = None
    source_preview_url: Optional[str] = None
    validation_status: str
    validation_inspection_id: Optional[str] = None
    report_reference: Optional[str] = None
    created_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComparisonDetailItem(BaseModel):
    category: str
    field: str
    status_a: str
    status_b: str
    change_type: str # Fixed, Improved, Unchanged, New Issue, Review Changed, Unchanged Review
    detail: str
    rule_code: str

class ComparisonResultRead(BaseModel):
    product_id: str
    product_name: str
    version_a_id: str
    version_b_id: str
    version_a_label: str
    version_b_label: str
    version_a_preview_url: Optional[str] = None
    version_b_preview_url: Optional[str] = None
    fixed_count: int
    improved_count: int
    unchanged_count: int
    new_issue_count: int
    review_count: int
    version_a_summary: Optional[Dict[str, int]] = None # {"PASS": X, "ISSUE": Y, "REVIEW": Z}
    version_b_summary: Optional[Dict[str, int]] = None
    details: List[ComparisonDetailItem]

class RegressionIssueItem(BaseModel):
    rule_code: str
    field: str
    description: str
    old_status: str
    new_status: str
    severity: str
    suggested_action: Optional[str] = None

class RegressionResultRead(BaseModel):
    product_id: str
    product_name: str
    comparison_title: str
    version_a_label: str
    version_b_label: str
    regression_detected: bool
    regression_verdict: str # NO_REGRESSION, REGRESSION_DETECTED, IMPROVED
    fixed_issues: List[RegressionIssueItem]
    new_issues_introduced: List[RegressionIssueItem]
    improved_issues: List[RegressionIssueItem]
    unchanged_issues: List[RegressionIssueItem]
    review_changed_issues: List[RegressionIssueItem] = []
    version_a_summary: Optional[Dict[str, int]] = None
    version_b_summary: Optional[Dict[str, int]] = None

class SimulationRequest(BaseModel):
    rule_code: str = "LMPC-DECL-NET-QTY"
    font_height_mm: Optional[float] = None
    pack_weight_g: Optional[float] = None
    pdp_area_sqcm: Optional[float] = None
    packaging_type: Optional[str] = "WEIGHT" # WEIGHT, VOLUME, LENGTH, COUNT
    mrp: Optional[str] = None
    unit_sale_price: Optional[str] = None
    category: Optional[str] = None
    date_str: Optional[str] = None
    consumer_phone: Optional[str] = None
    consumer_email: Optional[str] = None

class SimulationResponse(BaseModel):
    rule_code: str
    rule_title: str
    source_reference: str
    current_parameter: Dict[str, Any]
    hypothetical_parameter: Dict[str, Any]
    current_verdict: str # PASS, ISSUE, REVIEW, N/A
    hypothetical_verdict: str # PASS, ISSUE, REVIEW, N/A
    explanation: str
    difference_label: str
    threshold_matrix: Optional[List[Dict[str, Any]]] = None

class AttentionMapItem(BaseModel):
    id: str
    category: str
    field: str
    rule_code: str
    status: str # ISSUE, REVIEW, PASS, N/A
    density_level: str # HIGH, MEDIUM, LOW
    bbox: Optional[Dict[str, Any]] = None
    finding_id: Optional[str] = None
    explanation: str

class RiskMapItem(AttentionMapItem):
    pass

class RiskMapResponse(BaseModel):
    product_id: str
    inspection_id: str
    total_findings: int
    issue_count: int
    review_count: int
    pass_count: int
    high_density_count: int
    medium_density_count: int
    low_density_count: int
    risk_items: List[RiskMapItem]
