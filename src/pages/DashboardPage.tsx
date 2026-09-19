import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { ProductCard } from '../components/products/ProductCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  SAMPLE_PRODUCTS, 
  SAMPLE_REVIEWS, 
  SAMPLE_ACTIVITIES, 
  SAMPLE_FINDINGS 
} from '../data/mockData';
import { 
  PlusCircle, 
  ArrowRight, 
  Clock, 
  ChevronRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalProducts = SAMPLE_PRODUCTS.length;
  const issueProducts = SAMPLE_PRODUCTS.filter((p) => p.status === 'ISSUE');
  const reviewCount = SAMPLE_REVIEWS.filter((r) => r.status === 'PENDING').length;

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Top Attention Banner & Greeting */}
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
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Workspace Overview</span>
              <span className="badge badge-sample">Demo Data Active</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Good afternoon, {user ? user.name.split(' ')[0] : 'Devin'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              You have <strong style={{ color: 'var(--status-issue-solid)' }}>{issueProducts.length} packaging artworks</strong> requiring pre-print adjustment and <strong style={{ color: 'var(--status-review-solid)' }}>{reviewCount} items</strong> awaiting specialist review.
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

        {/* Attention Summary Action Bar: What needs my attention right now? */}
        <div className="grid-3" style={{ gap: '1.25rem' }}>
          
          {/* Action 1: Pre-Print Violations */}
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
                  Critical Pre-Print Violations
                </span>
                <span className="badge badge-issue">{issueProducts.length} Artwork{issueProducts.length > 1 ? 's' : ''}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Organic Chia Crunch Pouch
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Net Quantity font is 2.8mm (statutory requirement is 4.0mm).
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              <span>Open in Inspection Workbench</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Action 2: Human Review Queue */}
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
                  Pending Human Review
                </span>
                <span className="badge badge-review">{reviewCount} Pending</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                FSSAI Logo & Digits Contrast
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Low contrast (3.8:1) against raw kraft texture requires packaging sign-off.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              <span>Review in Review Center</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Action 3: Suggested Fix Ready */}
          <div 
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid var(--brand-primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/improve')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  NIYAMORA Suggested Design
                </span>
                <span className="badge badge-good">Ready to Download</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                V02 Suggested Fix
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Automatic 4.1mm numeral rescaling prepared with vector layout alignment.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              <span>Compare Original vs Suggested</span>
              <ArrowRight size={13} />
            </div>
          </div>

        </div>

        {/* Recent Packaging Products Section (Visual Product Cards) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Packaging Products</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Active product masters and latest screened packaging artwork versions
              </p>
            </div>
            <Link to="/products" className="btn btn-ghost btn-sm" style={{ gap: '0.35rem' }}>
              <span>View All ({totalProducts})</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid-3" style={{ gap: '1.25rem' }}>
            {SAMPLE_PRODUCTS.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Bottom Split: Recent Checks & Activity Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
          {/* Left: Open Inspection Findings Table */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Active Artwork Findings</h3>
              <Link to="/workbench" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                Open Workbench →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SAMPLE_FINDINGS.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  onClick={() => navigate('/workbench')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={f.status} size="sm" />
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                        {f.ruleName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {f.category} • {f.ruleCode}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {f.status === 'GOOD' ? 'Pass' : 'Action Required'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Recent Audit & Workflow Activity Feed */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Activity</h3>
              <Clock size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {SAMPLE_ACTIVITIES.map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)', marginTop: '5px', flexShrink: 0 }} />
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.3 }}>
                      {act.action}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {act.productName} ({act.version}) • {act.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
