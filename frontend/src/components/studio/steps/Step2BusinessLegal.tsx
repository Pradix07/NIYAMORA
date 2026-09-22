import React from 'react';

interface Step2Props {
  data: {
    manufacturer_name?: string;
    manufacturer_address?: string;
    packer_name?: string;
    packer_address?: string;
    importer_name?: string;
    importer_address?: string;
    marketer_name?: string;
    marketer_address?: string;
    country_of_origin?: string;
    consumer_care_phone?: string;
    consumer_care_email?: string;
    consumer_care_website?: string;
    consumer_care_address?: string;
    fssai_license?: string;
  };
  onChange: (fields: Record<string, any>) => void;
}

export const Step2BusinessLegal: React.FC<Step2Props> = ({ data, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 2: Business & Legal Information</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Statutory Legal Metrology (Rule 6) and FSSAI declarations for manufacturer, packaging origin, and consumer helpline.
        </p>
      </div>

      {/* Manufacturer Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Manufacturer / Packer Name
          </label>
          <input
            type="text"
            placeholder="Enter manufacturer / packer name"
            value={data.manufacturer_name || ''}
            onChange={(e) => onChange({ manufacturer_name: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Country of Origin
          </label>
          <input
            type="text"
            placeholder="Enter country of origin (e.g. India)"
            value={data.country_of_origin || ''}
            onChange={(e) => onChange({ country_of_origin: e.target.value })}
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Complete Physical Address */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Manufacturer Full Physical Address
        </label>
        <textarea
          rows={2}
          placeholder="Enter manufacturer full physical address"
          value={data.manufacturer_address || ''}
          onChange={(e) => onChange({ manufacturer_address: e.target.value })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
      </div>

      {/* FSSAI License */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          FSSAI License Number (14 Digits)
        </label>
        <input
          type="text"
          placeholder="Enter 14-digit FSSAI license number"
          value={data.fssai_license || ''}
          onChange={(e) => onChange({ fssai_license: e.target.value.replace(/[^0-9]/g, '') })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
      </div>

      {/* Consumer Care Contacts */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--brand-primary)' }}>
          Consumer Care & Feedback Helpline (Mandatory under Rule 6(1)(f))
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Helpline Phone Number
            </label>
            <input
              type="text"
              placeholder="Enter helpline phone number"
              value={data.consumer_care_phone || ''}
              onChange={(e) => onChange({ consumer_care_phone: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Consumer Support Email
            </label>
            <input
              type="email"
              placeholder="Enter consumer support email"
              value={data.consumer_care_email || ''}
              onChange={(e) => onChange({ consumer_care_email: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Brand Website (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter brand website"
              value={data.consumer_care_website || ''}
              onChange={(e) => onChange({ consumer_care_website: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
