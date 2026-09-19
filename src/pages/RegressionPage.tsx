import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { SAMPLE_REGRESSION_DATA, SAMPLE_PRODUCTS } from '../data/mockData';
import { 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react';

export const RegressionPage: React.FC = () => {
  const navigate = useNavigate();
  const regData = SAMPLE_REGRESSION_DATA;
  const product = SAMPLE_PRODUCTS[0];

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: product.name, path: `/products/${product.id}` }, { label: 'Compliance Regression' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-sample">Regression Analysis</span>
              <span className="badge badge-issue">1 New Regression Detected</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Compliance Regression Tracking</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {regData.comparisonTitle} for <strong>{regData.productName}</strong>
            </p>
          </div>

          <button onClick={() => navigate('/improve')} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Sparkles size={15} />
            <span>Generate Fix for New Regression</span>
          </button>
        </div>

        {/* Visual Educational Banner: How Regressions Happen */}
        <div 
          className="card-tactile"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-surface)',
            borderLeft: '4px solid var(--status-issue-solid)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-issue-bg)', color: 'var(--status-issue-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingDown size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Understanding Compliance Regression
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
                When packaging designers reposition elements to solve one compliance violation (like enlarging font size or adding unit sale prices), surrounding elements are frequently shifted into margin zones or barcode quiet spaces—accidentally introducing new statutory violations.
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>1. Fixed Issues ({regData.fixedIssues.length})</h3>
              </div>
              <span className="badge badge-fixed">Resolved in V02</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {regData.fixedIssues.map((item, idx) => (
                <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--status-good-bg)', border: '1px solid var(--status-good-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--status-good-text)' }}>
                      {item.field}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--status-good-text)' }}>
                      {item.code}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: New Issues Introduced (Regressions) */}
          <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--status-issue-solid)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ color: 'var(--status-issue-solid)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>2. New Issues Introduced ({regData.newIssuesIntroduced.length})</h3>
              </div>
              <span className="badge badge-issue">Regression Risk</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {regData.newIssuesIntroduced.map((item, idx) => (
                <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--status-issue-bg)', border: '1px solid var(--status-issue-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--status-issue-text)' }}>
                      {item.field}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--status-issue-text)' }}>
                      {item.code}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--status-issue-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => navigate('/improve')} className="btn btn-danger btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                      Apply Fix in Suggested Design →
                    </button>
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
