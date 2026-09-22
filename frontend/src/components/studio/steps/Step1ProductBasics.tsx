import React from 'react';

interface Step1Props {
  data: {
    product_name?: string;
    brand_name?: string;
    category?: string;
    sub_category?: string;
    description?: string;
    net_quantity?: string;
    unit?: string;
  };
  onChange: (fields: Record<string, any>) => void;
}

const CATEGORIES = [
  'Dry Fruits & Nuts',
  'Snacks & Namkeen',
  'Grains & Cereals',
  'Pulses & Dals',
  'Flour & Atta',
  'Spices & Masalas',
  'Tea & Coffee',
  'Biscuits & Bakery',
  'Ready-to-Eat',
  'Beverages & Juices',
  'Confectionery & Sweets',
  'Edible Oils & Ghee',
  'Other Grocery',
];

const UNITS = ['g', 'kg', 'ml', 'L', 'pieces', 'count'];

export const Step1ProductBasics: React.FC<Step1Props> = ({ data, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 1: Product Basics</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Specify the core commodity details and statutory package net quantity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Brand Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Brand Name <span style={{ color: 'var(--status-issue-text)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter brand name"
            value={data.brand_name || ''}
            onChange={(e) => onChange({ brand_name: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>

        {/* Product Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Product Name / Generic Name <span style={{ color: 'var(--status-issue-text)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter product name"
            value={data.product_name || ''}
            onChange={(e) => onChange({ product_name: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Category */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Grocery Category <span style={{ color: 'var(--status-issue-text)' }}>*</span>
          </label>
          <select
            value={data.category || ''}
            onChange={(e) => onChange({ category: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          >
            <option value="" disabled>Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sub-category */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Sub-Category (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter sub-category"
            value={data.sub_category || ''}
            onChange={(e) => onChange({ sub_category: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Net Quantity & Unit */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Package Net Quantity (Numeric) <span style={{ color: 'var(--status-issue-text)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter net quantity (e.g. 250)"
            value={data.net_quantity || ''}
            onChange={(e) => onChange({ net_quantity: e.target.value.replace(/[^0-9.]/g, '') })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Statutory Unit <span style={{ color: 'var(--status-issue-text)' }}>*</span>
          </label>
          <select
            value={data.unit || ''}
            onChange={(e) => onChange({ unit: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          >
            <option value="" disabled>Select unit</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Product Description / Headline Descriptor
        </label>
        <textarea
          rows={2}
          placeholder="Enter product description or headline descriptor"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
      </div>
    </div>
  );
};
