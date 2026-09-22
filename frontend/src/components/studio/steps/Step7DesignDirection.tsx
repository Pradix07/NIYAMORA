import React from 'react';
import { Sparkles } from 'lucide-react';

interface Step7Props {
  productData: Record<string, any>;
  brandData: Record<string, any>;
  format?: string;
  customDirection?: string;
  onDirectionChange: (dir: string) => void;
}

export const Step7DesignDirection: React.FC<Step7Props> = ({
  productData,
  brandData,
  customDirection,
  onDirectionChange,
}) => {
  const brand = productData.brand_name || 'Brand';
  const name = productData.product_name || 'Product';
  const style = (brandData.design_style || 'PREMIUM_NATURAL').replace('_', ' ').toLowerCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 7: AI Design Direction & Brief</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Review the structured design brief compiled from your product data and aesthetic preferences.
        </p>
      </div>

      {/* Structured Design Brief Summary Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={20} style={{ color: 'var(--brand-primary)' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Structured Packaging Brief</h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Brand & Hierarchy
            </span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {brand} • {name}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Primary emphasis on brand badge, prominent product title, and statutory net quantity.
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Color System
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: brandData.primary_color || '#1B4D3E' }} />
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: brandData.secondary_color || '#FAF8F5' }} />
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: brandData.accent_color || '#D4AF37' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{style.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              High contrast statutory declarations with gold borders.
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Statutory Compliance
            </span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.2rem' }}>
              Rule 6 Mandatory Blocks
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Includes MRP (all taxes), Net Qty, Dates, Nutrition Facts, Manufacturer, & Helpline.
            </p>
          </div>
        </div>

        {/* Custom Edit Directive */}
        <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-default)', paddingTop: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Modify or Refine Design Brief Directive:
          </label>
          <input
            type="text"
            placeholder="e.g. Enhance gold framing, make product title 20% larger, use deep forest green"
            value={customDirection || ''}
            onChange={(e) => onDirectionChange(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
      </div>
    </div>
  );
};
