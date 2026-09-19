import React, { useState } from 'react';
import type { Finding, ComplianceStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Sparkles, BookOpen } from 'lucide-react';

interface FindingPanelProps {
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  onOpenImprove?: () => void;
}

export const FindingPanel: React.FC<FindingPanelProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  onOpenImprove,
}) => {
  const [filter, setFilter] = useState<'ALL' | ComplianceStatus>('ALL');

  const issueCount = findings.filter((f) => f.status === 'ISSUE').length;
  const reviewCount = findings.filter((f) => f.status === 'REVIEW').length;
  const goodCount = findings.filter((f) => f.status === 'GOOD').length;

  const filteredFindings = findings.filter((f) => {
    if (filter === 'ALL') return true;
    return f.status === filter;
  });

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
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Inspection Findings</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {findings.length} declarations evaluated
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

        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('ALL')}
            className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            All ({findings.length})
          </button>
          <button
            onClick={() => setFilter('ISSUE')}
            className={`btn btn-sm ${filter === 'ISSUE' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            Issues ({issueCount})
          </button>
          <button
            onClick={() => setFilter('REVIEW')}
            className={`btn btn-sm ${filter === 'REVIEW' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: filter === 'REVIEW' ? 'var(--status-review-text)' : 'inherit', border: filter === 'REVIEW' ? '1px solid var(--status-review-border)' : 'none' }}
          >
            Review ({reviewCount})
          </button>
          <button
            onClick={() => setFilter('GOOD')}
            className={`btn btn-sm ${filter === 'GOOD' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: filter === 'GOOD' ? 'var(--status-good-text)' : 'inherit', border: filter === 'GOOD' ? '1px solid var(--status-good-border)' : 'none' }}
          >
            Good ({goodCount})
          </button>
        </div>
      </div>

      {/* Findings List & Detail Split View */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        {/* Finding Item Cards */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredFindings.map((finding) => {
            const isSelected = finding.id === selectedFindingId;
            return (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding.id)}
                style={{
                  padding: '0.875rem 1.25rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--brand-primary-light)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--brand-primary)' : '3px solid transparent',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={finding.status} size="sm" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {finding.category}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Confidence: {(finding.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {finding.ruleName}
                </h4>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {finding.explanation}
                </p>

                {/* Expanded Details when selected */}
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
                      gap: '0.5rem'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Found Value:
                      </strong>
                      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px', backgroundColor: 'var(--bg-surface-subtle)', padding: '4px 8px', borderRadius: '4px' }}>
                        {finding.foundValue}
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Statutory Requirement:
                      </strong>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {finding.expectedRequirement}
                      </p>
                    </div>

                    {finding.suggestedAction && (
                      <div style={{ borderLeft: '3px solid var(--brand-primary)', paddingLeft: '8px', marginTop: '4px' }}>
                        <strong style={{ color: 'var(--brand-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Sparkles size={12} /> Suggested Action:
                        </strong>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8125rem', marginTop: '2px' }}>
                          {finding.suggestedAction}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={12} /> {finding.officialSource}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{finding.ruleCode}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
