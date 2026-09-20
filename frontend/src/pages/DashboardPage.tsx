import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { ProductCard } from '../components/products/ProductCard';
import { api, type ApiProduct, type ApiInspection } from '../services/api';
import type { Product, PackagingType } from '../types';
import pouch3D from '../assets/pouch_3d.jpg';
import {
  PlusCircle,
  ArrowRight,
  Clock,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Loader2,
  Package,
  Sliders,
  Boxes
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

  const getGreeting = () => {
    if (!user) return 'Welcome to NIYAMURA';
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${timeGreeting}, ${user.name.split(' ')[0]}`;
  };

  const isNewWorkspace = !loading && products.length === 0 && totalInspections === 0;

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Greeting Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem 2.25rem',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '2rem',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {user?.company || 'Packaging Workspace'}
              </span>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              {isNewWorkspace ? 'Welcome to NIYAMURA' : getGreeting()}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '560px', marginBottom: '1.5rem' }}>
              {isNewWorkspace
                ? 'Start your first packaging compliance check to begin building your workspace.'
                : `Screen packaging artwork against Legal Metrology PCR 2011 and FSSAI 2020 rules before plate making. Currently monitoring ${products.length} registered products across ${totalInspections} audits.`}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/new-check')}
                className="btn btn-primary btn-lg"
                style={{ gap: '0.5rem' }}
              >
                <PlusCircle size={18} />
                <span>Start a Check</span>
              </button>

              <button
                onClick={() => navigate('/simulator')}
                className="btn btn-secondary btn-lg"
                style={{ gap: '0.5rem' }}
              >
                <Sliders size={18} />
                <span>Rule Simulator</span>
              </button>
            </div>
          </div>

          {/* Right: 3D Packaging Hero Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '360px',
                height: '180px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <img src={pouch3D} alt="Packaging Artwork Inspection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.85) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '1rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>Pre-Print Compliance Screening</span>
                  <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.75)' }}>Legal Metrology & FSSAI Declarations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-issue-bg)', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* Workspace Summary Cards */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Workspace Overview</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Key statutory findings, review items, and verified audit counts.</p>
          </div>

          <div className="grid-4" style={{ gap: '1.25rem' }}>
            {/* Products Card */}
            <div 
              className="glass-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/products')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Products
                  </span>
                  <Boxes size={17} style={{ color: 'var(--brand-primary)' }} />
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {loading ? '...' : products.length}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  Registered packaging SKUs in workspace.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 700, marginTop: '1.25rem' }}>
                <span>View Products</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Completed Audits */}
            <div 
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderLeft: '4px solid var(--status-good-solid)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/products')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--status-good-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Completed Audits
                  </span>
                  <FileCheck size={17} style={{ color: 'var(--status-good-solid)' }} />
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--status-good-text)', fontFamily: 'var(--font-heading)' }}>
                  {loading ? '...' : completedInspections}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  Artworks evaluated deterministically.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 700, marginTop: '1.25rem' }}>
                <span>View History</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Statutory Issues */}
            <div 
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderLeft: '4px solid var(--status-issue-solid)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/workbench')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--status-issue-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Statutory Issues
                  </span>
                  <AlertTriangle size={17} style={{ color: 'var(--status-issue-solid)' }} />
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--status-issue-text)', fontFamily: 'var(--font-heading)' }}>
                  {loading ? '...' : issueCount}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  Non-compliant values requiring re-formatting.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 700, marginTop: '1.25rem' }}>
                <span>Inspect Issues</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Review Queue */}
            <div 
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderLeft: '4px solid var(--status-review-solid)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/review')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--status-review-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Review Queue
                  </span>
                  <Clock size={17} style={{ color: 'var(--status-review-solid)' }} />
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--status-review-text)', fontFamily: 'var(--font-heading)' }}>
                  {loading ? '...' : reviewCount}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  Items flagged for specialist confirmation.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 700, marginTop: '1.25rem' }}>
                <span>Review Center</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Company Products Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Registered Packaging Products</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select a product SKU to view versions, dielines, and inspection history.</p>
            </div>
            {products.length > 0 && (
              <Link to="/products" className="btn btn-secondary btn-sm" style={{ gap: '0.25rem' }}>
                <span>View All ({products.length})</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--brand-primary)' }} />
              <p style={{ fontWeight: 600 }}>Loading company products and inspections...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <Package size={44} style={{ color: 'var(--brand-primary)', margin: '0 auto 1rem auto', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>No packaging products registered yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                Start your first packaging compliance check to begin building your workspace.
              </p>
              <button onClick={() => navigate('/new-check')} className="btn btn-primary" style={{ gap: '0.4rem', margin: '0 auto' }}>
                <PlusCircle size={16} />
                <span>Start a Check</span>
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

export default DashboardPage;
