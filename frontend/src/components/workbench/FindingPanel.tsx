import React, { useState } from 'react';
import type { ApiEvaluation, ApiFinding, ApiExtractedField } from '../../services/api';
import { api } from '../../services/api';
import { Wand2, BookOpen, AlertCircle, CheckCircle2, XCircle, HelpCircle, MinusCircle, ChevronDown, ChevronUp, MapPin, Shield, Camera, MessageSquare } from 'lucide-react';

interface FindingPanelProps {
  inspectionId?: string;
  evaluations?: ApiEvaluation[];
  findings?: ApiFinding[];
  extractedFields?: Record<string, ApiExtractedField>;
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  onOpenImprove?: () => void;
  onReviewActionCompleted?: () => void;
  complianceVerdict?: string;
}

export const FindingPanel: React.FC<FindingPanelProps> = ({
  inspectionId,
  evaluations = [],
  findings = [],
  extractedFields,
  selectedFindingId,
  onSelectFinding,
  onOpenImprove,
  onReviewActionCompleted,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ISSUE' | 'REVIEW' | 'PASS' | 'N/A'>('ALL');
  const [activeTab, setActiveTab] = useState<'RULES' | 'EXTRACTION'>('RULES');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const [activeNoteInput, setActiveNoteInput] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<string | null>(null);

  const hasEvaluations = evaluations && evaluations.length > 0;
  const hasLiveFields = extractedFields && Object.keys(extractedFields).length > 0;
  const fieldList = hasLiveFields ? Object.values(extractedFields!) : [];

  const getEffectiveStatus = (e: ApiEvaluation) => localStatuses[e.id] || e.status;

  const issueCount = evaluations.filter((e) => getEffectiveStatus(e) === 'ISSUE').length;
  const reviewCount = evaluations.filter((e) => getEffectiveStatus(e) === 'REVIEW').length;
  const passCount = evaluations.filter((e) => getEffectiveStatus(e) === 'PASS').length;
  const naCount = evaluations.filter((e) => getEffectiveStatus(e) === 'N/A').length;

  const filteredEvaluations = evaluations.filter((e) => {
    if (filter === 'ALL') return true;
    return getEffectiveStatus(e) === filter;
  });

  const toggleDetails = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReviewAction = async (evId: string, findingId: string | undefined, decision: string, note?: string) => {
    setIsSubmittingReview(evId);
    const targetStatus = decision === 'CONFIRM_PASS' ? 'PASS' : decision === 'MARK_AS_ISSUE' ? 'ISSUE' : 'REVIEW';
    setLocalStatuses((prev) => ({ ...prev, [evId]: targetStatus }));

    try {
      await api.submitReview({
        inspection_id: inspectionId,
        finding_id: findingId,
        decision: decision,
        reviewer_name: 'Compliance Specialist',
        notes: note || (decision === 'CONFIRM_PASS' ? 'Manually verified as compliant' : decision === 'MARK_AS_ISSUE' ? 'Confirmed packaging non-compliance' : 'Clearer packshot requested'),
      });
      if (onReviewActionCompleted) {
        onReviewActionCompleted();
      }
    } catch (err) {
      console.error('Failed to submit review decision:', err);
    } finally {
      setIsSubmittingReview(null);
      setActiveNoteInput(null);
      setNoteText('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="badge badge-good" style={{ fontSize: '0.7rem' }}>
            <CheckCircle2 size={11} /> Passed
          </span>
        );
      case 'ISSUE':
        return (
          <span className="badge badge-issue" style={{ fontSize: '0.7rem' }}>
            <XCircle size={11} /> Issue
          </span>
        );
      case 'REVIEW':
        return (
          <span className="badge badge-review" style={{ fontSize: '0.7rem' }}>
            <HelpCircle size={11} /> Needs review
          </span>
        );
      case 'N/A':
      default:
        return (
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            <MinusCircle size={11} /> Not applicable
          </span>
        );
    }
  };

  // Helper to provide simple English titles for standard rules
  const getSimpleTitle = (ruleCode: string, fallbackTitle: string): string => {
    const code = (ruleCode || '').toUpperCase();
    if (code.includes('R06-1-A') || code.includes('MFG')) return 'Manufacturer details';
    if (code.includes('R06-1-B') || code.includes('GENERIC')) return 'Product common / generic name';
    if (code.includes('R06-1-C') || code.includes('NET-QTY')) return 'Declared net quantity';
    if (code.includes('R09') || code.includes('HEIGHT') || code.includes('FONT')) return 'Text height & readability';
    if (code.includes('R06-1-E') || code.includes('MRP')) return 'Maximum Retail Price (MRP)';
    if (code.includes('R06-1-D') || code.includes('DATE')) return 'Date of manufacture / packaging';
    if (code.includes('R06-1-N') || code.includes('USP')) return 'Unit Sale Price (USP)';
    if (code.includes('R06-1-G') || code.includes('CONSUMER')) return 'Consumer care details';
    if (code.includes('R06-1-F') || code.includes('ORIGIN')) return 'Country of origin';
    if (code.includes('FSSAI')) return 'FSSAI License & logo';
    return fallbackTitle;
  };

  // Helper to generate simple, non-technical explanation
  const getSimpleExplanation = (ev: ApiEvaluation): string => {
    const code = (ev.rule_code || '').toUpperCase();
    const status = ev.status;

    if (code.includes('R06-1-A') || code.includes('MFG')) {
      if (status === 'REVIEW') {
        return "We found a manufacturer/packer reference, but we couldn't clearly verify the complete address.";
      }
      if (status === 'ISSUE') {
        return 'Manufacturer or packer details are missing or incomplete on the packaging.';
      }
      return 'Manufacturer or packer name and complete physical address were verified.';
    }

    if (code.includes('R09') || code.includes('HEIGHT')) {
      if (status === 'ISSUE') {
        return 'The net quantity text height appears smaller than the statutory minimum for this package size.';
      }
      if (status === 'REVIEW') {
        return 'Package surface dimensions need manual confirmation to verify text height requirements.';
      }
      return 'Text character height meets the statutory minimum for this package size.';
    }

    if (code.includes('R06-1-E') || code.includes('MRP')) {
      if (status === 'ISSUE') {
        return "MRP is missing the mandatory '(inclusive of all taxes)' declaration.";
      }
      if (status === 'REVIEW') {
        return 'MRP text was located, but tax-inclusive wording needs manual confirmation.';
      }
      return "MRP is declared with required 'inclusive of all taxes' wording.";
    }

    if (code.includes('R06-1-C') || code.includes('NET-QTY')) {
      if (status === 'ISSUE') {
        return 'Net quantity uses a prohibited unit abbreviation or non-standard measurement format.';
      }
      if (status === 'REVIEW') {
        return 'Net quantity was found but unit abbreviation requires manual verification.';
      }
      return 'Declared net quantity uses valid SI units and standard formatting.';
    }

    if (code.includes('R06-1-N') || code.includes('USP')) {
      if (status === 'ISSUE') {
        return 'Unit Sale Price (e.g. per gram or per kg) is required for this pack size but missing.';
      }
      if (status === 'REVIEW') {
        return 'Unit Sale Price calculation requires verification against the declared pack weight.';
      }
      return 'Unit Sale Price is correctly declared with valid unit basis.';
    }

    // Default fallback to existing explanation
    return ev.explanation || 'Packaging requirement evaluated against statutory rules.';
  };

  // Helper to generate actionable next step
  const getActionableGuidance = (ev: ApiEvaluation, finding?: ApiFinding): string | null => {
    if (ev.status === 'PASS' || ev.status === 'N/A') return null;

    if (finding?.suggested_action) {
      return finding.suggested_action;
    }

    const code = (ev.rule_code || '').toUpperCase();
    if (code.includes('R06-1-A') || code.includes('MFG')) {
      return 'Check the full manufacturer/packer name and address on the package.';
    }
    if (code.includes('R09') || code.includes('HEIGHT')) {
      return 'Increase font height of net quantity digits to meet the minimum required mm height.';
    }
    if (code.includes('R06-1-E') || code.includes('MRP')) {
      return "Ensure '(inclusive of all taxes)' or '(incl. of all taxes)' is printed right after the MRP.";
    }
    if (code.includes('R06-1-C') || code.includes('NET-QTY')) {
      return "Use standard SI symbols like 'g', 'kg', or 'ml' without trailing periods or non-standard symbols.";
    }
    if (code.includes('R06-1-N') || code.includes('USP')) {
      return "Add unit sale price (e.g. '₹ 1.80 / g' or '₹ 180 / kg') near the MRP.";
    }
    return 'Review the highlighted area on your packaging artwork to ensure compliance.';
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '560px',
        backgroundColor: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header & Status Summary Bar */}
      <div style={{ padding: '1rem 1.25rem 0.875rem', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              What we found
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
              {hasEvaluations ? (
                <span>
                  {issueCount > 0 && (
                    <strong style={{ color: 'var(--status-issue-text)' }}>
                      ❌ {issueCount} {issueCount === 1 ? 'Issue' : 'Issues'} ·{' '}
                    </strong>
                  )}
                  <span style={{ color: 'var(--status-review-text)', fontWeight: 600 }}>
                    ⚠ {reviewCount} Need review
                  </span>
                  {' · '}
                  <span style={{ color: 'var(--status-good-text)', fontWeight: 600 }}>
                    ✓ {passCount} Passed
                  </span>
                  {naCount > 0 && <span> · — {naCount} N/A</span>}
                </span>
              ) : (
                `${fieldList.length} items found`
              )}
            </p>
          </div>

          {onOpenImprove && issueCount > 0 && (
            <button 
              onClick={onOpenImprove}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.35rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
            >
              <Wand2 size={13} />
              <span>Improve Design</span>
            </button>
          )}
        </div>

        {/* View Switch Tabs (Checks vs Packaging Information) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`btn btn-sm ${activeTab === 'RULES' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
          >
            Checks ({evaluations.length})
          </button>
          <button
            onClick={() => setActiveTab('EXTRACTION')}
            className={`btn btn-sm ${activeTab === 'EXTRACTION' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
          >
            Packaging Information ({fieldList.length})
          </button>
        </div>

        {/* Status Filter Pills */}
        {activeTab === 'RULES' && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('ALL')}
              className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
            >
              All ({evaluations.length})
            </button>
            {issueCount > 0 && (
              <button
                onClick={() => setFilter('ISSUE')}
                className={`btn btn-sm ${filter === 'ISSUE' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
              >
                ❌ Issue ({issueCount})
              </button>
            )}
            <button
              onClick={() => setFilter('REVIEW')}
              className={`btn btn-sm ${filter === 'REVIEW' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', color: filter === 'REVIEW' ? 'var(--status-review-text)' : 'inherit' }}
            >
              ⚠ Needs review ({reviewCount})
            </button>
            <button
              onClick={() => setFilter('PASS')}
              className={`btn btn-sm ${filter === 'PASS' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', color: filter === 'PASS' ? 'var(--status-good-text)' : 'inherit' }}
            >
              ✓ Passed ({passCount})
            </button>
            {naCount > 0 && (
              <button
                onClick={() => setFilter('N/A')}
                className={`btn btn-sm ${filter === 'N/A' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
              >
                Not applicable ({naCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        {activeTab === 'RULES' ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hasEvaluations && issueCount === 0 && reviewCount === 0 && (
              <div style={{ margin: '0.875rem 1.25rem', padding: '1rem', backgroundColor: 'var(--status-good-bg)', border: '1px solid var(--status-good-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--status-good-text)', fontSize: '0.875rem' }}>
                  <CheckCircle2 size={17} /> ALL CHECKS PASSED
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.4, margin: 0 }}>
                  All {evaluations.length} evaluated packaging checks passed statutory requirements.
                </p>
              </div>
            )}

            {filteredEvaluations.map((ev) => {
              const isSelected = ev.id === selectedFindingId || ev.rule_code === selectedFindingId;
              const isExpanded = !!expandedDetails[ev.id];
              const relatedFinding = findings.find((f) => f.rule_code === ev.rule_code || f.evaluation_id === ev.id);

              const simpleTitle = getSimpleTitle(ev.rule_code, ev.rule_title);
              const simpleExplanation = getSimpleExplanation(ev);
              const actionableStep = getActionableGuidance(ev, relatedFinding);

              const effectiveStatus = getEffectiveStatus(ev);

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectFinding(ev.id)}
                  style={{
                    padding: '0.875rem 1.25rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'var(--brand-primary-light)' : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid var(--brand-primary)'
                      : effectiveStatus === 'ISSUE'
                      ? '3px solid var(--status-issue-solid)'
                      : effectiveStatus === 'REVIEW'
                      ? '3px solid var(--status-review-solid)'
                      : '3px solid transparent',
                    transition: 'background-color var(--transition-fast)',
                  }}
                >
                  {/* Card Header: Plain English Title + Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {simpleTitle}
                    </h4>
                    {getStatusBadge(effectiveStatus)}
                  </div>

                  {/* Plain English Explanation */}
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0.25rem 0 0.35rem' }}>
                    {simpleExplanation}
                  </p>

                  {/* Actionable Guidance (What you can do) */}
                  {actionableStep && (
                    <div style={{ margin: '0.35rem 0', padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand-primary)', marginRight: '4px' }}>
                        What you can do:
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{actionableStep}</span>
                    </div>
                  )}

                  {/* Interactive Specialist Review Actions for REVIEW state */}
                  {effectiveStatus === 'REVIEW' && (
                    <div 
                      style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.6rem 0.75rem', 
                        backgroundColor: 'var(--bg-surface-subtle)', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-default)' 
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Specialist Verification:
                        </span>
                        {isSubmittingReview === ev.id && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)' }}>Saving...</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ backgroundColor: 'var(--status-pass-bg)', color: 'var(--status-pass-solid)', border: '1px solid var(--status-pass-border)', fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={() => handleReviewAction(ev.id, relatedFinding?.id, 'CONFIRM_PASS')}
                          disabled={isSubmittingReview === ev.id}
                        >
                          <CheckCircle2 size={12} /> Confirm Pass
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ backgroundColor: 'var(--status-issue-bg)', color: 'var(--status-issue-solid)', border: '1px solid var(--status-issue-border)', fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={() => handleReviewAction(ev.id, relatedFinding?.id, 'MARK_AS_ISSUE')}
                          disabled={isSubmittingReview === ev.id}
                        >
                          <XCircle size={12} /> Mark as Issue
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={() => handleReviewAction(ev.id, relatedFinding?.id, 'REQUEST_CLEARER_IMAGE')}
                          disabled={isSubmittingReview === ev.id}
                        >
                          <Camera size={12} /> Clearer Image
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={() => setActiveNoteInput(activeNoteInput === ev.id ? null : ev.id)}
                        >
                          <MessageSquare size={12} /> Note
                        </button>
                      </div>

                      {activeNoteInput === ev.id && (
                        <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.35rem' }}>
                          <input
                            type="text"
                            placeholder="Enter specialist verification remarks..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                            onClick={() => handleReviewAction(ev.id, relatedFinding?.id, 'ADD_NOTE', noteText)}
                            disabled={!noteText.trim() || isSubmittingReview === ev.id}
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Toggle Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={(e) => toggleDetails(ev.id, e)}
                      className="btn-ghost"
                      style={{
                        padding: '0',
                        fontSize: '0.75rem',
                        color: 'var(--brand-primary)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {ev.rule_code}
                    </span>
                  </div>

                  {/* Expandable Deep-Dive Evidence & Legal Details */}
                  {isExpanded && (
                    <div 
                      className="card animate-fade-in"
                      style={{ 
                        marginTop: '0.65rem', 
                        padding: '0.875rem', 
                        backgroundColor: 'var(--bg-surface)', 
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        border: '1px solid var(--border-default)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* What we found */}
                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          What we found on package:
                        </strong>
                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0, backgroundColor: 'var(--bg-surface-subtle)', padding: '4px 8px', borderRadius: '4px' }}>
                          {ev.observed_value || 'Not clearly detected on packaging artwork'}
                        </p>
                      </div>

                      {/* Why it matters / Requirement context */}
                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Why it matters:
                        </strong>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                          {ev.expected_condition}
                        </p>
                      </div>

                      {/* Exact Legal Requirement */}
                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Legal requirement:
                        </strong>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                          {ev.rule_title} ({ev.rule_code})
                        </p>
                      </div>

                      {/* Evidence / Location */}
                      {ev.evidence?.bbox && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          <MapPin size={12} />
                          <span>
                            Location: {ev.evidence.bbox.panel_type || 'Front'} (x: {Math.round(ev.evidence.bbox.x)}%, y: {Math.round(ev.evidence.bbox.y)}%)
                          </span>
                        </div>
                      )}

                      {/* Source Reference & Legal Metrology Citation */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem', marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BookOpen size={12} /> {ev.source_reference || 'Legal Metrology (Packaged Commodities) Rules, 2011'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Shield size={11} /> Verified Rule
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Packaging Information Tab (Extracted Facts) */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Extracted declarations from your packaging dieline and text layer.</span>
            </div>

            {fieldList.map((field) => (
              <div
                key={field.field_key}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {field.field_name}
                  </h4>
                  <span className={`badge ${field.status === 'EXTRACTED' ? 'badge-good' : field.status === 'UNCERTAIN' ? 'badge-review' : 'badge-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                    {field.status === 'EXTRACTED' ? <CheckCircle2 size={11} /> : field.status === 'UNCERTAIN' ? <HelpCircle size={11} /> : <MinusCircle size={11} />}
                    <span>{field.status === 'EXTRACTED' ? 'Found' : field.status === 'UNCERTAIN' ? 'Needs review' : 'Not found'}</span>
                  </span>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-default)', marginTop: '4px' }}>
                  <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: field.status === 'EXTRACTED' ? 'var(--text-primary)' : 'var(--text-muted)', margin: 0 }}>
                    {field.extracted_value || 'Not detected on uploaded artwork'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simplified Disclaimer Footer */}
      <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <AlertCircle size={12} style={{ flexShrink: 0, color: 'var(--brand-primary)' }} />
        <span>This is a pre-print packaging check, not a government certificate.</span>
      </div>
    </div>
  );
};
