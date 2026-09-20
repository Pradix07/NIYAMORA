import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { ProductCard } from '../components/products/ProductCard';
import { api, type ApiProduct, type ApiInspection } from '../services/api';
import type { Product, PackagingType } from '../types';
import { 
  PlusCircle, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Loader2,
  Package
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [inspections, setInspections] = useState<ApiInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [apiProds, apiInsps] = await Promise.all([
          api.getProducts().catch(() => []),
          api.getInspections().catch(() => []),
        ]);

        const mappedProds: Product[] = apiProds.map((p: ApiProduct) => ({
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
        }));

        setProducts(mappedProds);
        setInspections(apiInsps);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to backend service.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalInspections = inspections.length;
  const completedInspections = inspections.filter((i) => i.status === 'COMPLETED').length;
  const issueCount = inspections.reduce((acc, i) => acc + (i.findings_summary?.issue_count || 0), 0);
  const reviewCount = inspections.reduce((acc, i) => acc + (i.findings_summary?.review_count || 0), 0);

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Top Greeting Banner */}
        <div
          className="card-tactile"
          style={{
            padding: '1.75rem',
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-subtle) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Workspace: {user?.company || 'Primary Tenancy'}</span>
              <span className="badge badge-success">Production Engine Active</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Welcome back, {user ? user.name.split(' ')[0] : 'Operator'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Packaging Compliance Before Print • <strong>{products.length} registered products</strong> across <strong>{totalInspections} inspection audits</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/new-check')}
              className="btn btn-primary btn-lg"
              style={{ gap: '0.5rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
            >
              <PlusCircle size={18} />
              <span>New Artwork Check</span>
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-issue-subtle)', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* Factual Metric Cards */}
        <div className="grid-3" style={{ gap: '1.25rem' }}>
          <div 
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid var(--status-issue-solid)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/workbench')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-issue-text)', textTransform: 'uppercase' }}>
                  Statutory Non-Compliances
                </span>
                <AlertTriangle size={16} style={{ color: 'var(--status-issue-solid)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--status-issue-text)' }}>
                {loading ? '...' : issueCount}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Total statutory findings requiring dieline re-formatting.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: '1rem' }}>
              <span>Inspect in Workbench</span>
              <ChevronRight size={14} />
            </div>
          </div>

          <div 
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid var(--status-review-solid)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/review')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-review-text)', textTransform: 'uppercase' }}>
                  Review Queue
                </span>
                <Clock size={16} style={{ color: 'var(--status-review-solid)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--status-review-text)' }}>
                {loading ? '...' : reviewCount}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Declarations flagged for human specialist verification.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: '1rem' }}>
              <span>Open Review Center</span>
              <ChevronRight size={14} />
            </div>
          </div>

          <div 
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid var(--status-good-solid)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/products')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-good-text)', textTransform: 'uppercase' }}>
                  Completed Audits
                </span>
                <FileCheck size={16} style={{ color: 'var(--status-good-solid)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--status-good-text)' }}>
                {loading ? '...' : completedInspections}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Artworks evaluated deterministically under Phase 3 rules.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: '1rem' }}>
              <span>View Product Catalog</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Recent Products Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Company Packaging Catalog</h2>
            <Link to="/products" className="btn btn-ghost btn-sm" style={{ gap: '0.25rem' }}>
              <span>View All ({products.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
              <p>Loading company products and inspections...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No packaging products registered yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '400px', margin: '0.25rem auto 1.25rem auto' }}>
                Register your first SKU to run pre-press compliance checks, suggested designs, and regression verification.
              </p>
              <button onClick={() => navigate('/products')} className="btn btn-primary">
                Register Product
              </button>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: '1.25rem' }}>
              {products.slice(0, 6).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
};
