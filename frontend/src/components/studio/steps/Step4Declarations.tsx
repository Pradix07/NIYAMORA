import React from 'react';

interface Step4Props {
  data: {
    mrp?: string;
    unit_sale_price?: string;
    batch_number?: string;
    mfg_date?: string;
    pack_date?: string;
    expiry_date?: string;
    best_before?: string;
    storage_instructions?: string;
    preparation_instructions?: string;
    user_claims?: string[];
    barcode?: string;
  };
  onChange: (fields: Record<string, any>) => void;
}

export const Step4Declarations: React.FC<Step4Props> = ({ data, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 4: Declarations & Product Claims</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Statutory price declarations under Rule 6(1)(e), dates under Rule 6(1)(d), and strictly user-provided marketing claims.
        </p>
      </div>

      {/* Pricing: MRP & USP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            MRP (₹) <span style={{ color: 'var(--status-issue-text)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '0.65rem', color: 'var(--text-muted)' }}>₹</span>
            <input
              type="text"
              placeholder="Enter MRP (e.g. 399.00)"
              value={data.mrp || ''}
              onChange={(e) => onChange({ mrp: e.target.value.replace(/[^0-9.]/g, '') })}
              style={{ width: '100%', padding: '0.65rem 0.85rem 0.65rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            "(inclusive of all taxes)" will be automatically attached on the artwork.
          </span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Unit Sale Price (USP) (Optional / Auto-calculated)
          </label>
          <input
            type="text"
            placeholder="Enter USP (e.g. ₹1.60 / g)"
            value={data.unit_sale_price || ''}
            onChange={(e) => onChange({ unit_sale_price: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Dates: Manufacturing, Packing, Expiry */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Date of Manufacture / Packing (MM/YYYY)
          </label>
          <input
            type="text"
            placeholder="MM/YYYY (e.g. 09/2026)"
            value={data.mfg_date || ''}
            onChange={(e) => onChange({ mfg_date: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Batch / Lot Number
          </label>
          <input
            type="text"
            placeholder="Enter batch/lot number"
            value={data.batch_number || ''}
            onChange={(e) => onChange({ batch_number: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Best Before Duration
          </label>
          <input
            type="text"
            placeholder="Enter best before (e.g. 9 Months from packaging)"
            value={data.best_before || ''}
            onChange={(e) => onChange({ best_before: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Storage & Usage Instructions */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Storage Instructions
        </label>
        <textarea
          rows={2}
          placeholder="Enter storage instructions"
          value={data.storage_instructions || ''}
          onChange={(e) => onChange({ storage_instructions: e.target.value })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
      </div>

      {/* User Provided Claims */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Product Claims (Comma separated)
        </label>
        <input
          type="text"
          placeholder="Enter factual claims separated by comma"
          value={(data.user_claims || []).join(', ')}
          onChange={(e) => onChange({ user_claims: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
          Note: Only user-supplied factual claims are placed on the packaging. AI will never fabricate medical or health claims.
        </span>
      </div>

      {/* Barcode / GTIN */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Barcode / GTIN Number
        </label>
        <input
          type="text"
          placeholder="Enter barcode / GTIN number"
          value={data.barcode || ''}
          onChange={(e) => onChange({ barcode: e.target.value.replace(/[^0-9]/g, '') })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
      </div>
    </div>
  );
};
