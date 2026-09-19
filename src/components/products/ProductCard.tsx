import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { PackagingVisual } from '../common/PackagingVisual';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div
      className="card-tactile"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--border-default)',
      }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Top Packaging Visual Preview */}
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--border-default)',
          position: 'relative',
          minHeight: '170px',
        }}
      >
        <PackagingVisual type={product.type} variant="card" showEvidenceMarker={product.status === 'ISSUE'} />
        
        {/* Version Badge */}
        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
          <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
            {product.latestVersion}
          </span>
        </div>

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <StatusBadge status={product.status} />
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {product.brand}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {product.sku}
            </span>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
            {product.name}
          </h3>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        </div>

        {/* Card Footer: Metrics & Details */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
              {product.issueCount > 0 ? (
                <>
                  <ShieldAlert size={14} style={{ color: 'var(--status-issue-solid)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--status-issue-text)' }}>
                    {product.issueCount} Issue{product.issueCount > 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} style={{ color: 'var(--status-good-solid)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--status-good-text)' }}>0 Issues</span>
                </>
              )}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span>Type: <strong>{product.type}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} />
              <span>{product.lastChecked}</span>
            </div>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              Inspect <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
