import React, { useState } from 'react';
import type { ApiSuggestedDesignChange, ApiPanel } from '../../services/api';
import { api } from '../../services/api';
import { Sparkles, Download, ArrowRight, ShieldCheck, RefreshCw, GitCompare, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface DiffVisualizerProps {
  productName?: string;
  brandName?: string;
  sourceVersionLabel?: string;
  suggestedVersionLabel?: string;
  sourcePreviewUrl?: string | null;
  suggestedPreviewUrl?: string | null;
  changes: ApiSuggestedDesignChange[];
  panels?: ApiPanel[];
  validationStatus?: string;
  status?: string;
  onDownloadPdf?: () => void;
  onRunVerification?: () => void;
  onCompareVersions?: () => void;
  onViewRegression?: () => void;
  isVerifying?: boolean;
}

export const DiffVisualizer: React.FC<DiffVisualizerProps> = ({
  productName = 'Packaging Artwork',
  brandName = 'Brand',
  sourceVersionLabel = 'V01',
  suggestedVersionLabel = 'V02',
  sourcePreviewUrl,
  suggestedPreviewUrl,
  changes,
  panels = [],
  validationStatus = 'PENDING',
  status = 'GENERATED',
  onDownloadPdf,
  onRunVerification,
  onCompareVersions,
  onViewRegression,
  isVerifying = false,
}) => {
  const [selectedPanelType, setSelectedPanelType] = useState<string>('FRONT');
  const [selectedChangeId, setSelectedChangeId] = useState<string>(changes[0]?.change_id || '');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const standardPanels = [
    { key: 'FRONT', label: 'Front' },
    { key: 'BACK', label: 'Back' },
    { key: 'LEFT', label: 'Left' },
    { key: 'RIGHT', label: 'Right' },
    { key: 'TOP', label: 'Top' },
  ];

  // Derive display panels from uploaded panels or standard list
  const displayPanels = panels.length > 0
    ? panels.map((p) => {
        const normKey = p.panel_type.toUpperCase().replace('SIDE_', '');
        const changesOnPanel = changes.filter(
          (c) => (c.target_panel && c.target_panel.toUpperCase().includes(normKey)) ||
                 (normKey === 'BACK' && !c.target_panel)
        );
        return {
          id: p.id,
          key: p.panel_type.toUpperCase(),
          normKey: normKey,
          label: p.panel_type.replace('SIDE_', '').replace('_', ' '),
          changeCount: changesOnPanel.length,
          previewUrl: api.getFileUrl(p.preview_url),
        };
      })
    : standardPanels.map((std) => {
        const changesOnPanel = changes.filter(
          (c) => (c.target_panel && c.target_panel.toUpperCase() === std.key) ||
                 (std.key === 'BACK' && !c.target_panel)
        );
        return {
          id: std.key,
          key: std.key,
          normKey: std.key,
          label: std.label,
          changeCount: changesOnPanel.length,
          previewUrl: std.key === 'FRONT' ? sourcePreviewUrl : null,
        };
      });

  const activePanel = displayPanels.find(
    (dp) => dp.key === selectedPanelType || dp.normKey === selectedPanelType
  ) || displayPanels[0];

  const panelChanges = changes.filter(
    (c) => (c.target_panel && c.target_panel.toUpperCase().includes(activePanel.normKey)) ||
           (activePanel.normKey === 'BACK' && !c.target_panel)
  );

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.7));

  // Determine active panel images
  const activeOriginalImage = activePanel.previewUrl || sourcePreviewUrl;
  const activeSuggestedImage = panelChanges.length > 0 ? (suggestedPreviewUrl || activeOriginalImage) : activeOriginalImage;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Control Deck */}
      <div
        className="card-tactile"
        style={{
          padding: '1.25rem 1.5rem',
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
            <span className="badge badge-sample">Design Assistance</span>
            <span
              className={`badge ${validationStatus === 'IMPROVED' || validationStatus === 'VERIFIED' ? 'badge-good' : validationStatus === 'NEW_ISSUES_FOUND' ? 'badge-issue' : 'badge-review'}`}
            >
              {validationStatus === 'IMPROVED' ? <ShieldCheck size={12} /> : <Sparkles size={12} />}
              <span>{validationStatus === 'IMPROVED' ? 'Verified: Evaluated Checks Improved' : `Validation: ${validationStatus}`}</span>
            </span>
            <span className="badge badge-neutral">Status: {status}</span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            {brandName} — {productName}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '700px', marginTop: '0.2rem' }}>
            Compare original ({sourceVersionLabel}) artwork with suggested ({suggestedVersionLabel}) compliance adjustments. Statutory declarations are preserved and corrected deterministically.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onRunVerification && (
            <button
              onClick={onRunVerification}
              disabled={isVerifying}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <RefreshCw size={14} className={isVerifying ? 'animate-spin' : ''} />
              <span>{isVerifying ? 'Re-Validating...' : 'Verify Changes (Re-Inspect)'}</span>
            </button>
          )}

          {onDownloadPdf && (
            <button onClick={onDownloadPdf} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
              <Download size={14} />
              <span>Download Suggested PDF</span>
            </button>
          )}

          {onCompareVersions && (
            <button onClick={onCompareVersions} className="btn btn-outline btn-sm" style={{ gap: '0.35rem' }}>
              <GitCompare size={14} />
              <span>Compare</span>
            </button>
          )}

          {onViewRegression && (
            <button onClick={onViewRegression} className="btn btn-ghost btn-sm" style={{ gap: '0.35rem' }}>
              <span>Regression</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Panel Clean Navigation Bar */}
      <div
        className="card"
        style={{
          padding: '0.625rem 1rem',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            Select Panel:
          </span>
          {displayPanels.map((dp) => {
            const isSelected = dp.key === selectedPanelType || dp.normKey === selectedPanelType;
            return (
              <button
                key={dp.id}
                type="button"
                onClick={() => setSelectedPanelType(dp.normKey)}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.75rem',
                  fontWeight: 600,
                  gap: '0.35rem',
                }}
              >
                <span>{dp.label.toUpperCase()}</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : dp.changeCount > 0 ? 'var(--status-review-bg)' : 'var(--bg-surface-subtle)',
                    color: isSelected ? '#FFF' : dp.changeCount > 0 ? 'var(--status-review-text)' : 'var(--text-muted)',
                  }}
                >
                  {dp.changeCount > 0 ? `${dp.changeCount} change${dp.changeCount > 1 ? 's' : ''}` : 'No changes'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel Status Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {activePanel.label}:
          </span>
          <span style={{ color: panelChanges.length > 0 ? 'var(--brand-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
            {panelChanges.length > 0
              ? `${panelChanges.length} statutory adjustment${panelChanges.length > 1 ? 's' : ''} applied`
              : 'Preserved without changes'}
          </span>
        </div>
      </div>

      {/* Main Side-by-Side Comparison Workspace */}
      <div className="grid-2" style={{ alignItems: 'stretch', gap: '1.25rem' }}>
        
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
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>ORIGINAL DESIGN ({sourceVersionLabel})</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                {activePanel.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button onClick={handleZoomOut} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>
                <ZoomOut size={13} />
              </button>
              <button onClick={handleZoomIn} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>
                <ZoomIn size={13} />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '460px',
              backgroundColor: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '1.5rem',
              overflow: 'hidden',
            }}
          >
            {activeOriginalImage ? (
              <div
                style={{
                  position: 'relative',
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.15s ease',
                  maxWidth: '100%',
                  maxHeight: '420px',
                }}
              >
                <img
                  src={activeOriginalImage}
                  alt={`${activePanel.label} Original Artwork`}
                  style={{ maxHeight: '400px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                <p style={{ fontSize: '0.875rem' }}>Original artwork preview available.</p>
              </div>
            )}
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
              <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--brand-primary)' }}>
                SUGGESTED DESIGN ({suggestedVersionLabel})
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                {activePanel.label}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              {panelChanges.length > 0 ? `${panelChanges.length} adjustment(s)` : 'Preserved'}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '460px',
              backgroundColor: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '1.5rem',
              overflow: 'hidden',
            }}
          >
            {activeSuggestedImage ? (
              <div
                style={{
                  position: 'relative',
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.15s ease',
                  maxWidth: '100%',
                  maxHeight: '420px',
                }}
              >
                <img
                  src={activeSuggestedImage}
                  alt={`${activePanel.label} Suggested Design`}
                  style={{ maxHeight: '400px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                <p style={{ fontSize: '0.875rem' }}>Suggested artwork preview available.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Structured Changes Breakdown for Selected Panel */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Adjustments on {activePanel.label} Panel ({panelChanges.length})
        </h3>

        {panelChanges.length === 0 ? (
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Check size={18} style={{ color: 'var(--status-good-solid)', margin: '0 auto 0.35rem auto' }} />
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>No changes required on this panel.</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Original packaging dieline and declarations are preserved.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {panelChanges.map((change) => {
              const isSelected = change.change_id === selectedChangeId;
              return (
                <div
                  key={change.change_id}
                  onClick={() => setSelectedChangeId(change.change_id)}
                  style={{
                    padding: '1rem',
                    backgroundColor: isSelected ? 'var(--bg-surface)' : 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{change.field_name}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>{change.rule_code}</span>
                  </div>
                  <span className="badge badge-good" style={{ fontSize: '0.6875rem' }}>{change.status || 'IMPROVED'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Original:</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                      {change.original_value || 'Not clearly detected'}
                    </p>
                  </div>

                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--brand-primary-light)', borderRadius: '4px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', textTransform: 'uppercase', fontWeight: 600 }}>Suggested:</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 700, margin: '2px 0 0 0' }}>
                      {change.suggested_value}
                    </p>
                  </div>
                </div>

                {change.reason && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Rationale: </strong>{change.reason}
                  </p>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};
