import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { SAMPLE_COMPARISON, SAMPLE_PRODUCTS } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { ArrowRight } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const comparison = SAMPLE_COMPARISON;
  const product = SAMPLE_PRODUCTS[0];

  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredDetails = comparison.details.filter((d) => {
    if (filterType === 'ALL') return true;
    return d.changeType === filterType;
  });

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: product.name, path: `/products/${product.id}` }, { label: 'Compare' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-sample" style={{ marginBottom: '0.35rem' }}>Version Diff Engine</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Artwork Comparison (V01 vs V02)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tracking layout and statutory compliance changes between <strong>{comparison.versionA}</strong> and <strong>{comparison.versionB}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/regression')} className="btn btn-secondary" style={{ gap: '0.35rem' }}>
              <span>View Regression Analysis</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Change Statistics Summary Bar */}
        <div className="grid-4" style={{ gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-good-solid)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Fixed Issues</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-good-text)', marginTop: '0.25rem' }}>
              {comparison.fixedCount}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Violations resolved</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Improved Elements</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '0.25rem' }}>
              {comparison.improvedCount}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contrast & legibility boosts</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--border-strong)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Unchanged</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {comparison.unchangedCount}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Compliant declarations preserved</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-issue-solid)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>New Issues</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-issue-text)', marginTop: '0.25rem' }}>
              {comparison.newIssueCount}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Regression defects introduced</span>
          </div>
        </div>

        {/* Visual Side-by-Side Canvas Diff */}
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {/* Left: V01 */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{comparison.versionA}</span>
              <span className="badge badge-issue">3 Violations</span>
            </div>
            <div style={{ minHeight: '340px', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
              <div style={{ width: '220px', height: '300px', backgroundColor: '#CBB593', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.9 }}>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#333' }}>AURA BOTANICALS</span>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111' }}>ORGANIC CHIA CRUNCH</h4>
                </div>
                <div style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '4px', border: '1.5px dashed var(--status-issue-solid)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--status-issue-text)', fontWeight: 700 }}>V01 Layout (Missing MRP / g)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: V02 */}
          <div className="card" style={{ overflow: 'hidden', border: '2px solid var(--brand-primary)' }}>
            <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--brand-primary-light)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-primary)' }}>{comparison.versionB}</span>
              <span className="badge badge-fixed">2 Fixed Elements</span>
            </div>
            <div style={{ minHeight: '340px', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
              <div style={{ width: '220px', height: '300px', backgroundColor: '#CBB593', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#333' }}>AURA BOTANICALS</span>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111' }}>ORGANIC CHIA CRUNCH</h4>
                </div>
                <div style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '4px', border: '1.5px solid var(--status-good-solid)' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--status-good-text)', fontWeight: 700 }}>✓ V02 Layout (Unit Price Added)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Compliance Diff Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Compliance Changes Log</h3>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button onClick={() => setFilterType('ALL')} className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}>
                All ({comparison.details.length})
              </button>
              <button onClick={() => setFilterType('Fixed')} className={`btn btn-sm ${filterType === 'Fixed' ? 'btn-primary' : 'btn-secondary'}`}>
                Fixed
              </button>
              <button onClick={() => setFilterType('Improved')} className={`btn btn-sm ${filterType === 'Improved' ? 'btn-primary' : 'btn-secondary'}`}>
                Improved
              </button>
              <button onClick={() => setFilterType('Unchanged')} className={`btn btn-sm ${filterType === 'Unchanged' ? 'btn-primary' : 'btn-secondary'}`}>
                Unchanged
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredDetails.map((det, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <StatusBadge status={det.changeType === 'Fixed' ? 'FIXED' : det.changeType === 'Improved' ? 'GOOD' : 'GOOD'} label={det.changeType} size="sm" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{det.field}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({det.category})</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{det.detail}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>V01: <strong>{det.statusA}</strong></span>
                  <span>→</span>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>V02: <strong>{det.statusB}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
};
