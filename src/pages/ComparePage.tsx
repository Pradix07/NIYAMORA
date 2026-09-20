import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';
import type { ApiComparisonResult, ApiProduct } from '../services/api';
import { SAMPLE_COMPARISON, SAMPLE_PRODUCTS } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { ArrowRight, Sparkles } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('productId');

  const [loading, setLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [comparison, setComparison] = useState<ApiComparisonResult | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fallbackProduct = SAMPLE_PRODUCTS[0];
  const fallbackComparison = SAMPLE_COMPARISON;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let currentProduct: ApiProduct | null = null;
        if (queryProductId) {
          currentProduct = await api.getProduct(queryProductId).catch(() => null);
        }

        if (!currentProduct) {
          const products = await api.getProducts().catch(() => []);
          if (products.length > 0) {
            currentProduct = products[0];
          }
        }

        setProduct(currentProduct);

        if (currentProduct) {
          const compData = await api.compareVersions(currentProduct.id).catch(() => null);
          if (compData) {
            setComparison(compData);
          }
        }
      } catch (err) {
        console.warn('Failed to load live comparison data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryProductId]);

  const activeComparison = comparison || {
    product_id: fallbackProduct.id,
    product_name: fallbackProduct.name,
    version_a_id: 'v1',
    version_b_id: 'v2',
    version_a_label: fallbackComparison.versionA,
    version_b_label: fallbackComparison.versionB,
    fixed_count: fallbackComparison.fixedCount,
    improved_count: fallbackComparison.improvedCount,
    unchanged_count: fallbackComparison.unchangedCount,
    new_issue_count: fallbackComparison.newIssueCount,
    review_count: 0,
    details: fallbackComparison.details.map((d) => ({
      category: d.category,
      field: d.field,
      status_a: d.statusA,
      status_b: d.statusB,
      change_type: d.changeType,
      detail: d.detail,
      rule_code: 'LMPC-RULE',
    })),
  };

  const filteredDetails = activeComparison.details.filter((d) => {
    if (filterType === 'ALL') return true;
    return d.change_type.toLowerCase() === filterType.toLowerCase();
  });

  const productName = product?.name || fallbackProduct.name;
  const prodId = product?.id || fallbackProduct.id;

  if (loading && !comparison && !product) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Compare' }]}>
        <div style={{ maxWidth: '1400px', margin: '4rem auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading artwork comparison diff...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: productName, path: `/products/${prodId}` }, { label: 'Compare' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-sample">Compliance-Aware Diff Engine</span>
              <span className="badge badge-neutral">Pre-Press Proofing</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Artwork Comparison ({activeComparison.version_a_label} vs {activeComparison.version_b_label})
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tracking layout and statutory compliance changes for <strong>{productName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate(`/improve?productId=${prodId}`)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Sparkles size={15} />
              <span>Improve Design</span>
            </button>
            <button onClick={() => navigate(`/regression?productId=${prodId}`)} className="btn btn-secondary" style={{ gap: '0.35rem' }}>
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
              {activeComparison.fixed_count}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Statutory violations resolved</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Improved Elements</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '0.25rem' }}>
              {activeComparison.improved_count}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contrast & sizing enhancements</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--border-strong)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Unchanged</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {activeComparison.unchanged_count}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Compliant declarations preserved</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-issue-solid)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>New Issues</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-issue-text)', marginTop: '0.25rem' }}>
              {activeComparison.new_issue_count}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {activeComparison.new_issue_count === 0 ? 'Zero regression defects' : 'Regressions detected'}
            </span>
          </div>
        </div>

        {/* Visual Side-by-Side Canvas Diff */}
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {/* Left: Version A */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{activeComparison.version_a_label} (Baseline Design)</span>
              <span className="badge badge-issue">{activeComparison.fixed_count + activeComparison.new_issue_count} Findings</span>
            </div>
            <div style={{ minHeight: '360px', backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
              {activeComparison.version_a_preview_url ? (
                <img
                  src={api.getFileUrl(activeComparison.version_a_preview_url)}
                  alt={activeComparison.version_a_label}
                  style={{ maxHeight: '320px', objectFit: 'contain', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ width: '220px', height: '300px', backgroundColor: '#CBB593', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.9 }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#333' }}>{product?.brand || 'AURA'}</span>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111' }}>{productName}</h4>
                  </div>
                  <div style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '4px', border: '1.5px dashed var(--status-issue-solid)' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--status-issue-text)', fontWeight: 700 }}>{activeComparison.version_a_label} Master</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Version B */}
          <div className="card" style={{ overflow: 'hidden', border: '2px solid var(--brand-primary)' }}>
            <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--brand-primary-light)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-primary)' }}>{activeComparison.version_b_label} (Suggested / New Design)</span>
              <span className="badge badge-fixed">{activeComparison.fixed_count} Fixed Declarations</span>
            </div>
            <div style={{ minHeight: '360px', backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
              {activeComparison.version_b_preview_url ? (
                <img
                  src={api.getFileUrl(activeComparison.version_b_preview_url)}
                  alt={activeComparison.version_b_label}
                  style={{ maxHeight: '320px', objectFit: 'contain', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ width: '220px', height: '300px', backgroundColor: '#CBB593', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#333' }}>{product?.brand || 'AURA'}</span>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111' }}>{productName}</h4>
                  </div>
                  <div style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '4px', border: '1.5px solid var(--status-good-solid)' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--status-good-text)', fontWeight: 700 }}>✓ {activeComparison.version_b_label} Compliant Layout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Compliance Diff Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Compliance Changes Log</h3>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button onClick={() => setFilterType('ALL')} className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}>
                All ({activeComparison.details.length})
              </button>
              <button onClick={() => setFilterType('Fixed')} className={`btn btn-sm ${filterType === 'Fixed' ? 'btn-primary' : 'btn-secondary'}`}>
                Fixed ({activeComparison.fixed_count})
              </button>
              <button onClick={() => setFilterType('Improved')} className={`btn btn-sm ${filterType === 'Improved' ? 'btn-primary' : 'btn-secondary'}`}>
                Improved ({activeComparison.improved_count})
              </button>
              <button onClick={() => setFilterType('Unchanged')} className={`btn btn-sm ${filterType === 'Unchanged' ? 'btn-primary' : 'btn-secondary'}`}>
                Unchanged ({activeComparison.unchanged_count})
              </button>
              {activeComparison.new_issue_count > 0 && (
                <button onClick={() => setFilterType('New Issue')} className={`btn btn-sm ${filterType === 'New Issue' ? 'btn-danger' : 'btn-secondary'}`}>
                  New Issues ({activeComparison.new_issue_count})
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredDetails.map((det, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <StatusBadge
                      status={det.change_type === 'Fixed' ? 'FIXED' : det.change_type === 'Improved' ? 'GOOD' : det.change_type === 'New Issue' ? 'ISSUE' : 'GOOD'}
                      label={det.change_type}
                      size="sm"
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{det.field}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({det.category})</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{det.detail}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {activeComparison.version_a_label}: <strong>{det.status_a}</strong>
                  </span>
                  <span>→</span>
                  <span style={{ color: det.status_b === 'PASS' ? 'var(--status-good-text)' : 'var(--status-issue-text)', fontWeight: 700 }}>
                    {activeComparison.version_b_label}: <strong>{det.status_b}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
};
