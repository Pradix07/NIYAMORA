import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Step8Props {
  projectState: {
    product_data: Record<string, any>;
    business_data: Record<string, any>;
    food_data: Record<string, any>;
    nutrition_data: Record<string, any>;
    declaration_data: Record<string, any>;
    brand_data?: Record<string, any>;
    packaging_format?: string;
  };
  onGenerate: () => void;
  isGenerating: boolean;
}

export const Step8ReviewInformation: React.FC<Step8Props> = ({
  projectState,
}) => {
  const { product_data, business_data, food_data, nutrition_data, declaration_data } = projectState;

  const sections = [
    {
      title: 'Product Information',
      items: [
        { label: 'Brand Name', value: product_data.brand_name, mandatory: true },
        { label: 'Product Name', value: product_data.product_name, mandatory: true },
        { label: 'Grocery Category', value: product_data.category, mandatory: true },
        { label: 'Net Quantity', value: product_data.net_quantity ? `${product_data.net_quantity} ${product_data.unit || 'g'}` : null, mandatory: true },
      ],
    },
    {
      title: 'Business & Legal',
      items: [
        { label: 'Manufacturer Name', value: business_data.manufacturer_name },
        { label: 'Manufacturer Address', value: business_data.manufacturer_address },
        { label: 'FSSAI License', value: business_data.fssai_license },
        { label: 'Consumer Helpline Phone', value: business_data.consumer_care_phone },
        { label: 'Consumer Helpline Email', value: business_data.consumer_care_email },
      ],
    },
    {
      title: 'Food & Nutrition',
      items: [
        { label: 'Dietary Mark', value: food_data.veg_non_veg || 'VEG' },
        { label: 'Ingredients Listed', value: food_data.ingredients?.length ? `${food_data.ingredients.length} items specified` : null },
        { label: 'Allergen Advice', value: food_data.contains_allergens?.join(', ') || null },
        { label: 'Nutrition Facts', value: nutrition_data.nutrients?.length ? `${nutrition_data.nutrients.length} nutrients table` : null },
      ],
    },
    {
      title: 'Declarations & Pricing',
      items: [
        { label: 'MRP', value: declaration_data.mrp ? `₹${declaration_data.mrp}` : null, mandatory: true },
        { label: 'Date of Manufacture / Packing', value: declaration_data.mfg_date },
        { label: 'Batch Number', value: declaration_data.batch_number },
        { label: 'Storage Instructions', value: declaration_data.storage_instructions },
        { label: 'User Claims', value: declaration_data.user_claims?.length ? declaration_data.user_claims.join(', ') : null },
      ],
    },
  ];

  let missingCount = 0;
  sections.forEach((s) => {
    s.items.forEach((it) => {
      if (!it.value) missingCount++;
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 8: Final Review & Generation</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Review your structured packaging information before generating the 6-panel artwork.
        </p>
      </div>

      {/* Missing Placeholders Advisory */}
      {missingCount > 0 ? (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-review-bg)',
            border: '1px solid var(--status-review-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--status-review-text)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.8125rem', color: 'var(--status-review-text)' }}>
            <strong>{missingCount} optional / draft fields are currently not provided.</strong>
            <p style={{ marginTop: '0.2rem' }}>
              NIYAMORA will render clean draft placeholders (e.g. <code>[Insert Consumer Care Phone]</code>, <code>[MM/YYYY]</code>) rather than fabricating fake data.
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-pass-bg)',
            border: '1px solid var(--status-pass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={20} style={{ color: 'var(--status-pass-text)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--status-pass-text)' }}>
            All core packaging information is complete and ready for print artwork rendering.
          </span>
        </div>
      )}

      {/* Structured Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {sections.map((sec, idx) => (
          <div
            key={idx}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--brand-primary)' }}>
              {sec.title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {sec.items.map((it, itIdx) => (
                <div key={itIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{it.label}:</span>
                  <span style={{ fontWeight: 600, color: it.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {it.value ? it.value : it.mandatory ? '⚠️ Required' : 'Draft Placeholder'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
