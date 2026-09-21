import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';
import type { ApiInspection } from '../services/api';
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight, AlertTriangle, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';

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
  const pollIntervalRef = useRef<any>(null);

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: '1', label: 'Packaging file received', status: 'completed', detail: 'Artwork saved securely' },
    { id: '2', label: 'Checking image quality', status: 'running', detail: 'Evaluating resolution and readability' },
    { id: '3', label: 'Reading packaging text', status: 'pending', detail: 'Detecting text declarations' },
    { id: '4', label: 'Organizing packaging information', status: 'pending', detail: 'Identifying brand, net qty, MRP, dates & manufacturer' },
    { id: '5', label: 'Checking packaging requirements', status: 'pending', detail: 'Evaluating statutory requirements' },
  ]);

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

        const isGoodQuality = data.quality_verdict === 'GOOD';
        const qualityDetail = isGoodQuality ? 'Image quality: Good' : 'Image quality: Needs review (some details may be difficult to verify)';

        if (data.status === 'COMPLETED') {
          const blockCount = data.extracted_data?.total_blocks || 0;
          setSteps([
            { id: '1', label: 'Packaging file received', status: 'completed', detail: data.original_filename || 'Artwork uploaded successfully' },
            { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
            { id: '3', label: 'Reading packaging text', status: 'completed', detail: `${blockCount} text blocks detected` },
            { id: '4', label: 'Organizing packaging information', status: 'completed', detail: 'Packaging declarations identified' },
            { id: '5', label: 'Checking packaging requirements', status: 'completed', detail: 'Statutory checks complete' },
          ]);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        } else if (data.status === 'FAILED') {
          setSteps((prev) =>
            prev.map((s, idx) =>
              idx === 1
                ? { ...s, status: 'failed', detail: data.error_message || 'Could not complete analysis' }
                : s
            )
          );
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        } else if (data.status === 'PROCESSING') {
          // Progress steps based on current stage
          if (data.current_stage === 'TEXT_EXTRACTION') {
            setSteps([
              { id: '1', label: 'Packaging file received', status: 'completed', detail: data.original_filename },
              { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
              { id: '3', label: 'Reading packaging text', status: 'running', detail: 'Extracting text layer' },
              { id: '4', label: 'Organizing packaging information', status: 'pending', detail: 'Waiting' },
              { id: '5', label: 'Checking packaging requirements', status: 'pending', detail: 'Waiting' },
            ]);
          } else if (data.current_stage === 'STRUCTURED_PARSING') {
            setSteps([
              { id: '1', label: 'Packaging file received', status: 'completed', detail: data.original_filename },
              { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
              { id: '3', label: 'Reading packaging text', status: 'completed', detail: 'Text found' },
              { id: '4', label: 'Organizing packaging information', status: 'running', detail: 'Parsing packaging entities' },
              { id: '5', label: 'Checking packaging requirements', status: 'pending', detail: 'Waiting' },
            ]);
          } else if (data.current_stage === 'COMPLIANCE_EVALUATION') {
            setSteps([
              { id: '1', label: 'Packaging file received', status: 'completed', detail: data.original_filename },
              { id: '2', label: 'Checking image quality', status: isGoodQuality ? 'completed' : 'warning', detail: qualityDetail },
              { id: '3', label: 'Reading packaging text', status: 'completed', detail: 'Text found' },
              { id: '4', label: 'Organizing packaging information', status: 'completed', detail: 'Declarations identified' },
              { id: '5', label: 'Checking packaging requirements', status: 'running', detail: 'Evaluating applicable rules' },
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
  }, [inspectionId, navigate]);

  const allDone = inspection?.status === 'COMPLETED';
  const isFailed = inspection?.status === 'FAILED';

  // Extract artwork preview URL
  const primaryPreviewUrl = inspection?.preview_url ? api.getFileUrl(inspection.preview_url) : null;
  const panels = inspection?.panels || [];

  return (
    <AppShell breadcrumbs={[{ label: 'Checking Packaging' }]}>
      <div style={{ maxWidth: '840px', margin: '1rem auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <ShieldCheck size={14} />
            <span>Packaging Analysis</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            {inspection ? inspection.product_name : 'Checking Your Packaging'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Revision {inspection?.version_label || 'V01'} • Packaging analysis
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
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem', alignItems: 'center' }}>
            
            {/* Left: Actual Uploaded Artwork Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-default)', minHeight: '260px', justifyContent: 'center' }}>
              {primaryPreviewUrl && !imageLoadError ? (
                <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img
                    src={primaryPreviewUrl}
                    alt={inspection?.product_name || 'Uploaded Packaging Artwork'}
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
                    {inspection?.original_filename || 'Uploaded Artwork'}
                  </span>
                  <span style={{ fontSize: '0.7rem' }}>
                    {panels.length > 0 ? `${panels.length} panel(s) uploaded` : 'Processing packaging image'}
                  </span>
                </div>
              )}

              {/* Panel thumbnails pill strip if multi-panel */}
              {panels.length > 1 && (
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {panels.map((p) => (
                    <span
                      key={p.id}
                      className="badge badge-neutral"
                      style={{ fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}
                    >
                      {p.panel_type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                {allDone ? '✓ Analysis Complete' : isFailed ? '✕ Processing Error' : 'Analyzing Artwork...'}
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
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
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

          {/* User Confirmation Banner */}
          <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <span>
              Your packaging information has been extracted and is ready for compliance verification.
            </span>
          </div>

          {/* Action Footer */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-default)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {allDone ? 'Packaging verified successfully.' : isFailed ? 'Processing error encountered.' : 'Analyzing packaging dieline and declarations...'}
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
