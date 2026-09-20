import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { StatusBadge } from '../components/common/StatusBadge';
import { GitCompare, Plus, ArrowRight, Clock, User, HardDrive, Sparkles, TrendingDown, Loader2, AlertCircle, FileCheck } from 'lucide-react';
import { api, type ApiProduct, type ApiPassportVersion } from '../services/api';

export const VersionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('productId');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [versions, setVersions] = useState<ApiPassportVersion[]>([]);

  useEffect(() => {
    async function loadVersionsData() {
      setLoading(true);
      setError(null);
      try {
        let currentProduct: ApiProduct | null = null;
        if (queryProductId) {
          currentProduct = await api.getProduct(queryProductId).catch(() => null);
        }

        if (!currentProduct) {
          const prods = await api.getProducts().catch(() => []);
          if (prods.length > 0) {
            currentProduct = prods[0];
          }
        }

        setProduct(currentProduct);

        if (currentProduct) {
          const passportData = await api.getPassport(currentProduct.id).catch(() => null);
          if (passportData && passportData.versions) {
            setVersions(passportData.versions);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load version history.');
      } finally {
        setLoading(false);
      }
    }

    loadVersionsData();
  }, [queryProductId]);

  const productName = product?.name || 'Packaging Artwork';
  const prodId = product?.id || '';

  if (loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Versions' }]}>
        <div style={{ maxWidth: '1200px', margin: '4rem auto', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading version history ledger...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: productName, path: prodId ? `/products/${prodId}` : '/products' }, { label: 'Versions' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-sample" style={{ marginBottom: '0.35rem' }}>Version Control Ledger</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Artwork Version History</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tracking chronological pre-press artwork revisions for <strong>{productName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {prodId && (
              <>
                <button onClick={() => navigate(`/improve?productId=${prodId}`)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                  <Sparkles size={15} />
                  <span>Improve Design</span>
                </button>

                <button onClick={() => navigate(`/compare?productId=${prodId}`)} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
                  <GitCompare size={15} />
                  <span>Compare Versions</span>
                </button>

                <button onClick={() => navigate(`/regression?productId=${prodId}`)} className="btn btn-outline" style={{ gap: '0.4rem' }}>
                  <TrendingDown size={15} />
                  <span>Regression</span>
                </button>
              </>
            )}

            <button onClick={() => navigate('/new-check')} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
              <Plus size={15} />
              <span>Upload New Version</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* Timeline Version Cards */}
        {versions.length === 0 ? (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <FileCheck size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Versions Recorded</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Upload your initial packaging artwork to begin tracking version revisions and statutory compliance.
            </p>
            <button onClick={() => navigate('/new-check')} className="btn btn-primary" style={{ margin: '0 auto' }}>
              Upload Initial Artwork
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {versions.map((v, index) => (
              <div key={v.version_id} className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
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
                      {v.version_label}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Revision {v.version_label}</h3>
                        <StatusBadge status={v.verification_status === 'VERIFIED' ? 'GOOD' : v.verification_status === 'FAILED' ? 'ISSUE' : 'REVIEW'} />
                        {index === 0 && <span className="badge badge-neutral">Active Revision</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {new Date(v.created_at).toLocaleString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User size={12} /> Pre-Press System
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <HardDrive size={12} /> {v.storage_key || 'Artwork Master'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        Artwork revision {v.version_label} ingested for statutory packaging compliance ({v.source_type}).
                      </p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => navigate(`/workbench?productId=${prodId}`)} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                      <span>Inspect</span>
                      <ArrowRight size={13} />
                    </button>

                    <button onClick={() => navigate(`/compare?productId=${prodId}`)} className="btn btn-outline btn-sm" style={{ gap: '0.35rem' }}>
                      <GitCompare size={13} />
                      <span>Compare</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
};
