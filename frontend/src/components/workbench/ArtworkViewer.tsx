import React, { useState } from 'react';
import type { Finding } from '../../types';
import type { ApiPanel } from '../../services/api';
import { ZoomIn, ZoomOut, Maximize2, Ruler, Eye, Layers, AlertCircle } from 'lucide-react';

export interface CustomEvidenceBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  text?: string;
  status?: 'GOOD' | 'REVIEW' | 'ISSUE';
  panelType?: string;
  panelId?: string;
}

interface ArtworkViewerProps {
  findings?: Finding[];
  customBoxes?: CustomEvidenceBox[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  productName?: string;
  versionLabel?: string;
  previewImageUrl?: string | null;
  panels?: ApiPanel[];
  activePanelId?: string;
  onSelectPanel?: (panelId: string) => void;
}

export const ArtworkViewer: React.FC<ArtworkViewerProps> = ({
  findings = [],
  customBoxes,
  selectedFindingId,
  onSelectFinding,
  versionLabel = 'V01',
  previewImageUrl,
  panels = [],
  activePanelId,
  onSelectPanel,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showAllMarkers, setShowAllMarkers] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(300, Math.max(50, prev + delta)));
  };

  // Harmonize boxes: prefer customBoxes from live extraction, fallback to findings
  const fallbackBoxes: CustomEvidenceBox[] = findings.map((f) => ({
    id: f.id,
    x: f.evidenceBox.x,
    y: f.evidenceBox.y,
    width: f.evidenceBox.width,
    height: f.evidenceBox.height,
    label: f.evidenceBox.label || f.category,
    text: f.foundValue,
    status: f.status,
  }));

  const activeBoxes: CustomEvidenceBox[] = (customBoxes || fallbackBoxes).filter((box) => {
    // If active panel is selected, filter boxes that match this panel or show all if panel is unassigned
    if (!activePanelId || panels.length === 0) return true;
    const currentPanel = panels.find((p) => p.id === activePanelId);
    if (!currentPanel) return true;
    if (!box.panelType) return true;
    return box.panelType.toUpperCase() === currentPanel.panel_type.toUpperCase();
  });

  const selectedBox = activeBoxes.find((b) => b.id === selectedFindingId);
  const currentPanelObj = panels.find((p) => p.id === activePanelId);
  const panelDisplayName = currentPanelObj ? currentPanelObj.panel_type.replace('_', ' ') : 'Artwork';

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
          padding: '0.625rem 1rem',
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
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Packaging Artwork</span>
          <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            {versionLabel} • {panelDisplayName}
          </span>
          {selectedBox && (
            <span className="badge badge-sample" style={{ fontSize: '0.7rem' }}>
              Selected: {selectedBox.label}
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

      {/* Multi-Panel Switcher Strip */}
      {panels.length > 1 && (
        <div
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.25rem', whiteSpace: 'nowrap' }}>
            Panels:
          </span>
          {panels.map((p) => {
            const isActive = p.id === activePanelId || (!activePanelId && p === panels[0]);
            return (
              <button
                key={p.id}
                onClick={() => onSelectPanel && onSelectPanel(p.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <span>{p.panel_type.replace('_', ' ')}</span>
              </button>
            );
          })}
        </div>
      )}

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
          padding: '1.5rem',
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
              backgroundColor: 'rgba(0,0,0,0.85)',
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
            <Ruler size={11} /> Principal Display Panel Coordinate Grid (Normalized %)
          </div>
        )}

        {/* Artwork Graphic Frame */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            position: 'relative',
            maxWidth: '520px',
            width: '100%',
            minHeight: '400px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {previewImageUrl && !imageError ? (
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={previewImageUrl}
                alt="Uploaded Artwork Preview"
                onError={() => setImageError(true)}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '560px',
                  objectFit: 'contain',
                  display: 'block',
                  backgroundColor: '#FFFFFF',
                }}
              />

              {/* Interactive Bounding Box Overlays */}
              {showAllMarkers &&
                activeBoxes.map((box) => {
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
                        width: `${Math.max(width, 4)}%`,
                        height: `${Math.max(height, 2.5)}%`,
                        border: isSelected ? `2.5px solid ${borderColor}` : `1.5px dashed ${borderColor}`,
                        backgroundColor: isSelected ? bgColor : 'rgba(0,0,0,0.05)',
                        borderRadius: '3px',
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
                          top: '-16px',
                          left: '0',
                          backgroundColor: borderColor,
                          color: '#FFFFFF',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '2px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          pointerEvents: 'none',
                        }}
                      >
                        <Layers size={9} />
                        <span>{label}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            /* Clear user-facing error state when artwork is missing or failed */
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <AlertCircle size={36} style={{ color: 'var(--status-review-solid)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Your artwork could not be displayed.
              </h3>
              <p style={{ fontSize: '0.8125rem', maxWidth: '320px', lineHeight: 1.4 }}>
                The preview file for {panelDisplayName} is being processed or could not be loaded. Findings remain available in the right panel.
              </p>
            </div>
          )}
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
        <span>
          {selectedBox ? 'Select a highlighted area to see why it was flagged.' : 'Select a finding on the right to highlight it on the artwork.'}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
          {selectedBox ? `${selectedBox.label}` : 'Ready'}
        </span>
      </div>
    </div>
  );
};
