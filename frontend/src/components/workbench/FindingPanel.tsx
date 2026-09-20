import React, { useState } from 'react';
import type { ApiEvaluation, ApiFinding, ApiExtractedField } from '../../services/api';
import { Sparkles, BookOpen, AlertCircle, CheckCircle2, XCircle, HelpCircle, MinusCircle } from 'lucide-react';

interface FindingPanelProps {
  evaluations?: ApiEvaluation[];
  findings?: ApiFinding[];
  extractedFields?: Record<string, ApiExtractedField>;
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  onOpenImprove?: () => void;
  complianceVerdict?: string;
}

export const FindingPanel: React.FC<FindingPanelProps> = ({
  evaluations = [],
  findings = [],
  extractedFields,
  selectedFindingId,
  onSelectFinding,
  onOpenImprove,
  complianceVerdict,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ISSUE' | 'REVIEW' | 'PASS' | 'N/A'>('ALL');
  const [activeTab, setActiveTab] = useState<'RULES' | 'EXTRACTION'>('RULES');

  const hasEvaluations = evaluations && evaluations.length > 0;
  const hasLiveFields = extractedFields && Object.keys(extractedFields).length > 0;
  const fieldList = hasLiveFields ? Object.values(extractedFields!) : [];

  const issueCount = evaluations.filter((e) => e.status === 'ISSUE').length;
  const reviewCount = evaluations.filter((e) => e.status === 'REVIEW').length;
  const passCount = evaluations.filter((e) => e.status === 'PASS').length;
  const naCount = evaluations.filter((e) => e.status === 'N/A').length;

  const filteredEvaluations = evaluations.filter((e) => {
    if (filter === 'ALL') return true;
    return e.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="badge badge-good" style={{ fontSize: '0.7rem' }}>
            <CheckCircle2 size={11} /> PASS
          </span>
        );
      case 'ISSUE':
        return (
          <span className="badge badge-issue" style={{ fontSize: '0.7rem' }}>
            <XCircle size={11} /> ISSUE
          </span>
        );
      case 'REVIEW':
        return (
          <span className="badge badge-review" style={{ fontSize: '0.7rem' }}>
            <HelpCircle size={11} /> REVIEW
          </span>
        );
      case 'N/A':
      default:
        return (
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            <MinusCircle size={11} /> N/A
          </span>
        );
    }
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
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {activeTab === 'RULES' ? 'Statutory Rule Checks' : 'Extracted Declarations'}
              </h3>
              {complianceVerdict && (
                <span
                  className={`badge ${complianceVerdict === 'PASS' ? 'badge-good' : complianceVerdict === 'ISSUE' ? 'badge-issue' : 'badge-review'}`}
                  style={{ fontSize: '0.75rem', fontWeight: 800 }}
                >
                  Verdict: {complianceVerdict}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {hasEvaluations
                ? `${passCount} of ${evaluations.length} verified checks passed (${issueCount > 0 ? `${issueCount} Issues require attention` : reviewCount > 0 ? `${reviewCount} Awaiting review` : 'All Implemented Checks Passed'})`
                : `${fieldList.length} packaging fields parsed`}
            </p>
          </div>
          {onOpenImprove && issueCount > 0 && (
            <button 
              onClick={onOpenImprove}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.35rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
            >
              <Sparkles size={14} />
              <span>Improve Design</span>
            </button>
          )}
        </div>

        {/* View Switch Tabs (Rules vs Raw Extractions) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`btn btn-sm ${activeTab === 'RULES' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
          >
            Statutory Rule Checks ({evaluations.length})
          </button>
          <button
            onClick={() => setActiveTab('EXTRACTION')}
            className={`btn btn-sm ${activeTab === 'EXTRACTION' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
          >
            Raw Fields ({fieldList.length})
          </button>
        </div>

        {/* Status Filter Pills for Rule Checks */}
        {activeTab === 'RULES' && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('ALL')}
              className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
            >
              All ({evaluations.length})
            </button>
            <button
              onClick={() => setFilter('ISSUE')}
              className={`btn btn-sm ${filter === 'ISSUE' ? 'btn-danger' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
            >
              Issues ({issueCount})
            </button>
            <button
              onClick={() => setFilter('REVIEW')}
              className={`btn btn-sm ${filter === 'REVIEW' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', color: filter === 'REVIEW' ? 'var(--status-review-text)' : 'inherit' }}
            >
              Review ({reviewCount})
            </button>
            <button
              onClick={() => setFilter('PASS')}
              className={`btn btn-sm ${filter === 'PASS' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', color: filter === 'PASS' ? 'var(--status-good-text)' : 'inherit' }}
            >
              Pass ({passCount})
            </button>
            {naCount > 0 && (
              <button
                onClick={() => setFilter('N/A')}
                className={`btn btn-sm ${filter === 'N/A' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
              >
                N/A ({naCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        {activeTab === 'RULES' ? (
          /* Deterministic Rule Evaluations List */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredEvaluations.map((ev) => {
              const isSelected = ev.id === selectedFindingId || ev.rule_code === selectedFindingId;
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
                      : ev.status === 'ISSUE'
                      ? '3px solid var(--status-issue-solid)'
                      : ev.status === 'REVIEW'
                      ? '3px solid var(--status-review-solid)'
                      : '3px solid transparent',
                    transition: 'background-color var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusBadge(ev.status)}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {ev.rule_code}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {ev.source_reference}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {ev.rule_title}
                  </h4>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {ev.explanation}
                  </p>

                  {/* Expanded Finding Detail Card */}
                  {isSelected && (
                    <div 
                      className="card animate-fade-in"
                      style={{ 
                        marginTop: '0.75rem', 
                        padding: '0.875rem', 
                        backgroundColor: 'var(--bg-surface)', 
                        fontSize: '0.8125rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        border: '1px solid var(--border-default)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Observed Value:
                        </strong>
                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px', backgroundColor: 'var(--bg-surface-subtle)', padding: '4px 8px', borderRadius: '4px' }}>
                          {ev.observed_value || 'Not Detected in Artwork'}
                        </p>
                      </div>

                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Statutory Requirement:
                        </strong>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.78rem' }}>
                          {ev.expected_condition}
                        </p>
                      </div>

                      {ev.evidence?.bbox && (
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Spatial Evidence Box:
                          </strong>
                          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)', marginTop: '2px', fontSize: '0.75rem' }}>
                            X:{ev.evidence.bbox.x}% Y:{ev.evidence.bbox.y}% (W:{ev.evidence.bbox.width}% H:{ev.evidence.bbox.height}%)
                          </p>
                        </div>
                      )}

                      {(() => {
                        const relatedFinding = findings.find((f) => f.rule_code === ev.rule_code || f.evaluation_id === ev.id);
                        if (relatedFinding?.suggested_action) {
                          return (
                            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                              <strong style={{ color: 'var(--brand-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
                                Action Needed:
                              </strong>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>
                                {relatedFinding.suggested_action}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BookOpen size={12} /> {ev.source_reference || 'Legal Metrology Rules, 2011'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{ev.rule_code}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Raw Extracted Packaging Declarations */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {fieldList.map((field) => (
              <div
                key={field.field_key}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span className={`badge ${field.status === 'EXTRACTED' ? 'badge-good' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                    {field.status === 'EXTRACTED' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    <span>{field.status}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {field.source || 'Vector Layout'}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {field.field_name}
                </h4>

                <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-default)', marginTop: '4px' }}>
                  <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: field.status === 'EXTRACTED' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {field.extracted_value || 'Not detected in uploaded artwork'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statutory Disclaimer Footer */}
      <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <AlertCircle size={12} style={{ flexShrink: 0, color: 'var(--brand-primary)' }} />
        <span>Assisted pre-print verification under verified Legal Metrology (Packaged Commodities) Rules, 2011.</span>
      </div>
    </div>
  );
};

