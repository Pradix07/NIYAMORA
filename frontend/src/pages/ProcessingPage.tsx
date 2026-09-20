import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PackagingVisual } from '../components/common/PackagingVisual';
import { api } from '../services/api';
import type { ApiInspection } from '../services/api';
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

interface PipelineStep {
  id: string;
  label: string;
  status: 'completed' | 'running' | 'pending';
  detail?: string;
}

export const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get('inspectionId');

  const [inspection, setInspection] = useState<ApiInspection | null>(null);

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: '1', label: 'File received & saved to secure storage', status: 'completed', detail: 'Original file preserved' },
    { id: '2', label: 'Pre-flight image quality & resolution check', status: 'running', detail: 'Checking blur, DPI & contrast' },
    { id: '3', label: 'Text & vector layout segmentation', status: 'pending', detail: 'Extracting spatial text blocks & bounding boxes' },
    { id: '4', label: 'Structured packaging entity tagging', status: 'pending', detail: 'Identifying Brand, Net Qty, MRP, FSSAI, Consumer Care' },
    { id: '5', label: 'Preparing extraction workbench report', status: 'pending', detail: 'Assembling evidence coordinates' },
  ]);

  useEffect(() => {
    if (!inspectionId) {
      // Offline fallback simulation
      const timer = setInterval(() => {
        setSteps((prev) => {
          const nextIndex = prev.findIndex((s) => s.status === 'running');
          if (nextIndex === -1 || nextIndex >= prev.length - 1) return prev;
          const updated = [...prev];
          updated[nextIndex] = { ...updated[nextIndex], status: 'completed' };
          if (nextIndex + 1 < updated.length) {
            updated[nextIndex + 1] = { ...updated[nextIndex + 1], status: 'running' };
          }
          return updated;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    // Live backend polling
    let interval: any;
    const fetchStatus = async () => {
      try {
        const data = await api.getInspection(inspectionId);
        setInspection(data);

        if (data.status === 'COMPLETED') {
          const blockCount = data.extracted_data?.total_blocks || 0;
          setSteps([
            { id: '1', label: 'File received & saved to secure storage', status: 'completed', detail: data.original_filename },
            { id: '2', label: 'Pre-flight image quality & resolution check', status: 'completed', detail: `Verdict: ${data.quality_verdict || 'GOOD'} (${((data.quality_score || 1) * 100).toFixed(0)}% score)` },
            { id: '3', label: 'Text & vector layout segmentation', status: 'completed', detail: `${blockCount} spatial text blocks extracted` },
            { id: '4', label: 'Structured packaging entity tagging', status: 'completed', detail: 'Declared entities categorized' },
            { id: '5', label: 'Preparing extraction workbench report', status: 'completed', detail: 'Evidence coordinates ready for inspection' },
          ]);
          clearInterval(interval);
        } else if (data.status === 'FAILED') {
          setSteps((prev) => prev.map((s, idx) => idx === 1 ? { ...s, status: 'running', detail: data.error_message || 'Processing failed' } : s));
          clearInterval(interval);
        }
      } catch (err) {
        console.warn('Failed to poll inspection, waiting...', err);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [inspectionId]);

  const allDone = inspection ? inspection.status === 'COMPLETED' : steps.every((s) => s.status === 'completed');

  return (
    <AppShell breadcrumbs={[{ label: 'Processing' }]}>
      <div style={{ maxWidth: '840px', margin: '1rem auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <ShieldCheck size={14} />
            <span>Pre-Print Ingestion & Extraction</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            {inspection ? inspection.product_name : 'Analyzing Packaging Artwork'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Revision {inspection?.version_label || 'V01'} • {inspection?.original_filename || 'Vector Dieline Master'}
          </p>
        </div>

        {/* Center Container: Visual + Pipeline Progress */}
        <div className="card-tactile" style={{ width: '100%', padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2.5rem', alignItems: 'center' }}>
            
            {/* Left: Product Preview Animation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <PackagingVisual type="Stand-Up Pouch" variant="card" />
              
              {/* Scan Line effect */}
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

              <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
                {allDone ? 'Extraction Complete' : 'Scanning Artwork Dieline...'}
              </span>
            </div>

            {/* Right: Pipeline Stages Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {steps.map((step) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: step.status === 'pending' ? 0.45 : 1, transition: 'opacity 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--status-good-solid)', flexShrink: 0 }} />
                    ) : step.status === 'running' ? (
                      <Loader2 size={18} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid var(--border-strong)', flexShrink: 0 }} />
                    )}

                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: step.status === 'running' ? 700 : 500, color: step.status === 'running' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                        {step.label}
                      </span>
                      {step.detail && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {step.detail}
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: step.status === 'completed' ? 'var(--status-good-text)' : 'var(--text-muted)' }}>
                    {step.status === 'completed' ? 'Done' : step.status === 'running' ? 'Active' : 'Waiting'}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Phase 3 Disclaimer Banner */}
          <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <span>
              <strong>Phase 2 Scope Note:</strong> Extraction identifies declared entities and spatial coordinates. Statutory Legal Metrology & FSSAI rule compliance decisions will be evaluated in Phase 3.
            </span>
          </div>

          {/* Action Footer */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-default)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {allDone ? 'Packaging content extracted successfully.' : 'Processing vector objects & quality analysis...'}
            </span>

            <button
              onClick={() => navigate(inspectionId ? `/workbench?inspectionId=${inspectionId}` : '/workbench')}
              className={`btn ${allDone ? 'btn-primary' : 'btn-secondary'} btn-lg`}
              style={{ gap: '0.4rem' }}
            >
              <span>{allDone ? 'Open in Results Workbench' : 'Skip to Workbench'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
