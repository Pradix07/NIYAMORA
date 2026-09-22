import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';

interface Packaging2DViewerProps {
  panelDesigns?: Record<string, {
    panel_type: string;
    file_path: string;
    preview_url: string;
    width: number;
    height: number;
    elements: any[];
    is_applicable: boolean;
  }>;
  selectedPanel: string;
  onPanelChange: (panel: string) => void;
  activeFindingBox?: { x: number; y: number; width: number; height: number; panel_type: string } | null;
}

export const Packaging2DViewer: React.FC<Packaging2DViewerProps> = ({
  panelDesigns = {},
  selectedPanel,
  onPanelChange,
  activeFindingBox,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentPanelData = panelDesigns[selectedPanel] || panelDesigns[selectedPanel.toUpperCase()] || panelDesigns[selectedPanel.toLowerCase()];
  const panelsList = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];

  const handleZoom = (dir: 'IN' | 'OUT' | 'RESET') => {
    if (dir === 'IN') setZoomLevel((prev) => Math.min(3.0, prev + 0.25));
    else if (dir === 'OUT') setZoomLevel((prev) => Math.max(0.5, prev - 0.25));
    else {
      setZoomLevel(1.0);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isPanningRef.current = true;
    startPanRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    setPanOffset({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
    >
      {/* Panel Selector Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {/* Panel Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          {panelsList.map((p) => {
            const isSelected = selectedPanel === p;
            const hasData = !!panelDesigns[p];

            return (
              <button
                key={p}
                onClick={() => {
                  onPanelChange(p);
                  setPanOffset({ x: 0, y: 0 });
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 800 : 600,
                  backgroundColor: isSelected ? 'var(--brand-primary)' : hasData ? 'var(--bg-primary)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : hasData ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{p}</span>
                {hasData && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? '#FFFFFF' : '#10B981' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Zoom & View Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => handleZoom('OUT')}
            style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-primary)', cursor: 'pointer' }}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, minWidth: '45px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoom('IN')}
            style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-primary)', cursor: 'pointer' }}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => handleZoom('RESET')}
            style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Reset
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-primary)', cursor: 'pointer' }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* 2D Canvas Area */}
      <div
        style={{
          position: 'relative',
          height: isFullscreen ? 'calc(100vh - 120px)' : '520px',
          backgroundColor: '#1E293B',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isPanningRef.current ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {currentPanelData && (currentPanelData.preview_url || currentPanelData.file_path) ? (
          <div
            style={{
              position: 'relative',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transition: isPanningRef.current ? 'none' : 'transform 0.1s ease-out',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'inline-block',
            }}
          >
            <img
              src={api.getFileUrl(currentPanelData.preview_url || currentPanelData.file_path)}
              alt={`${selectedPanel} Artwork`}
              style={{
                maxWidth: '100%',
                maxHeight: '480px',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />

            {/* Evidence Bounding Box Overlay */}
            {activeFindingBox && activeFindingBox.panel_type === selectedPanel && (
              <div
                style={{
                  position: 'absolute',
                  left: `${activeFindingBox.x}%`,
                  top: `${activeFindingBox.y}%`,
                  width: `${activeFindingBox.width}%`,
                  height: `${activeFindingBox.height}%`,
                  border: '3px solid #EF4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  borderRadius: '4px',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)',
                  pointerEvents: 'none',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94A3B8' }}>
            <Layers size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>No artwork generated for {selectedPanel} panel yet.</p>
            <p style={{ fontSize: '0.8125rem' }}>Click "Generate Packaging" to render this panel.</p>
          </div>
        )}
      </div>
    </div>
  );
};
