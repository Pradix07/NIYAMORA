import React, { useState } from 'react';
import type { ApiEvaluation, ApiFinding, ApiExtractedField } from '../../services/api';
import { api } from '../../services/api';
import { Wand2, CheckCircle2, XCircle, HelpCircle, MinusCircle, AlertTriangle } from 'lucide-react';

// shadcn UI Components
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

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
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState<string | null>(null);

  const hasEvaluations = evaluations && evaluations.length > 0;
  const hasLiveFields = extractedFields && Object.keys(extractedFields).length > 0;
  const fieldList = hasLiveFields ? Object.values(extractedFields!) : [];

  const getEffectiveStatus = (e: ApiEvaluation) => localStatuses[e.id] || e.status;

  const issueCount = evaluations.filter((e) => getEffectiveStatus(e) === 'ISSUE').length;
  const reviewCount = evaluations.filter((e) => getEffectiveStatus(e) === 'REVIEW').length;
  const passCount = evaluations.filter((e) => getEffectiveStatus(e) === 'PASS').length;

  const filteredEvaluations = evaluations.filter((e) => {
    if (filter === 'ALL') return true;
    return getEffectiveStatus(e) === filter;
  });

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
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <Badge variant="success" className="gap-1 text-[11px]">
            <CheckCircle2 size={11} /> Passed
          </Badge>
        );
      case 'ISSUE':
        return (
          <Badge variant="destructive" className="gap-1 text-[11px]">
            <XCircle size={11} /> Issue
          </Badge>
        );
      case 'REVIEW':
        return (
          <Badge variant="warning" className="gap-1 text-[11px]">
            <HelpCircle size={11} /> Needs review
          </Badge>
        );
      case 'N/A':
      default:
        return (
          <Badge variant="neutral" className="gap-1 text-[11px]">
            <MinusCircle size={11} /> Not applicable
          </Badge>
        );
    }
  };

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

    return ev.explanation || 'Packaging requirement evaluated against statutory rules.';
  };

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
    <Card className="flex flex-col h-full min-h-[560px] overflow-hidden bg-[var(--card-bg)] border-[var(--border-default)]">
      {/* Header & Status Summary Bar */}
      <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Compliance Findings & Evidence
            </h3>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              {hasEvaluations ? (
                <span>
                  {issueCount > 0 && (
                    <strong className="text-red-600 dark:text-red-400 font-bold mr-2">
                      ❌ {issueCount} {issueCount === 1 ? 'Issue' : 'Issues'}
                    </strong>
                  )}
                  <span className="text-amber-600 dark:text-amber-400 font-semibold mr-2">
                    ⚠ {reviewCount} Need review
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ {passCount} Passed
                  </span>
                </span>
              ) : (
                `${fieldList.length} extracted items`
              )}
            </div>
          </div>

          {onOpenImprove && issueCount > 0 && (
            <button
              onClick={onOpenImprove}
              className="btn btn-primary btn-sm gap-1.5 shadow-sm"
            >
              <Wand2 size={13} />
              <span>Improve Design</span>
            </button>
          )}
        </div>

        {/* View Switch Tabs */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveTab('RULES')}
            className={`btn btn-sm ${activeTab === 'RULES' ? 'btn-primary' : 'btn-secondary'} text-xs py-1 px-3`}
          >
            Statutory Checks ({evaluations.length})
          </button>
          <button
            onClick={() => setActiveTab('EXTRACTION')}
            className={`btn btn-sm ${activeTab === 'EXTRACTION' ? 'btn-primary' : 'btn-secondary'} text-xs py-1 px-3`}
          >
            Declared Information ({fieldList.length})
          </button>
        </div>

        {/* Status Filter Pills */}
        {activeTab === 'RULES' && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter('ALL')}
              className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-ghost'} text-[11px] py-0.5 px-2.5`}
            >
              All ({evaluations.length})
            </button>
            {issueCount > 0 && (
              <button
                onClick={() => setFilter('ISSUE')}
                className={`btn btn-sm ${filter === 'ISSUE' ? 'btn-danger' : 'btn-ghost'} text-[11px] py-0.5 px-2.5`}
              >
                Issues ({issueCount})
              </button>
            )}
            {reviewCount > 0 && (
              <button
                onClick={() => setFilter('REVIEW')}
                className={`btn btn-sm ${filter === 'REVIEW' ? 'btn-secondary' : 'btn-ghost'} text-[11px] py-0.5 px-2.5`}
              >
                Needs Review ({reviewCount})
              </button>
            )}
            <button
              onClick={() => setFilter('PASS')}
              className={`btn btn-sm ${filter === 'PASS' ? 'btn-secondary' : 'btn-ghost'} text-[11px] py-0.5 px-2.5`}
            >
              Passed ({passCount})
            </button>
          </div>
        )}
      </div>

      {/* List Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'RULES' ? (
          filteredEvaluations.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
              No statutory findings match the selected filter.
            </div>
          ) : (
            filteredEvaluations.map((ev) => {
              const effectiveStatus = getEffectiveStatus(ev);
              const isSelected = selectedFindingId === ev.id || selectedFindingId === ev.rule_code;
              const title = getSimpleTitle(ev.rule_code, ev.rule_title);
              const explanation = getSimpleExplanation(ev);
              const matchingFinding = findings.find((f) => f.rule_code === ev.rule_code || f.id === ev.id);
              const guidance = getActionableGuidance(ev, matchingFinding);

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectFinding(ev.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/10 shadow-sm'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{title}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                        {ev.rule_code}
                      </span>
                    </div>
                    {getStatusBadge(effectiveStatus)}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">
                    {explanation}
                  </p>

                  {/* Observed Value Badge */}
                  {ev.observed_value && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono p-1.5 rounded bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--text-primary)] mb-2">
                      <span className="text-[var(--text-muted)]">Detected Text:</span>
                      <span className="font-bold">{ev.observed_value}</span>
                    </div>
                  )}

                  {/* Action Guidance box for Issues/Review */}
                  {guidance && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5 mb-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                      <span>{guidance}</span>
                    </div>
                  )}

                  {/* Quick Verification Actions for Reviewers */}
                  {effectiveStatus === 'REVIEW' && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[var(--text-muted)]">Manual Verification:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewAction(ev.id, matchingFinding?.id, 'CONFIRM_PASS');
                          }}
                          className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2 text-emerald-600"
                          disabled={isSubmittingReview === ev.id}
                        >
                          Confirm Compliant
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewAction(ev.id, matchingFinding?.id, 'MARK_AS_ISSUE');
                          }}
                          className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2 text-red-600"
                          disabled={isSubmittingReview === ev.id}
                        >
                          Mark Non-Compliant
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* Extraction Field List View */
          fieldList.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
              No declared packaging information extracted.
            </div>
          ) : (
            fieldList.map((field, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{field.field_name}</div>
                  <div className="text-[var(--text-secondary)] font-mono mt-0.5">
                    {field.extracted_value || 'Not found'}
                  </div>
                </div>
                <Badge variant={field.status === 'EXTRACTED' ? 'success' : 'warning'}>
                  {field.status}
                </Badge>
              </div>
            ))
          )
        )}
      </div>
    </Card>
  );
};
