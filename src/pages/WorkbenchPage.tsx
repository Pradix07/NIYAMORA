import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ArtworkViewer } from '../components/workbench/ArtworkViewer';
import { FindingPanel } from '../components/workbench/FindingPanel';
import { SAMPLE_FINDINGS, SAMPLE_PRODUCTS } from '../data/mockData';
import { Sparkles, FileText } from 'lucide-react';

export const WorkbenchPage: React.FC = () => {
  const navigate = useNavigate();
  const product = SAMPLE_PRODUCTS[0];
  const findings = SAMPLE_FINDINGS;

  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(findings[0].id);

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: product.name, path: `/products/${product.id}` }, { label: 'Results & Workbench' }]}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 110px)' }}>
        
        {/* Top Product Context & Action Bar */}
        <div
          className="card"
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  {product.brand}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• SKU: {product.sku}</span>
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{product.name} (V02)</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              onClick={() => navigate('/improve')}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.35rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
            >
              <Sparkles size={14} />
              <span>Improve Design</span>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <FileText size={14} />
              <span>Export Audit PDF</span>
            </button>
          </div>
        </div>

        {/* Workbench Workspace Split View */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.35fr 1fr',
            gap: '1rem',
            minHeight: 0,
          }}
        >
          {/* Left: Interactive Artwork Canvas with Evidence Bounding Boxes */}
          <ArtworkViewer
            findings={findings}
            selectedFindingId={selectedFindingId}
            onSelectFinding={(id) => setSelectedFindingId(id)}
            productName={product.name}
            versionLabel={product.latestVersion}
          />

          {/* Right: Inspection Finding Panel */}
          <FindingPanel
            findings={findings}
            selectedFindingId={selectedFindingId}
            onSelectFinding={(id) => setSelectedFindingId(id)}
            onOpenImprove={() => navigate('/improve')}
          />
        </div>

      </div>
    </AppShell>
  );
};
