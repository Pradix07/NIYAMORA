from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class RuleSource(Base):
    """
    Represents an official statutory source document published by the
    Department of Consumer Affairs (DCA) or other verified government authority.
    """
    __tablename__ = "rule_sources"

    id = Column(String(50), primary_key=True) # e.g. "SRC-DCA-LMPC-2011"
    title = Column(String(255), nullable=False)
    issuing_authority = Column(String(255), nullable=False)
    source_url = Column(String(1024), nullable=False)
    document_type = Column(String(50), default="PRINCIPAL_STATUTE_RULES", nullable=False)
    publication_date = Column(String(20), nullable=True) # e.g. "2011-03-07"
    effective_date = Column(String(20), nullable=True)
    status = Column(String(30), default="ACTIVE", nullable=False) # ACTIVE, SUPERSEDED, DRAFT, REFERENCE_ONLY
    retrieved_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    versions = relationship("RuleVersion", back_populates="source")

class Rule(Base):
    """
    High-level rule concept (e.g. Mandatory Net Quantity Declaration).
    """
    __tablename__ = "rules"

    id = Column(String(50), primary_key=True) # e.g. "RULE-LMPC-NET-QTY"
    domain = Column(String(50), default="LEGAL_METROLOGY_PACKAGED_COMMODITIES", nullable=False, index=True)
    rule_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "LMPC-DECL-NET-QTY"
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Legal Metrology", nullable=False)
    severity = Column(String(30), default="MAJOR", nullable=False) # CRITICAL, MAJOR, MINOR, REVIEW
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    versions = relationship("RuleVersion", back_populates="rule", cascade="all, delete-orphan")

class RuleVersion(Base):
    """
    Specific versioned statutory legal requirement.
    Traces exact sub-rule, parameter thresholds, applicability conditions, and validity period.
    """
    __tablename__ = "rule_versions"

    id = Column(String(60), primary_key=True) # e.g. "RV-LMPC-NET-QTY-2011-V1"
    rule_id = Column(String(50), ForeignKey("rules.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_code = Column(String(50), nullable=False, index=True)
    version_number = Column(Integer, default=1, nullable=False)
    title = Column(String(255), nullable=False)
    requirement_text = Column(Text, nullable=False)
    source_id = Column(String(50), ForeignKey("rule_sources.id", ondelete="RESTRICT"), nullable=False)
    source_reference = Column(String(255), nullable=False) # e.g. "Rule 6(1)(c), Rule 11 & Second Schedule"
    source_url = Column(String(1024), nullable=False)
    effective_from = Column(String(20), default="2011-04-01", nullable=False)
    effective_to = Column(String(20), nullable=True) # None = currently in force
    applicability = Column(String(255), default="ALL_PREPACKAGED_COMMODITIES", nullable=False)
    evaluation_type = Column(String(50), default="DETERMINISTIC_FIELD", nullable=False)
    parameters = Column(JSON, default=dict, nullable=False)
    status = Column(String(30), default="ACTIVE", nullable=False) # ACTIVE, SUPERSEDED, DRAFT
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    rule = relationship("Rule", back_populates="versions")
    source = relationship("RuleSource", back_populates="versions")
    evaluations = relationship("Evaluation", back_populates="rule_version")

class Evidence(Base):
    """
    Spatial & extracted evidence linking detected text/dieline components
    to an Inspection and Evaluation.
    """
    __tablename__ = "evidences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(50), default="OCR", nullable=False) # OCR, PDF_TEXT, IMAGE, MANUAL_REVIEW, MEASUREMENT
    panel_id = Column(String(36), ForeignKey("artwork_panels.id", ondelete="SET NULL"), nullable=True)
    page_number = Column(Integer, default=1, nullable=True)
    bbox = Column(JSON, nullable=True) # [x0, y0, x1, y1] or normalized {x, y, width, height}
    observed_text = Column(Text, nullable=True)
    extracted_value = Column(String(500), nullable=True)
    evidence_quality = Column(String(30), default="HIGH", nullable=False) # HIGH, MEDIUM, LOW, UNAVAILABLE
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    inspection = relationship("Inspection", back_populates="evidences")
    evaluations = relationship("Evaluation", back_populates="evidence")
    findings = relationship("Finding", back_populates="evidence")

class Evaluation(Base):
    """
    Deterministic evaluation output for a specific RuleVersion on an Inspection run.
    """
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_version_id = Column(String(60), ForeignKey("rule_versions.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True) # PASS, ISSUE, REVIEW, N/A
    observed_value = Column(String(500), nullable=True)
    expected_condition = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    evidence_id = Column(String(36), ForeignKey("evidences.id", ondelete="SET NULL"), nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    inspection = relationship("Inspection", back_populates="evaluations")
    rule_version = relationship("RuleVersion", back_populates="evaluations")
    evidence = relationship("Evidence", back_populates="evaluations")
    finding = relationship("Finding", back_populates="evaluation", uselist=False)

class Finding(Base):
    """
    Actionable user-facing finding item generated for any ISSUE or REVIEW evaluation.
    """
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    evaluation_id = Column(String(36), ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    rule_code = Column(String(50), nullable=False)
    severity = Column(String(30), default="MAJOR", nullable=False) # CRITICAL, MAJOR, REVIEW
    status = Column(String(30), default="OPEN", nullable=False, index=True) # OPEN, RESOLVED, REVIEWED
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    observed_value = Column(String(500), nullable=True)
    requirement = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    evidence_id = Column(String(36), ForeignKey("evidences.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    inspection = relationship("Inspection", back_populates="findings")
    evaluation = relationship("Evaluation", back_populates="finding")
    evidence = relationship("Evidence", back_populates="findings")
    reviews = relationship("HumanReview", back_populates="finding", cascade="all, delete-orphan")

class HumanReview(Base):
    """
    Audit log of human specialist review decisions.
    Preserves original automated machine evaluation and records reviewer sign-off.
    """
    __tablename__ = "human_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    finding_id = Column(String(36), ForeignKey("findings.id", ondelete="CASCADE"), nullable=True, index=True)
    reviewer_name = Column(String(100), default="Compliance Specialist", nullable=False)
    decision = Column(String(50), nullable=False) # APPROVED_PASS, CONFIRMED_ISSUE, EXEMPT_NA, NEW_IMAGE_REQUESTED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    inspection = relationship("Inspection", back_populates="reviews")
    finding = relationship("Finding", back_populates="reviews")
