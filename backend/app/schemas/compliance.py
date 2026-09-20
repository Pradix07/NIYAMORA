from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class RuleSourceRead(BaseModel):
    id: str
    title: str
    issuing_authority: str
    source_url: str
    document_type: str
    publication_date: Optional[str] = None
    effective_date: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class RuleVersionRead(BaseModel):
    id: str
    rule_id: str
    rule_code: str
    version_number: int
    title: str
    requirement_text: str
    source_id: str
    source_reference: str
    source_url: str
    effective_from: str
    effective_to: Optional[str] = None
    applicability: str
    evaluation_type: str
    parameters: Dict[str, Any]
    status: str

    model_config = ConfigDict(from_attributes=True)

class RuleRead(BaseModel):
    id: str
    domain: str
    rule_code: str
    title: str
    category: str
    severity: str
    description: Optional[str] = None
    is_active: bool
    versions: List[RuleVersionRead] = []

    model_config = ConfigDict(from_attributes=True)

class EvidenceRead(BaseModel):
    id: str
    inspection_id: str
    source_type: str
    panel_id: Optional[str] = None
    page_number: Optional[int] = 1
    bbox: Optional[Any] = None
    observed_text: Optional[str] = None
    extracted_value: Optional[str] = None
    evidence_quality: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EvaluationRead(BaseModel):
    id: str
    inspection_id: str
    rule_version_id: str
    rule_code: Optional[str] = None
    rule_title: Optional[str] = None
    source_reference: Optional[str] = None
    source_url: Optional[str] = None
    status: str # PASS, ISSUE, REVIEW, N/A
    observed_value: Optional[str] = None
    expected_condition: str
    explanation: str
    evidence_id: Optional[str] = None
    evidence: Optional[EvidenceRead] = None
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FindingRead(BaseModel):
    id: str
    inspection_id: str
    evaluation_id: str
    rule_code: str
    severity: str
    status: str
    title: str
    summary: str
    observed_value: Optional[str] = None
    requirement: str
    suggested_action: str
    evidence_id: Optional[str] = None
    evidence: Optional[EvidenceRead] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HumanReviewCreate(BaseModel):
    inspection_id: str
    finding_id: Optional[str] = None
    reviewer_name: str = "Compliance Specialist"
    decision: str # APPROVED_PASS, CONFIRMED_ISSUE, EXEMPT_NA, NEW_IMAGE_REQUESTED
    notes: Optional[str] = None

class HumanReviewRead(BaseModel):
    id: str
    inspection_id: str
    finding_id: Optional[str] = None
    reviewer_name: str
    decision: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PassportVersionItem(BaseModel):
    version_id: str
    version_number: int
    version_label: str
    file_path: Optional[str] = None
    original_filename: Optional[str] = None
    created_at: datetime
    processing_status: Optional[str] = "READY"

class PassportInspectionItem(BaseModel):
    inspection_id: str
    version_label: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    pass_count: int = 0
    issue_count: int = 0
    review_count: int = 0
    na_count: int = 0

class PassportResponse(BaseModel):
    product_id: str
    product_name: str
    brand: str
    sku: str
    category: str
    packaging_type: str
    net_quantity: str
    created_at: datetime
    versions: List[PassportVersionItem] = []
    inspections: List[PassportInspectionItem] = []
    human_reviews: List[HumanReviewRead] = []
    audit_events: List[Dict[str, Any]] = []
    disclaimer: str = "Label Passport is a NIYAMORA internal provenance ledger and product history record. It is not a government certificate or official legal approval."

