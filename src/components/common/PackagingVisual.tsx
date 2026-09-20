import React, { useState } from 'react';
import type { PackagingType } from '../../types';
import pouch3D from '../../assets/pouch_3d.jpg';
import bottle3D from '../../assets/bottle_3d.jpg';
import carton3D from '../../assets/carton_3d.jpg';
import jar3D from '../../assets/jar_3d.jpg';

interface PackagingVisualProps {
  type: PackagingType | string;
  variant?: 'thumbnail' | 'card' | 'hero' | 'inspection';
  label?: string;
  className?: string;
  showEvidenceMarker?: boolean;
  useRealisticRender?: boolean;
}

export const PackagingVisual: React.FC<PackagingVisualProps> = ({
  type,
  variant = 'card',
  label,
  className = '',
  showEvidenceMarker = false,
  useRealisticRender = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(true);

  const getImageSrc = () => {
    switch (type) {
      case 'Stand-Up Pouch':
        return pouch3D;
      case 'Glass Bottle':
        return bottle3D;
      case 'Rigid Carton':
        return carton3D;
      case 'Jar / Tub':
      default:
        return jar3D;
    }
  };

  const getDimensions = () => {
    switch (variant) {
      case 'thumbnail':
        return { width: 56, height: 56, borderRadius: '8px' };
      case 'hero':
        return { width: '100%', height: 420, borderRadius: '24px' };
      case 'inspection':
        return { width: '100%', height: 460, borderRadius: '16px' };
      case 'card':
      default:
        return { width: '100%', height: 190, borderRadius: '12px' };
    }
  };

  const { width, height, borderRadius } = getDimensions();

  // If using realistic 3D render and image is valid
  if (useRealisticRender && imageLoaded) {
    return (
      <div
        className={`niyamura-3d-packaging ${className}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
          borderRadius,
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: variant === 'hero' ? '0 20px 40px -15px rgba(0,0,0,0.35)' : 'var(--shadow-sm)',
          border: '1px solid var(--border-default)',
        }}
      >
        <img
          src={getImageSrc()}
          alt={`${type} 3D packaging mockup`}
          onError={() => setImageLoaded(false)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: variant === 'thumbnail' ? 'cover' : 'cover',
            objectPosition: 'center',
            transition: 'transform var(--transition-normal)',
          }}
        />

        {/* Soft lighting overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.2) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Evidence Marker Overlay if enabled */}
        {showEvidenceMarker && (
          <div
            style={{
              position: 'absolute',
              bottom: '22%',
              left: '26%',
              backgroundColor: 'rgba(239, 68, 68, 0.92)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
              border: '1px solid rgba(255,255,255,0.4)',
              zIndex: 10,
              animation: 'pulseGlow 2s infinite',
            }}
          >
            <span>!</span>
            <span>Net Qty: 2.8mm (Min 4.0mm)</span>
          </div>
        )}

        {label && (
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: '0.7rem',
              fontWeight: 600,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              color: '#FFF',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  // Vector fallback
  return (
    <div
      className={`packaging-visual-container ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius,
        background: 'var(--bg-surface-subtle)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{type}</p>
        <span style={{ fontSize: '0.75rem' }}>Commercial Packaging Mockup</span>
      </div>
    </div>
  );
};
