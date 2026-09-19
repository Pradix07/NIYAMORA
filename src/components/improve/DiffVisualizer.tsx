import React, { useState } from 'react';
import type { SuggestedDesignChange } from '../../types';
import { Sparkles, Download, FileText, CheckCircle2, Layers } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface DiffVisualizerProps {
  changes: SuggestedDesignChange[];
  onDownloadPdf?: () => void;
  onDownloadImage?: () => void;
  onViewReport?: () => void;
}

export const DiffVisualizer: React.FC<DiffVisualizerProps> = ({
  changes,
  onDownloadPdf,
  onDownloadImage,
  onViewReport,
}) => {
  const [selectedChangeId, setSelectedChangeId] = useState<string>(changes[0]?.id || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Actions */}
      <div
        className="card-tactile"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-subtle) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-sample">NIYAMORA Differentiator</span>
            <span className="badge badge-good">Ready for Pre-Press Review</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Catch compliance issues before the package goes to print.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '650px', marginTop: '0.25rem' }}>
            Compare your original artwork with NIYAMORA's suggested compliance adjustments. All fixes maintain your brand layout while satisfying statutory millimeter & contrast rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button onClick={onDownloadPdf} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Download size={16} />
            <span>Download Suggested PDF</span>
          </button>

          <button onClick={onDownloadImage} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <Layers size={16} />
            <span>Download High-Res Packshot</span>
          </button>

          <button onClick={onViewReport} className="btn btn-outline" style={{ gap: '0.4rem' }}>
            <FileText size={16} />
            <span>Full Compliance Report</span>
          </button>
        </div>
      </div>

      {/* Main Side-by-Side Comparison Workspace */}
      <div className="grid-2" style={{ alignItems: 'stretch' }}>
        {/* Left: Original Artwork Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>ORIGINAL DESIGN (V02)</span>
              <span className="badge badge-issue" style={{ fontSize: '0.7rem' }}>1 Issue Found</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Non-compliant (2.8mm Numeral)</span>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '440px',
              backgroundColor: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '1.5rem',
            }}
          >
            {/* Visual Box with Issue Marker */}
            <div
              style={{
                width: '280px',
                height: '380px',
                backgroundColor: '#CBB593',
                borderRadius: '8px',
                position: 'relative',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#333' }}>AURA BOTANICALS</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111' }}>ORGANIC CHIA CRUNCH</h3>
              </div>

              <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>250g Pouch Layout</span>
              </div>

              {/* Problem Area Highlighted */}
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '2px solid var(--status-issue-solid)',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#444' }}>Net Qty: 250 g</span>
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '6px',
                    backgroundColor: 'var(--status-issue-solid)',
                    color: '#FFF',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  2.8mm (Violation)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: NIYAMORA Suggested Design Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid var(--brand-primary)' }}>
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--brand-primary-light)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-primary)' }}>
                NIYAMORA SUGGESTED DESIGN
              </span>
              <span className="badge badge-fixed" style={{ fontSize: '0.7rem' }}>Passes Pre-Print Audit</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              Adjusted to 4.1mm Numeral
            </span>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '440px',
              backgroundColor: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '1.5rem',
            }}
          >
            {/* Visual Box with Fixed Marker */}
            <div
              style={{
                width: '280px',
                height: '380px',
                backgroundColor: '#CBB593',
                borderRadius: '8px',
                position: 'relative',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#333' }}>AURA BOTANICALS</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111' }}>ORGANIC CHIA CRUNCH</h3>
              </div>

              <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>250g Pouch Layout</span>
              </div>

              {/* Improved Area Highlighted */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '2px solid var(--status-good-solid)',
                  position: 'relative',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#000', letterSpacing: '0.04em' }}>
                  Net Qty: 250 g
                </span>
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '6px',
                    backgroundColor: 'var(--status-good-solid)',
                    color: '#FFF',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  ✓ 4.1mm (Compliant)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Changes Summary List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--brand-primary)' }} />
          <span>Detailed Suggested Adjustments ({changes.length})</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {changes.map((change) => (
            <div
              key={change.id}
              onClick={() => setSelectedChangeId(change.id)}
              className="card"
              style={{
                padding: '1rem',
                backgroundColor: selectedChangeId === change.id ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                border: selectedChangeId === change.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusBadge status={change.status} size="sm" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{change.element}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{change.status}</span>
              </div>

              <div className="grid-2" style={{ gap: '1rem', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <span style={{ color: 'var(--status-issue-text)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Original Specification:
                  </span>
                  <p style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>{change.originalSpec}</p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-good-border)' }}>
                  <span style={{ color: 'var(--status-good-text)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    NIYAMORA Suggested Spec:
                  </span>
                  <p style={{ marginTop: '2px', color: 'var(--text-primary)', fontWeight: 600 }}>{change.suggestedSpec}</p>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>Rationale:</strong> {change.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Transparency Disclaimer */}
      <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <strong>Pre-Press Advisory Note:</strong> Suggested adjustments are automated visual recommendations to assist pre-press dieline preparation. NIYAMORA does not issue statutory approvals or legal certifications; final legal packaging compliance remains the responsibility of the brand manufacturer.
      </div>
    </div>
  );
};
