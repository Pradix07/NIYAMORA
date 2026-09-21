import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ArtworkViewer } from '../components/workbench/ArtworkViewer';
import type { CustomEvidenceBox } from '../components/workbench/ArtworkViewer';
import { FindingPanel } from '../components/workbench/FindingPanel';
import { api } from '../services/api';
import type { ApiInspection, ApiEvaluation, ApiFinding, ApiRiskMapResponse, ApiRiskMapItem } from '../services/api';
import { Wand2, CheckCircle2, AlertTriangle, ShieldCheck, GitCompare, Map, TrendingDown, Loader2, AlertCircle, Plus, RefreshCw, ChevronDown, FileText } from 'lucide-react';

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
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const ev = evaluations.find((e) => e.id === findingId || e.rule_code === findingId);
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

  // Helper to check for screenshot filename
  const isFilenameLike = (name?: string | null): boolean => {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    if (['screenshot', 'screen shot', 'img_', 'img-', 'dsc_', 'whatsapp', 'pasted', 'image', 'photo', 'scan', 'panel_'].some(p => lower.startsWith(p))) {
      return true;
    }
    if (['.png', '.jpg', '.jpeg', '.pdf', '.webp', '.ai', '.psd'].some(ext => lower.endsWith(ext))) {
      return true;
    }
    return false;
  };

  // Derive clean product name (never display screenshot filename)
  const getCleanProductName = (): string => {
    if (!inspection) return 'Packaging Artwork';
    if (!isFilenameLike(inspection.product_name)) {
      return inspection.product_name;
    }
    const detected = inspection.extracted_data?.fields?.product_name?.extracted_value;
    if (detected && !isFilenameLike(detected)) {
      return detected;
    }
    return 'Nutriva California Almonds';
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
          label: showRiskMap && riskItem ? `[ISSUE AREA] ${ev.rule_title}` : ev.rule_title,
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loading packaging check results...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving your packaging artwork and verification details.</p>
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Packaging Check Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Upload your packaging dieline or artwork image to check against packaging rules.
            </p>
            <button onClick={() => navigate('/new-check')} className="btn btn-primary" style={{ gap: '0.4rem', margin: '0 auto' }}>
              <Plus size={16} /> Run New Packaging Check
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const productName = getCleanProductName();
  const versionLabel = inspection.version_label || 'Version 01';
  
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

  // Simple verdict status
  const verdictLabel = issueCount > 0 ? 'Needs Attention' : reviewCount > 0 ? 'Needs Review' : 'All Checks Passed';
  const verdictBadgeClass = issueCount > 0 ? 'badge-issue' : reviewCount > 0 ? 'badge-review' : 'badge-good';

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: productName, path: `/products/${productId}` }, { label: 'Packaging Check' }]}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', height: 'calc(100vh - 110px)' }}>
        
        {/* Streamlined Top Header: Simple, Uncrowded */}
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
          {/* Left: Product & Verdict Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{productName}</h1>
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                  {versionLabel}
                </span>

                <span className={`badge ${verdictBadgeClass}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {issueCount > 0 ? <AlertTriangle size={12} /> : reviewCount > 0 ? <AlertCircle size={12} /> : <ShieldCheck size={12} />}
                  <span>{verdictLabel}</span>
                </span>

                {/* Factual counts only */}
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {issueCount > 0 ? `${issueCount} issue${issueCount > 1 ? 's' : ''} found · ` : ''}
                  {reviewCount} need review · {passCount} passed
                </span>

                {/* Subtle Image Quality Warning if Needed */}
                {inspection?.quality_verdict && inspection.quality_verdict !== 'GOOD' && (
                  <span className="badge badge-review" style={{ fontSize: '0.6875rem' }} title="Some small details may be difficult to verify on this image.">
                    <CheckCircle2 size={11} /> Image quality needs review
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Primary Action + Clean More Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigate(`/improve?productId=${productId}${versionId ? `&versionId=${versionId}` : ''}`)}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.4rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
            >
              <Wand2 size={14} />
              <span>Improve Design</span>
            </button>

            {/* Secondary Actions Dropdown */}
            <div style={{ position: 'relative' }} ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem' }}
                aria-expanded={showMoreMenu}
              >
                <span>More</span>
                <ChevronDown size={13} />
              </button>

              {showMoreMenu && (
                <div
                  className="card animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    zIndex: 50,
                    minWidth: '200px',
                    padding: '0.35rem',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <button
                    onClick={() => { setShowMoreMenu(false); navigate(`/compare?productId=${productId}`); }}
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <GitCompare size={14} />
                    <span>Compare versions</span>
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); navigate(`/regression?productId=${productId}`); }}
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <TrendingDown size={14} />
                    <span>Check changes / Regression</span>
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); navigate('/reports'); }}
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FileText size={14} />
                    <span>Download report</span>
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); setShowRiskMap(!showRiskMap); }}
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Map size={14} />
                    <span>{showRiskMap ? 'Hide issue areas' : 'Show issue areas'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workbench Split Workspace */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.35fr 1fr',
            gap: '1rem',
            minHeight: 0,
          }}
        >
          {/* Left: Artwork Canvas with Real Artwork & Simplified Controls */}
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
            showRiskMap={showRiskMap}
            onToggleRiskMap={() => setShowRiskMap(!showRiskMap)}
          />

          {/* Right: Simplified Findings & Extracted Information Panel */}
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
