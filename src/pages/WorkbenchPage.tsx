import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ArtworkViewer } from '../components/workbench/ArtworkViewer';
import type { CustomEvidenceBox } from '../components/workbench/ArtworkViewer';
import { FindingPanel } from '../components/workbench/FindingPanel';
import { SAMPLE_FINDINGS, SAMPLE_PRODUCTS } from '../data/mockData';
import { api } from '../services/api';
import type { ApiInspection, ApiEvaluation, ApiFinding } from '../services/api';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const WorkbenchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get('inspectionId');

  const [inspection, setInspection] = useState<ApiInspection | null>(null);
  const [evaluations, setEvaluations] = useState<ApiEvaluation[]>([]);
  const [findings, setFindings] = useState<ApiFinding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  const fallbackProduct = SAMPLE_PRODUCTS[0];
  const fallbackFindings = SAMPLE_FINDINGS;

  useEffect(() => {
    if (inspectionId) {
      api.getInspection(inspectionId)
        .then((data) => {
          setInspection(data);
          return Promise.all([
            api.getEvaluations(inspectionId).catch(() => []),
            api.getFindings(inspectionId).catch(() => []),
          ]);
        })
        .then(([evals, fnds]) => {
          setEvaluations(evals);
          setFindings(fnds);
          if (evals.length > 0) {
            setSelectedFindingId(evals[0].id);
          } else if (fnds.length > 0) {
            setSelectedFindingId(fnds[0].id);
          }
        })
        .catch((err) => {
          console.warn('Failed to load inspection from API, falling back to mock dataset:', err);
          setSelectedFindingId(fallbackFindings[0].id);
        });
    } else {
      setSelectedFindingId(fallbackFindings[0].id);
    }
  }, [inspectionId]);

  // Build custom boxes from live extraction & evaluation evidence
  let customBoxes: CustomEvidenceBox[] | undefined = undefined;
  if (evaluations.length > 0) {
    customBoxes = evaluations
      .filter((ev) => ev.evidence?.bbox)
      .map((ev) => {
        const bbox = ev.evidence!.bbox!;
        return {
          id: ev.id,
          x: typeof bbox.x === 'number' ? bbox.x : 10,
          y: typeof bbox.y === 'number' ? bbox.y : 10,
          width: typeof bbox.width === 'number' ? bbox.width : 20,
          height: typeof bbox.height === 'number' ? bbox.height : 10,
          label: ev.rule_title,
          text: ev.observed_value || undefined,
          status: ev.status === 'PASS' ? 'GOOD' : ev.status === 'ISSUE' ? 'ISSUE' : 'REVIEW',
        };
      });
  } else if (inspection?.extracted_data?.fields) {
    customBoxes = Object.entries(inspection.extracted_data.fields)
      .filter(([_, field]) => field.evidence_box !== null && field.evidence_box !== undefined)
      .map(([key, field]) => ({
        id: key,
        x: field.evidence_box!.x,
        y: field.evidence_box!.y,
        width: field.evidence_box!.width,
        height: field.evidence_box!.height,
        label: field.field_name,
        text: field.extracted_value || undefined,
        status: field.status === 'EXTRACTED' ? 'GOOD' : 'REVIEW',
      }));
  }

  const productName = inspection?.product_name || fallbackProduct.name;
  const brandName = inspection?.brand || fallbackProduct.brand;
  const versionLabel = inspection?.version_label || fallbackProduct.latestVersion;
  const previewUrl = inspection?.preview_url ? api.getFileUrl(inspection.preview_url) : null;
  const complianceVerdict = inspection?.compliance_verdict;
  const complianceScore = inspection?.compliance_score;

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: productName, path: `/products/${fallbackProduct.id}` }, { label: 'Results & Workbench' }]}>
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
                  {brandName}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Inspection: {inspection?.id ? `${inspection.id.slice(0, 8)}...` : 'Pre-Flight Master'}</span>
                {complianceVerdict && (
                  <span
                    className={`badge ${complianceVerdict === 'PASS' ? 'badge-good' : complianceVerdict === 'ISSUE' ? 'badge-issue' : 'badge-review'}`}
                    style={{ fontSize: '0.6875rem' }}
                  >
                    {complianceVerdict === 'PASS' ? <ShieldCheck size={11} /> : <AlertTriangle size={11} />} Compliance: {complianceVerdict} ({complianceScore ?? 100}%)
                  </span>
                )}
                {inspection?.quality_verdict && (
                  <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                    <CheckCircle2 size={11} /> DPI Precheck: {inspection.quality_verdict}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{productName} ({versionLabel})</h1>
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
            findings={inspection ? undefined : fallbackFindings}
            customBoxes={customBoxes}
            selectedFindingId={selectedFindingId}
            onSelectFinding={(id) => setSelectedFindingId(id)}
            productName={productName}
            versionLabel={versionLabel}
            previewImageUrl={previewUrl}
          />

          {/* Right: Inspection / Extraction Finding Panel */}
          <FindingPanel
            evaluations={evaluations}
            findings={findings}
            extractedFields={inspection?.extracted_data?.fields}
            selectedFindingId={selectedFindingId}
            onSelectFinding={(id) => setSelectedFindingId(id)}
            onOpenImprove={() => navigate('/improve')}
            complianceVerdict={complianceVerdict}
            complianceScore={complianceScore}
          />
        </div>

      </div>
    </AppShell>
  );
};
