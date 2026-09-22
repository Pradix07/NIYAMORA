import React from 'react';

interface Step5Props {
  data: {
    logo_url?: string;
    use_text_logo?: boolean;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    design_style?: string;
    custom_direction?: string;
  };
  onChange: (fields: Record<string, any>) => void;
}

const COLOR_PRESETS = [
  { name: 'Forest & Gold (Natural Premium)', primary: '#1B4D3E', secondary: '#FAF8F5', accent: '#D4AF37' },
  { name: 'Deep Indigo & Cream (Modern Clean)', primary: '#1E293B', secondary: '#F8FAFC', accent: '#38BDF8' },
  { name: 'Warm Terracotta & Sand (Organic Traditional)', primary: '#9A3412', secondary: '#FFFBEB', accent: '#F59E0B' },
  { name: 'Pure Cocoa & Gold (Confectionery / Luxury)', primary: '#3B1E08', secondary: '#FDF8F0', accent: '#E5C158' },
];

const STYLES = [
  { id: 'PREMIUM_NATURAL', label: 'Premium Natural', desc: 'Earthy organic tones, gold accents, refined spacing' },
  { id: 'MODERN_MINIMAL', label: 'Modern Minimal', desc: 'High contrast typography, clean layout, uncluttered' },
  { id: 'TRADITIONAL_HERITAGE', label: 'Traditional Heritage', desc: 'Warm authentic motifs, classic borders, artisanal look' },
  { id: 'BOLD_VIBRANT', label: 'Bold & Vibrant', desc: 'Energetic shelf visibility, bold titles, vivid accents' },
];

export const Step5BrandIdentity: React.FC<Step5Props> = ({ data, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 5: Brand & Visual Identity</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Configure the visual aesthetic, color palette, and design language for your print packaging.
        </p>
      </div>

      {/* Design Style Preset Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Packaging Aesthetic Style
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {STYLES.map((style) => (
            <div
              key={style.id}
              onClick={() => onChange({ design_style: style.id })}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: data.design_style === style.id ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                backgroundColor: data.design_style === style.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: data.design_style === style.id ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                {style.label}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {style.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Color Palette Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Curated Color Theme
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {COLOR_PRESETS.map((p, idx) => (
            <div
              key={idx}
              onClick={() => onChange({ primary_color: p.primary, secondary_color: p.secondary, accent_color: p.accent })}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: data.primary_color === p.primary ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{p.name}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: p.primary, border: '1px solid #ddd' }} />
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: p.secondary, border: '1px solid #ddd' }} />
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: p.accent, border: '1px solid #ddd' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Primary Color
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="color"
              value={data.primary_color || '#1B4D3E'}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={data.primary_color || '#1B4D3E'}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Secondary / Background
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="color"
              value={data.secondary_color || '#FAF8F5'}
              onChange={(e) => onChange({ secondary_color: e.target.value })}
              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={data.secondary_color || '#FAF8F5'}
              onChange={(e) => onChange({ secondary_color: e.target.value })}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Accent Color
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="color"
              value={data.accent_color || '#D4AF37'}
              onChange={(e) => onChange({ accent_color: e.target.value })}
              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={data.accent_color || '#D4AF37'}
              onChange={(e) => onChange({ accent_color: e.target.value })}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.8125rem' }}
            />
          </div>
        </div>
      </div>

      {/* Custom Natural-Language Design Brief */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Custom Design Direction (Optional natural language)
        </label>
        <textarea
          rows={2}
          placeholder="e.g. Use a light natural green and cream theme with gold framing. Make the brand title prominent and emphasize the vegetarian dietary mark."
          value={data.custom_direction || ''}
          onChange={(e) => onChange({ custom_direction: e.target.value })}
          style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.875rem' }}
        />
      </div>
    </div>
  );
};
