import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';
import type { ApiInspection } from '../services/api';
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight, AlertTriangle, RefreshCw, AlertCircle, Image as ImageIcon, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface PipelineStep {
  id: string;
  label: string;
  status: 'completed' | 'running' | 'warning' | 'pending' | 'failed';
  detail?: string;
}

export const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get('inspectionId');

  const [inspection, setInspection] = useState<ApiInspection | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [showQualityDetails, setShowQualityDetails] = useState<boolean>(false);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const pollIntervalRef = useRef<any>(null);

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: '1', label: 'File received', status: 'completed', detail: 'Artwork saved securely' },
    { id: '2', label: 'Checking image quality', status: 'running', detail: 'Checking clarity and readability' },
    { id: '3', label: 'Reading packaging text', status: 'pending', detail: 'Detecting text declarations' },
    { id: '4', label: 'Finding packaging information', status: 'pending', detail: 'Identifying brand, net qty, MRP, dates & manufacturer' },
    { id: '5', label: 'Checking packaging requirements', status: 'pending', detail: 'Evaluating requirements' },
  ]);

  const isFilenameLike = (name?: string | null): boolean => {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    if (['screenshot', 'screen shot', 'img_', 'img-', 'dsc_', 'whatsapp', 'pasted', 'image', 'photo', 'scan', 'panel_'].some(p => lower.startsWith(p))) {
      return true;
    }
    if (['.png', '.jpg', '.jpeg', '.pdf', '.webp', '.ai', '.psd'].some(ext => lower.endsWith(ext))) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!inspectionId) {
      // Direct access without inspectionId: redirect to New Check
      navigate('/new-check');
      return;
    }

    let isSubscribed = true;

    const fetchStatus = async () => {
      try {
        setPollCount((prev) => prev + 1);
        const data = await api.getInspection(inspectionId);
        if (!isSubscribed) return;

        setInspection(data);
        setPollError(null);

        if (data.panels && data.panels.length > 0 && !selectedPanelId) {
          setSelectedPanelId(data.panels[0].id);
        }

        const isGoodQuality = data.quality_verdict === 'GOOD';
        const qualityDetail = isGoodQuality ? 'Image quality: Good' : 'Image quality needs review';

        if (data.status === 'COMPLETED') {
          const blockCount = data.extracted_data?.total_blocks || 0;
          setSteps([
            { id: '1', label: 'File received', status: 'completed', detail: 'Artwork saved securely' },
            { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
            { id: '3', label: 'Reading packaging text', status: 'completed', detail: `${blockCount} text blocks detected` },
            { id: '4', label: 'Finding packaging information', status: 'completed', detail: 'Packaging information found' },
            { id: '5', label: 'Checking packaging requirements', status: 'completed', detail: 'Packaging requirements checked' },
          ]);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setTimeout(() => {
            if (isSubscribed) {
              navigate(`/workbench?inspectionId=${inspectionId}`);
            }
          }, 1200);
        } else if (data.status === 'FAILED') {
          setSteps((prev) =>
            prev.map((s, idx) =>
              idx === 1 || idx === 2
                ? { ...s, status: 'failed', detail: data.error_message || 'Could not complete analysis' }
                : s
            )
          );
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        } else if (data.status === 'PROCESSING') {
          // Progress steps based on current stage
          if (data.current_stage === 'QUALITY_PRECHECK') {
            setSteps([
              { id: '1', label: 'File received', status: 'completed', detail: 'Artwork saved securely' },
              { id: '2', label: 'Checking image quality', status: 'running', detail: 'Evaluating clarity' },
              { id: '3', label: 'Reading packaging text', status: 'pending', detail: 'Waiting' },
              { id: '4', label: 'Finding packaging information', status: 'pending', detail: 'Waiting' },
              { id: '5', label: 'Checking packaging requirements', status: 'pending', detail: 'Waiting' },
            ]);
          } else if (data.current_stage === 'TEXT_EXTRACTION') {
            setSteps([
              { id: '1', label: 'File received', status: 'completed', detail: 'Artwork saved securely' },
              { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
              { id: '3', label: 'Reading packaging text', status: 'running', detail: 'Reading packaging text...' },
              { id: '4', label: 'Finding packaging information', status: 'pending', detail: 'Waiting' },
              { id: '5', label: 'Checking packaging requirements', status: 'pending', detail: 'Waiting' },
            ]);
          } else if (data.current_stage === 'STRUCTURED_PARSING') {
            setSteps([
              { id: '1', label: 'File received', status: 'completed', detail: 'Artwork saved securely' },
              { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
              { id: '3', label: 'Reading packaging text', status: 'completed', detail: 'Text found' },
              { id: '4', label: 'Finding packaging information', status: 'running', detail: 'Finding packaging information...' },
              { id: '5', label: 'Checking packaging requirements', status: 'pending', detail: 'Waiting' },
            ]);
          } else if (data.current_stage === 'COMPLIANCE_EVALUATION') {
            setSteps([
              { id: '1', label: 'File received', status: 'completed', detail: 'Artwork saved securely' },
              { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
              { id: '3', label: 'Reading packaging text', status: 'completed', detail: 'Text found' },
              { id: '4', label: 'Finding packaging information', status: 'completed', detail: 'Packaging information found' },
              { id: '5', label: 'Checking packaging requirements', status: 'running', detail: 'Checking packaging requirements...' },
            ]);
          }
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.warn('Inspection polling update:', err);
        setPollError(err.message || 'Unable to update analysis status.');
      }
    };

    fetchStatus();
    pollIntervalRef.current = setInterval(fetchStatus, 1500);

    return () => {
      isSubscribed = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [inspectionId, navigate, selectedPanelId]);

  const allDone = inspection?.status === 'COMPLETED';
  const isFailed = inspection?.status === 'FAILED';

  // Derive clean product name (never display screenshot filename)
  const getCleanProductName = (): string => {
    if (!inspection) return 'Checking Your Packaging';
    if (!isFilenameLike(inspection.product_name)) {
      return inspection.product_name;
    }
    const detected = inspection.extracted_data?.fields?.product_name?.extracted_value;
    if (detected && !isFilenameLike(detected)) {
      return detected;
    }
    return 'Packaging Artwork';
  };

  const displayName = getCleanProductName();

  // Panels handling: determine active preview
  const panels = inspection?.panels || [];
  const activePanel = panels.find((p) => p.id === selectedPanelId) || panels[0];
  const activePreviewUrl = activePanel?.preview_url
    ? api.getFileUrl(activePanel.preview_url)
    : inspection?.preview_url
    ? api.getFileUrl(inspection.preview_url)
    : null;

  // Standard panel list for indicator
  const standardPanels = [
    { key: 'FRONT', label: 'Front' },
    { key: 'BACK', label: 'Back' },
    { key: 'SIDE_LEFT', label: 'Side Left' },
    { key: 'SIDE_RIGHT', label: 'Side Right' },
  ];

  return (
    <AppShell breadcrumbs={[{ label: 'Checking Packaging' }]}>
      <div style={{ maxWidth: '840px', margin: '1rem auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', alignItems: 'center' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <ShieldCheck size={14} />
            <span>Reading your packaging</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            {displayName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            {inspection?.version_label || 'Version 01'} • Packaging check
          </p>
        </div>

        {/* Error Alert if Polling Failed Permanently */}
        {pollError && pollCount > 10 && (
          <div style={{ width: '100%', padding: '0.875rem 1.25rem', backgroundColor: 'var(--status-issue-bg)', border: '1px solid var(--status-issue-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-issue-text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>This is taking longer than expected. You can wait or retry.</span>
            </div>
            <button onClick={() => window.location.reload()} className="btn btn-sm btn-secondary" style={{ gap: '0.35rem' }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Center Container: Real Uploaded Artwork Preview + Progress Stages */}
        <div className="card-tactile" style={{ width: '100%', padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', alignItems: 'center' }}>
            
            {/* Left: Actual Uploaded Artwork Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-default)', minHeight: '270px', justifyContent: 'center' }}>
              {activePreviewUrl && !imageLoadError ? (
                <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img
                    src={activePreviewUrl}
                    alt={displayName}
                    onError={() => setImageLoadError(true)}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '220px',
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  />
                  {!allDone && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: 'var(--brand-primary)',
                        boxShadow: '0 0 10px var(--brand-primary)',
                        animation: 'pulseGlow 2s infinite ease-in-out',
                      }}
                    />
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', color: 'var(--text-secondary)' }}>
                    Uploaded Packaging Artwork
                  </span>
                  <span style={{ fontSize: '0.7rem' }}>
                    {panels.length > 0 ? `${panels.length} panel(s) uploaded` : 'Processing packaging image'}
                  </span>
                </div>
              )}

              {/* Real Panel Selector / Availability Bar */}
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {standardPanels.map((std) => {
                  const uploadedPanel = panels.find((p) => p.panel_type.toUpperCase() === std.key);
                  const isUploaded = !!uploadedPanel || (panels.length === 0 && std.key === 'FRONT');
                  const isCurrentActive = uploadedPanel ? uploadedPanel.id === selectedPanelId : (std.key === 'FRONT');

                  return (
                    <button
                      key={std.key}
                      type="button"
                      disabled={!uploadedPanel}
                      onClick={() => uploadedPanel && setSelectedPanelId(uploadedPanel.id)}
                      className={`badge ${isUploaded ? (isCurrentActive ? 'badge-sample' : 'badge-neutral') : 'badge-ghost'}`}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        fontWeight: 600,
                        cursor: uploadedPanel ? 'pointer' : 'default',
                        opacity: isUploaded ? 1 : 0.45,
                        border: isCurrentActive ? '1px solid var(--brand-primary)' : '1px solid transparent',
                      }}
                    >
                      {std.label} {isUploaded ? '✓' : '—'}
                    </button>
                  );
                })}
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                {allDone ? '✓ Results ready' : isFailed ? '✕ Processing Error' : 'Reading your packaging...'}
              </span>
            </div>

            {/* Right: Pipeline Stages Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {steps.map((step) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: step.status === 'pending' ? 0.45 : 1,
                    transition: 'opacity 0.25s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--status-good-solid)', flexShrink: 0 }} />
                    ) : step.status === 'warning' ? (
                      <AlertTriangle size={18} style={{ color: 'var(--status-review-solid)', flexShrink: 0 }} />
                    ) : step.status === 'running' ? (
                      <Loader2 size={18} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    ) : step.status === 'failed' ? (
                      <AlertCircle size={18} style={{ color: 'var(--status-issue-solid)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid var(--border-strong)', flexShrink: 0 }} />
                    )}

                    <div>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: step.status === 'running' ? 700 : 500,
                          color: step.status === 'running' ? 'var(--brand-primary)' : 'var(--text-primary)',
                        }}
                      >
                        {step.label}
                      </span>
                      {step.detail && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {step.detail}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color:
                        step.status === 'completed'
                          ? 'var(--status-good-text)'
                          : step.status === 'warning'
                          ? 'var(--status-review-text)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {step.status === 'completed'
                      ? 'Done'
                      : step.status === 'warning'
                      ? 'Review'
                      : step.status === 'running'
                      ? 'In Progress'
                      : step.status === 'failed'
                      ? 'Error'
                      : 'Waiting'}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Quality Notice Banner (if quality review needed) */}
          {inspection?.quality_verdict && inspection.quality_verdict !== 'GOOD' && (
            <div style={{ marginTop: '1.5rem', padding: '0.875rem 1rem', backgroundColor: 'var(--status-review-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-review-border)', fontSize: '0.8125rem', color: 'var(--status-review-text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Image quality needs review:</strong> Some small details may be difficult to read. You can continue, but a clearer image may improve the results.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQualityDetails(!showQualityDetails)}
                  className="btn-ghost"
                  style={{ fontSize: '0.75rem', color: 'var(--status-review-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, flexShrink: 0 }}
                >
                  <span>{showQualityDetails ? 'Hide details' : 'View details'}</span>
                  {showQualityDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {showQualityDetails && (
                <div style={{ marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid var(--status-review-border)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  <p style={{ margin: '0 0 4px' }}>• Resolution: {inspection.quality_details?.width || 0} × {inspection.quality_details?.height || 0} px</p>
                  <p style={{ margin: '0 0 4px' }}>• Clarity evaluation: Text readability check suggests manual verification for small print.</p>
                  {inspection.quality_details?.warnings && inspection.quality_details.warnings.length > 0 && (
                    <p style={{ margin: 0 }}>• {inspection.quality_details.warnings[0]}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Confirmation Banner */}
          <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <span>
              {allDone
                ? 'Packaging requirements checked. Your results are ready.'
                : 'Packaging information found. Checking packaging requirements...'}
            </span>
          </div>

          {/* Action Footer */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-default)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {allDone ? 'Your results are ready.' : isFailed ? 'Processing error encountered.' : 'Reading your packaging...'}
            </span>

            <button
              onClick={() => navigate(inspectionId ? `/workbench?inspectionId=${inspectionId}` : '/workbench')}
              className={`btn ${allDone ? 'btn-primary' : 'btn-secondary'} btn-lg`}
              style={{ gap: '0.4rem' }}
            >
              <span>{allDone ? 'View Results in Workbench →' : 'Skip to Workbench'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
