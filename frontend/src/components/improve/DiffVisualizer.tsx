import React, { useState } from 'react';
import type { ApiSuggestedDesignChange } from '../../services/api';
import { Sparkles, Download, ArrowRight, ShieldCheck, CheckCircle2, RefreshCw, GitCompare, ZoomIn, ZoomOut } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface DiffVisualizerProps {
  productName?: string;
  brandName?: string;
  sourceVersionLabel?: string;
  suggestedVersionLabel?: string;
  sourcePreviewUrl?: string | null;
  suggestedPreviewUrl?: string | null;
  changes: ApiSuggestedDesignChange[];
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
  brandName = 'Aura Botanicals',
  sourceVersionLabel = 'V01',
  suggestedVersionLabel = 'V02',
  sourcePreviewUrl,
  suggestedPreviewUrl,
  changes,
  validationStatus = 'PENDING',
  status = 'GENERATED',
  onDownloadPdf,
  onRunVerification,
  onCompareVersions,
  onViewRegression,
  isVerifying = false,
}) => {
  const [selectedChangeId, setSelectedChangeId] = useState<string>(changes[0]?.change_id || '');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const selectedChange = changes.find((c) => c.change_id === selectedChangeId) || changes[0];

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.7));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Control Deck */}
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
            <span className="badge badge-sample">Design Assistance</span>
            <span
              className={`badge ${validationStatus === 'IMPROVED' || validationStatus === 'VERIFIED' ? 'badge-good' : validationStatus === 'NEW_ISSUES_FOUND' ? 'badge-issue' : 'badge-review'}`}
            >
              {validationStatus === 'IMPROVED' ? <ShieldCheck size={12} /> : <Sparkles size={12} />}
              {validationStatus === 'IMPROVED' ? 'Verified: Evaluated Checks Improved' : `Validation: ${validationStatus}`}
            </span>
            <span className="badge badge-neutral">Status: {status}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Review compliance suggestions before the package goes to print.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '700px', marginTop: '0.25rem' }}>
            Compare original artwork with NIYAMURA's structured compliance suggestions. Critical statutory values (MRP, net quantity, manufacturer address) are preserved deterministically.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={onRunVerification}
            disabled={isVerifying}
            className="btn btn-secondary"
            style={{ gap: '0.4rem' }}
          >
            <RefreshCw size={15} className={isVerifying ? 'animate-spin' : ''} />
            <span>{isVerifying ? 'Re-Validating Engine...' : 'Verify Changes (Re-Inspect)'}</span>
          </button>

          <button onClick={onDownloadPdf} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Download size={15} />
            <span>Download Suggested PDF</span>
          </button>

          <button onClick={onCompareVersions} className="btn btn-outline" style={{ gap: '0.4rem' }}>
            <GitCompare size={15} />
            <span>Compare Versions</span>
          </button>

          {onViewRegression && (
            <button onClick={onViewRegression} className="btn btn-ghost" style={{ gap: '0.4rem' }}>
              <span>View Regression</span>
              <ArrowRight size={14} />
            </button>
          )}
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
              <span className="badge badge-issue" style={{ fontSize: '0.7rem' }}>
                {changes.length} Finding{changes.length !== 1 ? 's' : ''} Observed
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
            {sourcePreviewUrl ? (
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
                  src={sourcePreviewUrl}
                  alt="Original Artwork"
                  style={{ maxHeight: '400px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                />
                {/* Highlight Selected Change Bounding Box on Original */}
                {selectedChange?.original_location && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${selectedChange.original_location.x}%`,
                      top: `${selectedChange.original_location.y}%`,
                      width: `${selectedChange.original_location.width}%`,
                      height: `${selectedChange.original_location.height}%`,
                      border: '2px solid var(--status-issue-solid)',
                      backgroundColor: 'rgba(239, 68, 68, 0.25)',
                      borderRadius: '3px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '-16px',
                        left: '0',
                        backgroundColor: 'var(--status-issue-solid)',
                        color: '#FFF',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '2px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Observed Deficit
                    </span>
                  </div>
                )}
              </div>
            ) : (
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
                  transform: `scale(${zoomLevel})`,
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#333' }}>{brandName.toUpperCase()}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111' }}>{productName.toUpperCase()}</h3>
                </div>

                <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>Original Master Dieline</span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '2px solid var(--status-issue-solid)',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#444' }}>
                    {selectedChange?.original_value || 'Observed Declaration Value'}
                  </span>
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
                    Finding
                  </div>
                </div>
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
              <span className="badge badge-fixed" style={{ fontSize: '0.7rem' }}>
                {validationStatus === 'IMPROVED' ? 'Verified Candidate Design' : 'Suggested Adjustments'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              {selectedChange?.field_name || 'Structured Sizing'}
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
            {suggestedPreviewUrl ? (
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
                  src={suggestedPreviewUrl}
                  alt="Suggested Artwork"
                  style={{ maxHeight: '400px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                />
                {/* Highlight Selected Change on Suggested */}
                {selectedChange?.suggested_location && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${selectedChange.suggested_location.x}%`,
                      top: `${selectedChange.suggested_location.y}%`,
                      width: `${selectedChange.suggested_location.width}%`,
                      height: `${selectedChange.suggested_location.height}%`,
                      border: '2px solid var(--status-good-solid)',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '3px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.7)',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '-16px',
                        left: '0',
                        backgroundColor: 'var(--status-good-solid)',
                        color: '#FFF',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '2px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ✓ Suggested Layout
                    </span>
                  </div>
                )}
              </div>
            ) : (
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
                  transform: `scale(${zoomLevel})`,
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#333' }}>{brandName.toUpperCase()}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111' }}>{productName.toUpperCase()}</h3>
                </div>

                <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>NIYAMURA Suggested Overlay</span>
                </div>

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
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#000', letterSpacing: '0.02em', whiteSpace: 'pre-line' }}>
                    {selectedChange?.suggested_value || 'Compliant Declaration Specification'}
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
                    ✓ Suggested
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Structured Changes Detail Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--brand-primary)' }} />
          <span>Structured Suggested Adjustments ({changes.length})</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {changes.map((change) => {
            const isSelected = selectedChangeId === change.change_id;
            return (
              <div
                key={change.change_id}
                onClick={() => setSelectedChangeId(change.change_id)}
                className="card"
                style={{
                  padding: '1.125rem',
                  backgroundColor: isSelected ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                  border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-default)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={change.status === 'FIXED' ? 'FIXED' : change.status === 'IMPROVED' ? 'GOOD' : 'REVIEW'} size="sm" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{change.field_name}</span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>({change.rule_code})</span>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{change.change_type}</span>
                </div>

                <div className="grid-2" style={{ gap: '1rem', fontSize: '0.8125rem', marginBottom: '0.625rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                    <span style={{ color: 'var(--status-issue-text)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      Original Observed Specification:
                    </span>
                    <p style={{ marginTop: '3px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {change.original_value || 'Not Detected'}
                    </p>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-good-border)' }}>
                    <span style={{ color: 'var(--status-good-text)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      NIYAMURA Suggested Specification:
                    </span>
                    <p style={{ marginTop: '3px', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-line' }}>
                      {change.suggested_value}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Statutory Rationale:</strong> {change.reason}
                </p>
                {change.rule_reference && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <strong>Legal Reference:</strong> {change.rule_reference}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Statutory Advisory Disclaimer */}
      <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <strong>Regulatory & Legal Disclaimer:</strong> This document is a design assistance and compliance review artifact. It is not a government certificate, approval, or legal certification. Final regulatory and production decisions remain with the responsible product owner and relevant authorities.
      </div>
    </div>
  );
};
