import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { SAMPLE_VERSIONS, SAMPLE_PRODUCTS } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { GitCompare, Plus, ArrowRight, Clock, User, HardDrive } from 'lucide-react';

export const VersionsPage: React.FC = () => {
  const navigate = useNavigate();
  const product = SAMPLE_PRODUCTS[0];

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: product.name, path: `/products/${product.id}` }, { label: 'Versions' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-sample" style={{ marginBottom: '0.35rem' }}>Version Control Ledger</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Artwork Version History</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tracking chronological pre-press artwork revisions for <strong>{product.name}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/compare')} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
              <GitCompare size={15} />
              <span>Compare Versions</span>
            </button>

            <button onClick={() => navigate('/new-check')} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Plus size={15} />
              <span>Upload New Version</span>
            </button>
          </div>
        </div>

        {/* Timeline Version Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {SAMPLE_VERSIONS.map((v, index) => (
            <div key={v.id} className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  {/* Version Tag */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--brand-primary-light)',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    {v.versionLabel.split(' ')[0]}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Revision {v.versionLabel}</h3>
                      <StatusBadge status={v.status} />
                      {index === 0 && <span className="badge badge-neutral">Active Production Target</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {v.createdAt}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={12} /> {v.uploader}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <HardDrive size={12} /> {v.fileSize} • {v.dimensions}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {v.notes}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => navigate('/workbench')} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                    <span>Inspect</span>
                    <ArrowRight size={13} />
                  </button>

                  <button onClick={() => navigate('/compare')} className="btn btn-outline btn-sm" style={{ gap: '0.35rem' }}>
                    <GitCompare size={13} />
                    <span>Compare</span>
                  </button>
                </div>
              </div>

              {/* Finding Counters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--status-issue-text)', fontWeight: 600 }}>
                  ● {v.issueCount} Issue{v.issueCount !== 1 ? 's' : ''}
                </span>
                <span style={{ color: 'var(--status-review-text)', fontWeight: 600 }}>
                  ● {v.reviewCount} Review{v.reviewCount !== 1 ? 's' : ''}
                </span>
                <span style={{ color: 'var(--status-good-text)', fontWeight: 600 }}>
                  ● {v.goodCount} Passed
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
};
