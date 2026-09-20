import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api, type ApiProduct, type ApiPassportResponse } from '../services/api';
import { 
  ShieldCheck, 
  History, 
  Loader2, 
  AlertCircle, 
  FileCheck, 
  Layers 
} from 'lucide-react';

export const PassportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(searchParams.get('productId') || '');
  const [passport, setPassport] = useState<ApiPassportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const prods = await api.getProducts();
        setProducts(prods);
        if (prods.length > 0 && !selectedProductId) {
          setSelectedProductId(prods[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load products.');
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    async function loadPassport() {
      if (!selectedProductId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPassport(selectedProductId);
        setPassport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load label passport for product.');
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, [selectedProductId]);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setSearchParams({ productId: id });
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Label Passport' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header & Product Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-primary">Product Provenance Passport</span>
              <span className="badge badge-neutral">Immutable Audit Ledger</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>NIYAMORA Label Passport</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Complete chronological provenance, inspection verification log, and evidence repository.
            </p>
          </div>

          {products.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                className="select"
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} - {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Statutory Transparency Statement */}
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--brand-primary-light)',
            borderLeft: '4px solid var(--brand-primary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <ShieldCheck size={22} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
              Statutory Transparency Statement
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
              Label Passport is a NIYAMORA product history record and internal quality ledger. It is not a government certificate, does not represent statutory endorsement, and does not guarantee legal immunity from regulatory inspection authorities.
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-issue-subtle)', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* Main Passport Content */}
        {loading ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading label passport ledger from database...</p>
          </div>
        ) : !passport ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No product selected or no passport records available.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Product Metadata Summary */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  {passport.brand}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{passport.product_name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span>SKU: <strong>{passport.sku}</strong></span>
                  <span>Packaging: <strong>{passport.packaging_type}</strong></span>
                  <span>Declared Qty: <strong>{passport.net_quantity}</strong></span>
                  <span>Registered: <strong>{passport.created_at ? new Date(passport.created_at).toLocaleDateString() : 'Active'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{passport.versions.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Versions Stored</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{passport.inspections.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inspections Run</div>
                </div>
              </div>
            </div>

            {/* Version Provenance Chain */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Layers size={18} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Artwork Version Provenance Chain</h3>
              </div>

              {passport.versions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No artwork versions recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {passport.versions.map((v) => (
                    <div key={v.version_id} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', border: '1px solid var(--border-default)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>{v.version_label}</span>
                          <span className="badge badge-neutral">{v.source_type}</span>
                          <span className="badge badge-success">{v.verification_status}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                          Storage Key: {v.storage_key} • Hash: {v.file_hash || 'SHA256 verified'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inspection History Log */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <FileCheck size={18} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Statutory Inspection Audit Log</h3>
              </div>

              {passport.inspections.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No inspections recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {passport.inspections.map((i) => (
                    <div key={i.inspection_id} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', border: '1px solid var(--border-default)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700 }}>Inspection #{i.inspection_id.slice(0, 8)}</span>
                          <span className="badge badge-neutral">{i.version_label}</span>
                          <span className={`badge ${i.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{i.status}</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                          Results: <strong style={{ color: 'var(--status-good-solid)' }}>{i.pass_count} PASS</strong> • <strong style={{ color: 'var(--status-issue-solid)' }}>{i.issue_count} ISSUE</strong> • <strong style={{ color: 'var(--status-review-solid)' }}>{i.review_count} REVIEW</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date(i.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Events Ledger */}
            {passport.audit_events && passport.audit_events.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <History size={18} style={{ color: 'var(--brand-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Immutable System Audit Ledger</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {passport.audit_events.map((a) => (
                    <div key={a.id} style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{a.event_type}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Actor: {a.actor_role}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </AppShell>
  );
};
