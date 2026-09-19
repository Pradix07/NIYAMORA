import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PackagingVisual } from '../components/common/PackagingVisual';
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface PipelineStep {
  id: string;
  label: string;
  status: 'completed' | 'running' | 'pending';
  detail?: string;
}

export const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();

  const initialSteps: PipelineStep[] = [
    { id: '1', label: 'Reading artwork dieline & rasterizing layers', status: 'completed', detail: '300 DPI vector PDF extracted' },
    { id: '2', label: 'Finding text & OCR layout segmentation', status: 'completed', detail: '14 text blocks identified' },
    { id: '3', label: 'Understanding statutory fields & entity tagging', status: 'completed', detail: 'PDP, Net Qty, FSSAI, MRP recognized' },
    { id: '4', label: 'Checking mandatory declarations & allergens', status: 'running', detail: 'Evaluating FSSAI Regulation 2.2' },
    { id: '5', label: 'Checking measurements & numeral millimeter height', status: 'pending', detail: 'Measuring Legal Metrology Rule 9' },
    { id: '6', label: 'Applying statutory rules & contrast heuristics', status: 'pending', detail: 'Evaluating background text legibility' },
    { id: '7', label: 'Preparing inspection findings & workbench report', status: 'pending', detail: 'Generating visual evidence bounding boxes' },
  ];

  const [steps, setSteps] = useState<PipelineStep[]>(initialSteps);

  useEffect(() => {
    const timer = setInterval(() => {
      setSteps((prev) => {
        const nextIndex = prev.findIndex((s) => s.status === 'running');
        if (nextIndex === -1 || nextIndex >= prev.length - 1) {
          return prev;
        }

        const updated = [...prev];
        updated[nextIndex] = { ...updated[nextIndex], status: 'completed' };
        if (nextIndex + 1 < updated.length) {
          updated[nextIndex + 1] = { ...updated[nextIndex + 1], status: 'running' };
        }
        return updated;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const allDone = steps.every((s) => s.status === 'completed');

  return (
    <AppShell breadcrumbs={[{ label: 'Processing' }]}>
      <div style={{ maxWidth: '840px', margin: '1rem auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            <span>Pre-Print Screening Pipeline</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Analyzing Packaging Artwork</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Organic Chia Crunch Superfood Pouch • Revision V02
          </p>
        </div>

        {/* Center Container: Visual + Pipeline Progress */}
        <div className="card-tactile" style={{ width: '100%', padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2.5rem', alignItems: 'center' }}>
            
            {/* Left: Product Preview Animation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <PackagingVisual type="Stand-Up Pouch" variant="card" />
              
              {/* Scan Line effect */}
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

              <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
                Scanning Artwork Dieline...
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
                    {step.status === 'completed' ? 'Done' : step.status === 'running' ? 'Scanning...' : 'Waiting'}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Action Footer */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-default)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {allDone ? 'Screening complete. 7 findings generated.' : 'Evaluating against Legal Metrology & FSSAI rules...'}
            </span>

            <button
              onClick={() => navigate('/workbench')}
              className={`btn ${allDone ? 'btn-primary' : 'btn-secondary'} btn-lg`}
              style={{ gap: '0.4rem' }}
            >
              <span>{allDone ? 'View Results in Workbench' : 'Skip to Workbench'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
