import React, { useState } from 'react';
import type { Finding } from '../../types';
import { ZoomIn, ZoomOut, Maximize2, Ruler, Eye, Layers } from 'lucide-react';

export interface CustomEvidenceBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  text?: string;
  status?: 'GOOD' | 'REVIEW' | 'ISSUE';
}

interface ArtworkViewerProps {
  findings?: Finding[];
  customBoxes?: CustomEvidenceBox[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  productName?: string;
  versionLabel?: string;
  previewImageUrl?: string | null;
}

export const ArtworkViewer: React.FC<ArtworkViewerProps> = ({
  findings = [],
  customBoxes,
  selectedFindingId,
  onSelectFinding,
  versionLabel = 'V01',
  previewImageUrl,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showAllMarkers, setShowAllMarkers] = useState<boolean>(true);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(300, Math.max(50, prev + delta)));
  };

  // Harmonize boxes: prefer customBoxes from live extraction, fallback to findings
  const activeBoxes: CustomEvidenceBox[] = customBoxes || findings.map((f) => ({
    id: f.id,
    x: f.evidenceBox.x,
    y: f.evidenceBox.y,
    width: f.evidenceBox.width,
    height: f.evidenceBox.height,
    label: f.evidenceBox.label || f.category,
    text: f.foundValue,
    status: f.status,
  }));

  const selectedBox = activeBoxes.find((b) => b.id === selectedFindingId);

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '560px',
        backgroundColor: 'var(--bg-surface)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Viewer Toolbar */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface-subtle)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Artwork Canvas</span>
          <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>
            {versionLabel} • {previewImageUrl ? 'Live Uploaded Artwork/Scan' : '160×240mm (300 DPI)'}
          </span>
          {selectedBox && (
            <span className="badge badge-sample" style={{ fontSize: '0.7rem' }}>
              Active: {selectedBox.label}
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setShowRulers(!showRulers)}
            className={`btn btn-sm ${showRulers ? 'btn-primary' : 'btn-secondary'}`}
            title="Toggle Legal Metrology Millimeter Rulers"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <Ruler size={13} />
            <span>Rulers</span>
          </button>

          <button
            onClick={() => setShowAllMarkers(!showAllMarkers)}
            className={`btn btn-sm ${showAllMarkers ? 'btn-secondary' : 'btn-ghost'}`}
            title="Toggle Evidence Markers"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <Eye size={13} />
            <span>Markers ({activeBoxes.length})</span>
          </button>

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-default)', margin: '0 0.25rem' }} />

          <button onClick={() => handleZoom(-25)} className="btn-icon" style={{ width: '28px', height: '28px' }} title="Zoom Out">
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', minWidth: '42px', textAlign: 'center', fontWeight: 600 }}>
            {zoomLevel}%
          </span>
          <button onClick={() => handleZoom(25)} className="btn-icon" style={{ width: '28px', height: '28px' }} title="Zoom In">
            <ZoomIn size={15} />
          </button>
          <button onClick={() => setZoomLevel(100)} className="btn-icon" style={{ width: '28px', height: '28px' }} title="Reset Zoom">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          position: 'relative',
          padding: '2rem',
          backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Rulers Overlay Bar */}
        {showRulers && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: '#FFF',
              padding: '2px 10px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Ruler size={11} /> 0.0mm ──────── 160.0mm Principal Display Panel Width
          </div>
        )}

        {/* Artwork Graphic Frame */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            position: 'relative',
            width: '420px',
            height: '560px',
            backgroundColor: '#CBB593',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        >
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt="Uploaded Artwork Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#FFFFFF',
              }}
            />
          ) : (
            /* Synthetic Vector Mockup Base */
            <div style={{ position: 'absolute', inset: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(145deg, #DFC8A8 0%, #CBB593 50%, #BFA57E 100%)' }}>
              <div style={{ borderBottom: '2px dashed #9C815A', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#6A5333', fontWeight: 700 }}>BATCH: AB-2609-C</span>
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#6A5333', fontWeight: 700 }}>MFD: 09/2026</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#2D3748', textTransform: 'uppercase' }}>
                    Aura Botanicals
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1A202C', lineHeight: 1.1 }}>
                  ORGANIC CHIA CRUNCH
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#4A5568', fontWeight: 600 }}>
                  Cold-Milled Raw Chia Seeds • Omega-3 & High Dietary Fiber
                </p>
              </div>

              <div style={{ height: '130px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#FEF3C7', border: '2px dashed #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', fontWeight: 800, fontSize: '0.8rem' }}>
                  100% RAW
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4A5568', marginTop: '6px' }}>SUPERFOOD BLEND</span>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: '6px', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.65rem', color: '#1A202C' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.65rem' }}>INGREDIENTS:</strong>
                  <p style={{ fontSize: '0.6rem', color: '#4A5568' }}>Roasted Organic Chia Seeds (Salvia hispanica). Himalayan Pink Salt.</p>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#000', marginTop: '2px' }}>ALLERGEN: CONTAINS CHIA SEEDS.</p>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.65rem' }}>CONSUMER CARE:</strong>
                  <p style={{ fontSize: '0.58rem', color: '#4A5568' }}>Toll Free: 1800-425-9988</p>
                  <p style={{ fontSize: '0.58rem', color: '#4A5568' }}>care@aurabotanicals.com</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.95)', padding: '8px 10px', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>Net Qty: 250 g</span>
                  <span style={{ display: 'block', fontSize: '0.58rem', color: '#4B5563', fontFamily: 'monospace' }}>MRP: ₹299.00 (₹1.20/g)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#065F46', display: 'block' }}>fssai 10020011002345</span>
                  <span style={{ fontSize: '0.55rem', color: '#6B7280' }}>Made in India</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Bounding Box Overlays */}
          {showAllMarkers && activeBoxes.map((box) => {
            const isSelected = box.id === selectedFindingId;
            const { x, y, width, height, label } = box;

            let borderColor = 'var(--brand-primary)';
            let bgColor = 'rgba(79, 70, 229, 0.15)';
            if (box.status === 'GOOD') {
              borderColor = 'var(--status-good-solid)';
              bgColor = 'rgba(16, 185, 129, 0.18)';
            } else if (box.status === 'REVIEW') {
              borderColor = 'var(--status-review-solid)';
              bgColor = 'rgba(245, 158, 11, 0.22)';
            } else if (box.status === 'ISSUE') {
              borderColor = 'var(--status-issue-solid)';
              bgColor = 'rgba(239, 68, 68, 0.22)';
            }

            return (
              <div
                key={box.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFinding(box.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  border: isSelected ? `2.5px solid ${borderColor}` : `1.5px dashed ${borderColor}`,
                  backgroundColor: isSelected ? bgColor : 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 12px ${borderColor}` : 'none',
                  transition: 'all 0.15s ease',
                  zIndex: isSelected ? 30 : 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                }}
                title={label}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '0',
                    backgroundColor: borderColor,
                    color: '#FFFFFF',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Layers size={9} />
                  <span>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div
        style={{
          padding: '0.5rem 1rem',
          borderTop: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Click any evidence box or entity row on right to inspect coordinates.</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {selectedBox ? `Box: X:${selectedBox.x}% Y:${selectedBox.y}% (W:${selectedBox.width}% H:${selectedBox.height}%)` : 'Ready'}
        </span>
      </div>
    </div>
  );
};
