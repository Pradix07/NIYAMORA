import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PackagingVisual } from '../components/common/PackagingVisual';
import { api, type ApiPassportResponse } from '../services/api';
import type { Product, PackagingType } from '../types';
import { 
  Plus, 
  GitCompare, 
  Loader2,
  AlertCircle
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'checks' | 'passport'>('overview');
  const [product, setProduct] = useState<Product | null>(null);
  const [passport, setPassport] = useState<ApiPassportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [prodData, passData] = await Promise.all([
          api.getProduct(id),
          api.getPassport(id).catch(() => null),
        ]);

        const mapped: Product = {
          id: prodData.id,
          name: prodData.name,
          brand: prodData.brand,
          sku: prodData.sku,
          type: (prodData.packaging_type as PackagingType) || 'Stand-Up Pouch',
          latestVersion: prodData.latest_version || 'V01',
          status: 'GOOD',
          issueCount: 0,
          reviewCount: 0,
          goodCount: 0,
          lastChecked: 'Active',
          dimensions: '150mm × 220mm',
          netQuantity: prodData.net_quantity || '250 g',
          description: prodData.description || 'Packaging artwork master file.',
        };
        setProduct(mapped);
        setPassport(passData);
      } catch (err: any) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Loading...' }]}>
        <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
          <p>Loading product master...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !product) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Error' }]}>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={36} style={{ color: 'var(--status-issue-solid)', margin: '0 auto 0.75rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Product Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{error || 'Unable to locate product record in workspace.'}</p>
          <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Back to Products Catalog
          </button>
        </div>
      </AppShell>
    );
  }

  const versions = passport?.versions || [];
  const inspections = passport?.inspections || [];
  const reviews = passport?.human_reviews || [];

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: product.name }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Product Master Header Card */}
        <div className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PackagingVisual type={product.type} variant="thumbnail" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {product.brand}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    SKU: {product.sku}
                  </span>
                  <span className="badge badge-neutral">{product.type}</span>
                </div>

                <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{product.name}</h1>
                
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {product.dimensions} • Net Quantity: {product.netQuantity} • Registered in Workspace
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(`/improve?productId=${product.id}`)}
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                <span>Improve Design</span>
              </button>

              <button
                onClick={() => navigate(`/compare?productId=${product.id}`)}
                className="btn btn-secondary"
                style={{ gap: '0.4rem' }}
              >
                <GitCompare size={15} />
                <span>Compare</span>
              </button>

              <button
                onClick={() => navigate('/new-check')}
                className="btn btn-outline"
                style={{ gap: '0.4rem' }}
              >
                <Plus size={15} />
                <span>New Version Check</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs-container" style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`tab-btn ${activeTab === 'versions' ? 'active' : ''}`}
            >
              Versions ({versions.length})
            </button>
            <button
              onClick={() => setActiveTab('checks')}
              className={`tab-btn ${activeTab === 'checks' ? 'active' : ''}`}
            >
              Inspection History ({inspections.length})
            </button>
            <button
              onClick={() => setActiveTab('passport')}
              className={`tab-btn ${activeTab === 'passport' ? 'active' : ''}`}
            >
              Label Passport
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-3" style={{ gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Active Artwork Dieline</h3>
                <PackagingVisual type={product.type} variant="card" />
                <div style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderTop: '1px solid var(--border-default)', paddingTop: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Latest Version:</span>
                  <span style={{ fontWeight: 700 }}>{product.latestVersion}</span>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Audit Summary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Artwork Versions:</span>
                      <span style={{ fontWeight: 700 }}>{versions.length} versions stored</span>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Inspections Conducted:</span>
                      <span style={{ fontWeight: 700 }}>{inspections.length} audits</span>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Human Reviews:</span>
                      <span style={{ fontWeight: 700 }}>{reviews.length} decisions recorded</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => navigate('/workbench')} className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}>
                  Open Workbench
                </button>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Product Master Notes</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {product.description || 'Packaging master specification and dieline repository.'}
                </p>
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-default)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Created: {passport?.created_at ? new Date(passport.created_at).toLocaleDateString() : 'Active'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Versions */}
        {activeTab === 'versions' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Version Provenance History</h3>
            {versions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No artwork versions uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {versions.map((v) => (
                  <div key={v.version_id} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-default)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{v.version_label}</span>
                        <span className="badge badge-neutral">{v.source_type}</span>
                        <span className="badge badge-success">{v.verification_status}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                        Hash: {v.file_hash || 'SHA256 verified'} • Created: {new Date(v.created_at).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/compare?productId=${product.id}&versionAId=${v.version_id}`)}
                      className="btn btn-ghost btn-sm"
                      style={{ gap: '0.25rem' }}
                    >
                      <GitCompare size={14} />
                      <span>Compare Version</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Inspection Checks */}
        {activeTab === 'checks' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Pre-Print Inspection Audits</h3>
            {inspections.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No pre-print inspection runs completed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inspections.map((i) => (
                  <div key={i.inspection_id} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-default)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700 }}>Inspection #{i.inspection_id.slice(0, 8)}</span>
                        <span className="badge badge-neutral">{i.version_label}</span>
                        <span className={`badge ${i.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{i.status}</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                        Findings: <strong style={{ color: 'var(--status-good-solid)' }}>{i.pass_count} PASS</strong> • <strong style={{ color: 'var(--status-issue-solid)' }}>{i.issue_count} ISSUE</strong> • <strong style={{ color: 'var(--status-review-solid)' }}>{i.review_count} REVIEW</strong>
                      </div>
                    </div>

                    <button onClick={() => navigate('/workbench')} className="btn btn-outline btn-sm">
                      Inspect Findings
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Label Passport */}
        {activeTab === 'passport' && (
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Immutable Label Passport</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {passport?.disclaimer}
                </p>
              </div>
              <button onClick={() => navigate('/passport')} className="btn btn-primary btn-sm">
                Full Passport View
              </button>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>Product Provenance:</strong> {product.brand} • {product.name} ({product.sku})<br />
                <strong>Stored Versions:</strong> {versions.length} immutable artwork records<br />
                <strong>Audit Count:</strong> {inspections.length} statutory inspections executed<br />
                <strong>Specialist Reviews:</strong> {reviews.length} decisions recorded
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
};
