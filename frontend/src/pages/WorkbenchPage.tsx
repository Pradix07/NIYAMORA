import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ArtworkViewer } from '../components/workbench/ArtworkViewer';
import type { CustomEvidenceBox } from '../components/workbench/ArtworkViewer';
import { FindingPanel } from '../components/workbench/FindingPanel';
import { api } from '../services/api';
import type { ApiInspection, ApiEvaluation, ApiFinding, ApiRiskMapResponse, ApiRiskMapItem } from '../services/api';
import { Wand2, FileText, CheckCircle2, AlertTriangle, ShieldCheck, GitCompare, Map, TrendingDown, Loader2, AlertCircle, Plus, RefreshCw } from 'lucide-react';

export const WorkbenchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get('inspectionId');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<ApiInspection | null>(null);
  const [evaluations, setEvaluations] = useState<ApiEvaluation[]>([]);
  const [findings, setFindings] = useState<ApiFinding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [riskMap, setRiskMap] = useState<ApiRiskMapResponse | null>(null);
  const [showRiskMap, setShowRiskMap] = useState<boolean>(false);

  const loadInspectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      let targetInspectionId = inspectionId;
      if (!targetInspectionId) {
        const inspections = await api.getInspections();
        if (inspections.length > 0) {
          targetInspectionId = inspections[0].id;
        }
      }

      if (targetInspectionId) {
        const inspData = await api.getInspection(targetInspectionId);
        setInspection(inspData);

        if (inspData.panels && inspData.panels.length > 0) {
          setSelectedPanelId(inspData.panels[0].id);
        }

        const [evals, fnds, risk] = await Promise.all([
          api.getEvaluations(targetInspectionId).catch(() => []),
          api.getFindings(targetInspectionId).catch(() => []),
          api.getRiskMap(inspData.product_id, targetInspectionId).catch(() => null),
        ]);

        setEvaluations(evals);
        setFindings(fnds);
        if (risk) setRiskMap(risk);
        if (evals.length > 0) {
          setSelectedFindingId(evals[0].id);
        } else if (fnds.length > 0) {
          setSelectedFindingId(fnds[0].id);
        }
      } else {
        // No inspections found in the system
        setInspection(null);
      }
    } catch (err: any) {
      console.error('Failed to load inspection data:', err);
      setError(err.message || 'Failed to load inspection details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspectionData();
  }, [inspectionId]);

  // Handle finding selection and auto-switch panel if finding belongs to another panel
  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    const ev = evaluations.find((e) => e.id === findingId);
    if (ev?.evidence?.bbox && inspection?.panels && inspection.panels.length > 0) {
      const bbox = ev.evidence.bbox;
      if (bbox.panel_id) {
        const match = inspection.panels.find((p) => p.id === bbox.panel_id);
        if (match) {
          setSelectedPanelId(match.id);
          return;
        }
      }
      if (bbox.panel_type) {
        const match = inspection.panels.find(
          (p) => p.panel_type.toUpperCase() === bbox.panel_type!.toUpperCase()
        );
        if (match) {
          setSelectedPanelId(match.id);
        }
      }
    }
  };

  // Build custom boxes from live extraction & evaluation evidence
  let customBoxes: CustomEvidenceBox[] | undefined = undefined;
  if (evaluations.length > 0) {
    customBoxes = evaluations
      .filter((ev) => ev.evidence?.bbox)
      .map((ev) => {
        const bbox = ev.evidence!.bbox!;
        const riskItem = riskMap?.risk_items?.find((r: ApiRiskMapItem) => r.id === ev.id || r.rule_code === ev.rule_code);
        const statusVal = ev.status === 'PASS' ? 'GOOD' : ev.status === 'ISSUE' ? 'ISSUE' : 'REVIEW';
        
        return {
          id: ev.id,
          x: typeof bbox.x === 'number' ? bbox.x : 10,
          y: typeof bbox.y === 'number' ? bbox.y : 10,
          width: typeof bbox.width === 'number' ? bbox.width : 20,
          height: typeof bbox.height === 'number' ? bbox.height : 10,
          label: showRiskMap && riskItem ? `[DENSITY: ${riskItem.density_level || 'EVALUATED'}] ${ev.rule_title}` : ev.rule_title,
          text: ev.observed_value || undefined,
          status: statusVal,
          panelType: bbox.panel_type || undefined,
          panelId: bbox.panel_id || undefined,
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
        panelType: (field.evidence_box as any)?.panel_type || undefined,
        panelId: (field.evidence_box as any)?.panel_id || undefined,
      }));
  }

  if (loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Workbench' }]}>
        <div style={{ maxWidth: '1000px', margin: '4rem auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loading Inspection Results...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving bounding boxes, OCR extractions, and statutory evaluations.</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Workbench' }]}>
        <div style={{ maxWidth: '800px', margin: '3rem auto' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--status-issue-solid)' }}>
            <AlertCircle size={36} style={{ color: 'var(--status-issue-solid)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unable to Load Inspection</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button onClick={() => loadInspectionData()} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
                <RefreshCw size={14} /> Retry
              </button>
              <button onClick={() => navigate('/products')} className="btn btn-secondary btn-sm">
                View Products
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!inspection) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Workbench' }]}>
        <div style={{ maxWidth: '800px', margin: '3rem auto' }}>
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Packaging Inspection Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Upload your pre-press artwork dieline or packshot to run deterministic Legal Metrology and FSSAI checks.
            </p>
            <button onClick={() => navigate('/new-check')} className="btn btn-primary" style={{ gap: '0.4rem', margin: '0 auto' }}>
              <Plus size={16} /> Run New Packaging Check
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const productName = inspection.product_name || 'Packaging Artwork';
  const brandName = inspection.brand || 'Brand';
  const versionLabel = inspection.version_label || 'V01';
  
  // Calculate active panel preview URL
  const activePanel = inspection.panels?.find((p) => p.id === selectedPanelId);
  const previewUrl = activePanel?.preview_url
    ? api.getFileUrl(activePanel.preview_url)
    : inspection.preview_url
    ? api.getFileUrl(inspection.preview_url)
    : null;

  const complianceVerdict = inspection.compliance_verdict;
  const productId = inspection.product_id;
  const versionId = inspection.artwork_version_id;

  const passCount = evaluations.filter((e) => e.status === 'PASS').length;
  const reviewCount = evaluations.filter((e) => e.status === 'REVIEW').length;
  const issueCount = evaluations.filter((e) => e.status === 'ISSUE').length;

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: productName, path: `/products/${productId}` }, { label: 'Results & Workbench' }]}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  {brandName}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Inspection: {inspection?.id ? `${inspection.id.slice(0, 8)}...` : 'Pre-Flight Master'}</span>
                
                {complianceVerdict && (
                  <span
                    className={`badge ${complianceVerdict === 'PASS' ? 'badge-good' : complianceVerdict === 'ISSUE' ? 'badge-issue' : 'badge-review'}`}
                    style={{ fontSize: '0.6875rem' }}
                  >
                    {complianceVerdict === 'PASS' ? <ShieldCheck size={11} /> : <AlertTriangle size={11} />} Verdict: {complianceVerdict === 'PASS' ? 'Passed' : complianceVerdict === 'ISSUE' ? 'Action Required' : 'Review Required'}
                  </span>
                )}

                {/* Human-readable pass/review/issue pill */}
                {evaluations.length > 0 && (
                  <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                    ✓ {passCount} Passed • ⚠ {reviewCount} Need Review {issueCount > 0 ? `• ✕ ${issueCount} Issue${issueCount > 1 ? 's' : ''}` : ''}
                  </span>
                )}

                {inspection?.quality_verdict && (
                  <span className={`badge ${inspection.quality_verdict === 'GOOD' ? 'badge-good' : 'badge-review'}`} style={{ fontSize: '0.6875rem' }}>
                    <CheckCircle2 size={11} /> Quality: {inspection.quality_verdict === 'GOOD' ? 'Clear & Readable' : 'Review Recommended'}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{productName} ({versionLabel})</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowRiskMap(!showRiskMap)}
              className={`btn btn-sm ${showRiskMap ? 'btn-primary' : 'btn-secondary'}`}
              style={{ gap: '0.35rem' }}
              title="Toggle spatial finding density overlay"
            >
              <Map size={13} />
              <span>{showRiskMap ? 'Hide Attention Map' : 'Attention Map Overlay'}</span>
            </button>

            <button
              onClick={() => navigate(`/improve?productId=${productId}${versionId ? `&versionId=${versionId}` : ''}`)}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.35rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
            >
              <Wand2 size={14} />
              <span>Improve Design</span>
            </button>

            <button
              onClick={() => navigate(`/compare?productId=${productId}`)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <GitCompare size={14} />
              <span>Compare</span>
            </button>

            <button
              onClick={() => navigate(`/regression?productId=${productId}`)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <TrendingDown size={14} />
              <span>View Regression</span>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="btn btn-outline btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <FileText size={14} />
              <span>Audit PDF</span>
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
          {/* Left: Interactive Artwork Canvas with Evidence Bounding Boxes & Panel Switcher */}
          <ArtworkViewer
            findings={undefined}
            customBoxes={customBoxes}
            selectedFindingId={selectedFindingId}
            onSelectFinding={handleSelectFinding}
            productName={productName}
            versionLabel={versionLabel}
            previewImageUrl={previewUrl}
            panels={inspection.panels}
            activePanelId={selectedPanelId || undefined}
            onSelectPanel={(panelId) => setSelectedPanelId(panelId)}
          />

          {/* Right: Inspection / Extraction Finding Panel */}
          <FindingPanel
            evaluations={evaluations}
            findings={findings}
            extractedFields={inspection?.extracted_data?.fields}
            selectedFindingId={selectedFindingId}
            onSelectFinding={handleSelectFinding}
            onOpenImprove={() => navigate(`/improve?productId=${productId}${versionId ? `&versionId=${versionId}` : ''}`)}
            complianceVerdict={complianceVerdict}
          />
        </div>

      </div>
    </AppShell>
  );
};
