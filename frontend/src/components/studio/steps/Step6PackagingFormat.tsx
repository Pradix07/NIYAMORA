import React from 'react';
import { Layers } from 'lucide-react';

interface Step6Props {
  packagingFormat: string;
  dimensions: {
    width_mm?: number;
    height_mm?: number;
    depth_mm?: number;
    bleed_mm?: number;
  };
  onFormatChange: (format: string) => void;
  onDimensionsChange: (dims: Record<string, any>) => void;
}

const FORMATS = [
  { id: 'STAND_UP_POUCH', label: 'Stand-up Pouch', desc: 'Six-panel flexible packaging with bottom gusset and top tear seal (Front, Back, Left, Right, Top, Bottom).' },
  { id: 'BOX_CARTON', label: 'Box / Carton', desc: 'Rigid folding carton with 6 printable faces (Front, Back, Left, Right, Top, Bottom).' },
  { id: 'JAR', label: 'Jar / Container', desc: 'Cylindrical container with wraparound body label and top lid seal.' },
  { id: 'BOTTLE', label: 'Bottle', desc: 'Vertical bottle with front & back labels and neck wrap.' },
  { id: 'CAN', label: 'Can / Tin', desc: 'Metal cylindrical tin container with 360-degree litho-printed label.' },
];

export const Step6PackagingFormat: React.FC<Step6Props> = ({
  packagingFormat,
  dimensions,
  onFormatChange,
  onDimensionsChange,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Step 6: Packaging Format & Geometry</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Choose your physical packaging style and specify print die dimensions.
        </p>
      </div>

      {/* Format Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Packaging Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {FORMATS.map((fmt) => (
            <div
              key={fmt.id}
              onClick={() => onFormatChange(fmt.id)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: packagingFormat === fmt.id ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                backgroundColor: packagingFormat === fmt.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: packagingFormat === fmt.id ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                {fmt.label}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {fmt.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Physical Dimensions */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--brand-primary)' }}>
          Physical Die Dimensions (mm)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Width (mm)
            </label>
            <input
              type="number"
              value={dimensions.width_mm || 140}
              onChange={(e) => onDimensionsChange({ width_mm: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Height (mm)
            </label>
            <input
              type="number"
              value={dimensions.height_mm || 210}
              onChange={(e) => onDimensionsChange({ height_mm: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Depth / Gusset (mm)
            </label>
            <input
              type="number"
              value={dimensions.depth_mm || 60}
              onChange={(e) => onDimensionsChange({ depth_mm: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Bleed Margin (mm)
            </label>
            <input
              type="number"
              value={dimensions.bleed_mm || 3}
              onChange={(e) => onDimensionsChange({ bleed_mm: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8125rem' }}
            />
          </div>
        </div>
      </div>

      {/* Six-Panel Generation Notice */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
        <Layers size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          NIYAMORA will render a complete <strong>6-panel layout (FRONT, BACK, LEFT, RIGHT, TOP, BOTTOM)</strong> textured accurately for 2D inspection and 3D WebGL rotation.
        </span>
      </div>
    </div>
  );
};
