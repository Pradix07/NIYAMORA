import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PackagingVisual } from '../components/common/PackagingVisual';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  SAMPLE_PRODUCTS, 
  SAMPLE_VERSIONS, 
  SAMPLE_FINDINGS, 
  SAMPLE_REPORTS 
} from '../data/mockData';
import { api } from '../services/api';
import type { Product, PackagingType } from '../types';
import { 
  Plus, 
  GitCompare, 
  Download 
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'checks' | 'findings' | 'reports' | 'passport'>('overview');

  const fallbackProduct = SAMPLE_PRODUCTS.find((p) => p.id === id) || SAMPLE_PRODUCTS[0];
  const [product, setProduct] = useState<Product>(fallbackProduct);

  useEffect(() => {
    if (id) {
      api.getProduct(id)
        .then((p) => {
          setProduct({
            id: p.id,
            name: p.name,
            brand: p.brand,
            sku: p.sku,
            type: (p.packaging_type as PackagingType) || 'Stand-Up Pouch',
            latestVersion: p.latest_version || 'V01',
            status: 'GOOD',
            issueCount: 0,
            reviewCount: 0,
            goodCount: 0,
            lastChecked: 'Active',
            dimensions: '150mm × 220mm',
            netQuantity: p.net_quantity || '250 g',
            description: p.description || 'Packaging artwork master file.',
          });
        })
        .catch((err) => {
          console.warn('Could not fetch live product detail, using fallback:', err);
        });
    }
  }, [id]);

  const versions = SAMPLE_VERSIONS.filter((v) => v.productId === fallbackProduct.id);
  const findings = SAMPLE_FINDINGS.filter((f) => f.productId === fallbackProduct.id);
  const reports = SAMPLE_REPORTS.filter((r) => r.productId === fallbackProduct.id);

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: product.name }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Product Master Header Card */}
        <div className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* Packaging Thumbnail */}
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
                  {product.dimensions} • Net Declared: {product.netQuantity} • License: {product.licenseNumber || '10020011002345'}
                </p>
              </div>
            </div>

            {/* Status Badge & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <StatusBadge status={product.status} size="lg" />
              
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
                <span>New Version</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs for Product Master */}
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
              Versions ({versions.length || 3})
            </button>
            <button
              onClick={() => setActiveTab('checks')}
              className={`tab-btn ${activeTab === 'checks' ? 'active' : ''}`}
            >
              Pre-Print Checks
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
            >
              Declarations & Extracted Data
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            >
              Reports ({reports.length || 3})
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
              {/* Packaging Inspection Snapshot */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Active Artwork Render ({product.latestVersion})</h3>
                <PackagingVisual type={product.type} variant="card" showEvidenceMarker={product.status === 'ISSUE'} />
                <div style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderTop: '1px solid var(--border-default)', paddingTop: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Latest Version:</span>
                  <span style={{ fontWeight: 700 }}>{product.latestVersion} (Pre-Print Screened)</span>
                </div>
              </div>

              {/* Compliance Status Breakdown */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Compliance Summary</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-issue-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-issue-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--status-issue-text)' }}>Critical Issues:</span>
                      <span style={{ fontWeight: 800, color: 'var(--status-issue-text)' }}>{product.issueCount}</span>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-review-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-review-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--status-review-text)' }}>Pending Reviews:</span>
                      <span style={{ fontWeight: 800, color: 'var(--status-review-text)' }}>{product.reviewCount}</span>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-good-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-good-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--status-good-text)' }}>Passed Declarations:</span>
                      <span style={{ fontWeight: 800, color: 'var(--status-good-text)' }}>{product.goodCount}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => navigate('/workbench')} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    Open Workbench
                  </button>
                  <button onClick={() => navigate('/improve')} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    Improve Design
                  </button>
                </div>
              </div>

              {/* Master Product Metadata */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Product Master Specs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Format Substrate:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{product.type} (High-Barrier Kraft)</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Dieline Size:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{product.dimensions}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Declared Net Weight:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{product.netQuantity}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mandatory License:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{product.licenseNumber || '10020011002345'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Versions */}
        {activeTab === 'versions' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Artwork Version History</h3>
              <button onClick={() => navigate('/compare')} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <GitCompare size={14} /> Compare V01 vs V02
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {versions.map((v) => (
                <div key={v.id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {v.versionLabel}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Artwork Revision {v.versionLabel}</span>
                        <StatusBadge status={v.status} size="sm" />
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Uploaded by {v.uploader} • {v.createdAt} • {v.fileSize}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {v.notes}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => navigate('/workbench')} className="btn btn-secondary btn-sm">
                      Inspect
                    </button>
                    <button onClick={() => navigate('/compare')} className="btn btn-outline btn-sm">
                      Compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Checks */}
        {activeTab === 'checks' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Pre-Print Screening Checks</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Execution records for all automated and specialist verification runs on this product master.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block' }}>Pre-Flight Check #0892 (V02 Artwork)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Executed on 2026-09-18 14:32 • 7 statutory rules screened</span>
                </div>
                <StatusBadge status="ISSUE" label="1 Issue" />
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block' }}>Pre-Flight Check #0841 (V01 Artwork)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Executed on 2026-09-10 10:14 • 7 statutory rules screened</span>
                </div>
                <StatusBadge status="ISSUE" label="3 Issues" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Findings */}
        {activeTab === 'findings' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Evaluated Declarations & Evidence</h3>
              <button onClick={() => navigate('/workbench')} className="btn btn-primary btn-sm">
                Open Full Workbench
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {findings.map((f) => (
                <div key={f.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <StatusBadge status={f.status} size="sm" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{f.ruleName}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{f.ruleCode}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{f.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Reports */}
        {activeTab === 'reports' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Compliance & Audit PDF Exports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reports.map((rep) => (
                <div key={rep.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block' }}>{rep.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rep.type} • {rep.date} • {rep.fileSize}</span>
                  </div>
                  <button onClick={() => alert(`Sample download for: ${rep.title}`)} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Label Passport */}
        {activeTab === 'passport' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
              <div>
                <span className="badge badge-sample" style={{ marginBottom: '0.35rem' }}>Product Master History Ledger</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>NIYAMORA Label Passport</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>INTEGRITY SEAL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  SHA256: 8f4a9b...e21c
                </span>
              </div>
            </div>

            <div style={{ padding: '0.875rem 1.125rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', borderLeft: '4px solid var(--brand-primary)' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>Notice:</strong> Label Passport is a NIYAMORA product history record. It is not a government certificate and does not guarantee legal compliance.
              </p>
            </div>

            <div className="grid-2" style={{ gap: '1.5rem', fontSize: '0.8125rem' }}>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Product Master Metadata</h4>
                <p><strong>Name:</strong> {product.name}</p>
                <p><strong>SKU:</strong> {product.sku}</p>
                <p><strong>Packaging Type:</strong> {product.type}</p>
                <p><strong>Registered Net Quantity:</strong> {product.netQuantity}</p>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Audit Timeline Summary</h4>
                <p><strong>Total Versions:</strong> 3 Revisions (V01, V02, V03)</p>
                <p><strong>Total Screenings:</strong> 2 Automated Inspections</p>
                <p><strong>Human Reviews Resolved:</strong> 1 Specialist Sign-off</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
};
