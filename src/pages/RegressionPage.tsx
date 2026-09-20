import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../services/api';
import type { ApiRegressionResult, ApiProduct, ApiRegressionItem } from '../services/api';
import { 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const RegressionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('productId');

  const [loading, setLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [regression, setRegression] = useState<ApiRegressionResult | null>(null);

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
          const regData = await api.getRegression(currentProduct.id).catch(() => null);
          if (regData) {
            setRegression(regData);
          }
        }
      } catch (err) {
        console.warn('Failed to load regression data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryProductId]);

  const productName = product?.name || 'Packaging Artwork';
  const prodId = product?.id || '';

  if (loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Compliance Regression' }]}>
        <div style={{ maxWidth: '1200px', margin: '4rem auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing compliance regression history...</p>
        </div>
      </AppShell>
    );
  }

  if (!regression) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: productName, path: prodId ? `/products/${prodId}` : '/products' }, { label: 'Compliance Regression' }]}>
        <div style={{ maxWidth: '900px', margin: '3rem auto' }}>
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <TrendingDown size={24} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Two Artwork Revisions Required for Regression Analysis</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
              Regression analysis verifies that pre-press changes in revision V02 resolved statutory defects without accidentally re-introducing new non-compliance issues.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              {prodId && (
                <button onClick={() => navigate(`/improve?productId=${prodId}`)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                  <Sparkles size={16} /> Open Improve Design (Generate V02)
                </button>
              )}
              <button onClick={() => navigate('/new-check')} className="btn btn-secondary">
                Upload New Artwork
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const activeRegression = regression;

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: productName, path: `/products/${prodId}` }, { label: 'Compliance Regression' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-sample">Regression Check</span>
              <span className={`badge ${activeRegression.regression_detected ? 'badge-issue' : 'badge-good'}`}>
                {activeRegression.regression_detected
                  ? `${activeRegression.new_issues_introduced.length} New Issue Detected`
                  : 'No New Issues Detected in Evaluated Checks'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Compliance Regression Tracking</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {activeRegression.comparison_title} for <strong>{productName}</strong>
            </p>
          </div>

          <button onClick={() => navigate(`/improve?productId=${prodId}`)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Sparkles size={15} />
            <span>Generate Suggested Fix</span>
          </button>
        </div>

        {/* Factual Regression Summary Bar */}
        <div className="grid-4" style={{ gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-good-solid)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Fixed Issues</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-good-text)', marginTop: '0.25rem' }}>
              {activeRegression.fixed_issues.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Resolved in {activeRegression.version_b_label}</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Improved Checks</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '0.25rem' }}>
              {activeRegression.improved_issues.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clarity enhanced</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-issue-solid)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>New Issues</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-issue-text)', marginTop: '0.25rem' }}>
              {activeRegression.new_issues_introduced.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Introduced during revision</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-review-solid)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Review Changed</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-review-text)', marginTop: '0.25rem' }}>
              {activeRegression.review_changed_issues?.length || 0}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evidence requiring review</span>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div 
          className="card-tactile"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-surface)',
            borderLeft: activeRegression.regression_detected ? '4px solid var(--status-issue-solid)' : '4px solid var(--status-good-solid)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeRegression.regression_detected ? 'var(--status-issue-bg)' : 'var(--status-good-bg)',
                color: activeRegression.regression_detected ? 'var(--status-issue-solid)' : 'var(--status-good-solid)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {activeRegression.regression_detected ? <TrendingDown size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeRegression.regression_detected
                  ? 'Layout Shift & Statutory Regression Detected'
                  : 'No Regression Detected in Verified Findings'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
                {activeRegression.regression_detected
                  ? 'When packaging elements are repositioned to resolve one finding (such as enlarging text or inserting USP declarations), neighboring declarations can shift into margin quiet zones—introducing new issues.'
                  : 'All evaluated statutory requirements were maintained without introducing new violations on evaluated dieline checks.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2 Column Comparison: What was Fixed vs What was Accidentally Introduced */}
        <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'stretch' }}>
          
          {/* Left Column: Fixed Issues */}
          <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--status-good-solid)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--status-good-solid)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>1. Fixed Issues ({activeRegression.fixed_issues.length})</h3>
              </div>
              <span className="badge badge-fixed">Resolved in {activeRegression.version_b_label}</span>
            </div>

            {activeRegression.fixed_issues.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No prior issues were recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeRegression.fixed_issues.map((item: ApiRegressionItem, idx: number) => (
                  <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--status-good-bg)', border: '1px solid var(--status-good-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--status-good-text)' }}>
                        {item.field}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--status-good-text)' }}>
                        {item.rule_code}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: New Issues Introduced (Regressions) */}
          <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--status-issue-solid)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ color: 'var(--status-issue-solid)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>2. New Issues Introduced ({activeRegression.new_issues_introduced.length})</h3>
              </div>
              <span className={`badge ${activeRegression.new_issues_introduced.length > 0 ? 'badge-issue' : 'badge-good'}`}>
                {activeRegression.new_issues_introduced.length > 0 ? 'Action Required' : 'Zero New Issues'}
              </span>
            </div>

            {activeRegression.new_issues_introduced.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--status-good-solid)', margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No New Issues Detected</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  The evaluated modifications did not introduce new statutory violations.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeRegression.new_issues_introduced.map((item: ApiRegressionItem, idx: number) => (
                  <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--status-issue-bg)', border: '1px solid var(--status-issue-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--status-issue-text)' }}>
                        {item.field}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--status-issue-text)' }}>
                        {item.rule_code}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--status-issue-border)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/improve?productId=${prodId}`)} className="btn btn-danger btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                        Apply Fix in Suggested Design →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </AppShell>
  );
};
