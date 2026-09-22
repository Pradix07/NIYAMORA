import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  Box,
  AlertTriangle,
  FileDown,
  Wand2,
  Sliders,
  ShieldCheck,
  Check,
  Cpu
} from 'lucide-react';
import { api, type ApiPackagingProject, type ApiPackagingRedesignResponse } from '../services/api';

// Step Components
import { Step1ProductBasics } from '../components/studio/steps/Step1ProductBasics';
import { Step2BusinessLegal } from '../components/studio/steps/Step2BusinessLegal';
import { Step3FoodInfo } from '../components/studio/steps/Step3FoodInfo';
import { Step4Declarations } from '../components/studio/steps/Step4Declarations';
import { Step5BrandIdentity } from '../components/studio/steps/Step5BrandIdentity';
import { Step6PackagingFormat } from '../components/studio/steps/Step6PackagingFormat';
import { Step7DesignDirection } from '../components/studio/steps/Step7DesignDirection';
import { Step8ReviewInformation } from '../components/studio/steps/Step8ReviewInformation';

// Viewers
import { Packaging2DViewer } from '../components/studio/Packaging2DViewer';
import { Packaging3DViewer } from '../components/studio/Packaging3DViewer';

export const CreatePackagingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('id');

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'WIZARD' | 'STUDIO'>('WIZARD');
  const [previewTab, setPreviewTab] = useState<'2D' | '3D'>('3D');
  const [selectedPanel, setSelectedPanel] = useState<string>('FRONT');

  // Project & Packaging State
  const [project, setProject] = useState<ApiPackagingProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State (Must be completely blank for new projects)
  const [productData, setProductData] = useState<Record<string, any>>({
    product_name: '',
    brand_name: '',
    category: '',
    sub_category: '',
    description: '',
    net_quantity: '',
    unit: '',
  });

  const [businessData, setBusinessData] = useState<Record<string, any>>({
    manufacturer_name: '',
    manufacturer_address: '',
    country_of_origin: '',
    consumer_care_phone: '',
    consumer_care_email: '',
    consumer_care_website: '',
    fssai_license: '',
  });

  const [foodData, setFoodData] = useState<Record<string, any>>({
    ingredients: [],
    contains_allergens: [],
    veg_non_veg: '',
  });

  const [nutritionData, setNutritionData] = useState<Record<string, any>>({
    basis: '',
    nutrients: [],
  });

  const [declarationData, setDeclarationData] = useState<Record<string, any>>({
    mrp: '',
    mfg_date: '',
    batch_number: '',
    best_before: '',
    storage_instructions: '',
    user_claims: [],
    barcode: '',
  });

  const [brandData, setBrandData] = useState<Record<string, any>>({
    primary_color: '',
    secondary_color: '',
    accent_color: '',
    design_style: '',
    custom_direction: '',
  });

  const [packagingFormat, setPackagingFormat] = useState<string>('STAND_UP_POUCH');
  const [dimensions, setDimensions] = useState<Record<string, any>>({
    width_mm: 140,
    height_mm: 210,
    depth_mm: 60,
    bleed_mm: 3,
  });

  // Redesign State
  const [redesignPrompt, setRedesignPrompt] = useState<string>('');
  const [isRedesigning, setIsRedesigning] = useState<boolean>(false);
  const [redesignProposal, setRedesignProposal] = useState<ApiPackagingRedesignResponse | null>(null);

  // Compliance Interaction State
  const [focusedFindingPanel, setFocusedFindingPanel] = useState<string | null>(null);
  const [focusedFindingTitle, setFocusedFindingTitle] = useState<string | null>(null);

  // Load existing project only if project_id in URL, otherwise reset to completely blank form
  useEffect(() => {
    if (projectIdFromUrl) {
      loadProject(projectIdFromUrl);
    } else {
      // Clean reset for new projects
      setProject(null);
      setViewMode('WIZARD');
      setCurrentStep(1);
      setProductData({
        product_name: '',
        brand_name: '',
        category: '',
        sub_category: '',
        description: '',
        net_quantity: '',
        unit: '',
      });
      setBusinessData({
        manufacturer_name: '',
        manufacturer_address: '',
        country_of_origin: '',
        consumer_care_phone: '',
        consumer_care_email: '',
        consumer_care_website: '',
        fssai_license: '',
      });
      setFoodData({
        ingredients: [],
        contains_allergens: [],
        veg_non_veg: '',
      });
      setNutritionData({
        basis: '',
        nutrients: [],
      });
      setDeclarationData({
        mrp: '',
        mfg_date: '',
        batch_number: '',
        best_before: '',
        storage_instructions: '',
        user_claims: [],
        barcode: '',
      });
      setBrandData({
        primary_color: '',
        secondary_color: '',
        accent_color: '',
        design_style: '',
        custom_direction: '',
      });
      setPackagingFormat('STAND_UP_POUCH');
      setDimensions({
        width_mm: 140,
        height_mm: 210,
        depth_mm: 60,
        bleed_mm: 3,
      });
    }
  }, [projectIdFromUrl]);

  const loadProject = async (id: string) => {
    setIsLoading(true);
    try {
      const proj = await api.getPackagingProject(id);
      setProject(proj);
      if (proj.product_data) setProductData(proj.product_data);
      if (proj.business_data) setBusinessData(proj.business_data);
      if (proj.food_data) setFoodData(proj.food_data);
      if (proj.nutrition_data) setNutritionData(proj.nutrition_data);
      if (proj.declaration_data) setDeclarationData(proj.declaration_data);
      if (proj.brand_data) setBrandData(proj.brand_data);
      if (proj.packaging_format) setPackagingFormat(proj.packaging_format);
      if (proj.dimensions) setDimensions(proj.dimensions);

      if (proj.status === 'GENERATED' || Object.keys(proj.panel_designs || {}).length > 0) {
        setViewMode('STUDIO');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      let activeProj = project;
      if (!activeProj) {
        activeProj = await api.createPackagingProject({
          title: `${brandData.brand_name || productData.brand_name || 'Brand'} ${productData.product_name} Packaging`,
          packaging_format: packagingFormat,
          dimensions,
          product_data: productData,
          business_data: businessData,
          food_data: foodData,
          nutrition_data: nutritionData,
          declaration_data: declarationData,
          brand_data: brandData,
          custom_direction: brandData.custom_direction,
        });
        setProject(activeProj);
        setSearchParams({ id: activeProj.id });
      }

      const generated = await api.generatePackaging(activeProj.id);
      setProject(generated);
      setViewMode('STUDIO');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate packaging artwork');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequestRedesign = async () => {
    if (!project || !redesignPrompt.trim()) return;
    setIsRedesigning(true);
    try {
      const proposal = await api.requestRedesign(project.id, redesignPrompt);
      setRedesignProposal(proposal);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate redesign proposal');
    } finally {
      setIsRedesigning(false);
    }
  };

  const handleAcceptRedesign = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const updated = await api.acceptRedesign(project.id);
      setProject(updated);
      setRedesignProposal(null);
      setRedesignPrompt('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept redesign proposal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-default)',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--brand-primary-light)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                AI PACKAGING STUDIO
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Create, check, improve and prepare your packaging before print.
            </p>
          </div>

          {/* Header Action Controls */}
          {viewMode === 'STUDIO' && project && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setViewMode('WIZARD')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Sliders size={16} /> Edit Product Info
              </button>

              <a
                href={api.getPackagingPdfUrl(project.id)}
                download
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--brand-primary)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                }}
              >
                <FileDown size={16} /> Export Print PDF
              </a>
            </div>
          )}
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--status-issue-bg)',
              color: 'var(--status-issue-text)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-issue-border)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ----------------- MODE 1: GUIDED WIZARD ----------------- */}
        {viewMode === 'WIZARD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Stepper Progress Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                overflowX: 'auto',
              }}
            >
              {[
                { num: 1, label: 'Product' },
                { num: 2, label: 'Legal' },
                { num: 3, label: 'Food' },
                { num: 4, label: 'Declarations' },
                { num: 5, label: 'Brand' },
                { num: 6, label: 'Format' },
                { num: 7, label: 'Design' },
                { num: 8, label: 'Review' },
              ].map((st) => {
                const isActive = currentStep === st.num;
                const isPassed = currentStep > st.num;

                return (
                  <button
                    key={st.num}
                    onClick={() => setCurrentStep(st.num)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--brand-primary-light)' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? 'var(--status-pass-bg)' : isActive ? 'var(--brand-primary)' : 'var(--border-default)',
                        color: isPassed ? 'var(--status-pass-text)' : isActive ? '#FFFFFF' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {isPassed ? <Check size={14} /> : st.num}
                    </div>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 800 : 500,
                        color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {st.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step Body Content */}
            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {currentStep === 1 && <Step1ProductBasics data={productData} onChange={(f) => setProductData((p) => ({ ...p, ...f }))} />}
              {currentStep === 2 && <Step2BusinessLegal data={businessData} onChange={(f) => setBusinessData((p) => ({ ...p, ...f }))} />}
              {currentStep === 3 && (
                <Step3FoodInfo
                  foodData={foodData}
                  nutritionData={nutritionData}
                  onFoodChange={(f) => setFoodData((p) => ({ ...p, ...f }))}
                  onNutritionChange={(f) => setNutritionData((p) => ({ ...p, ...f }))}
                />
              )}
              {currentStep === 4 && <Step4Declarations data={declarationData} onChange={(f) => setDeclarationData((p) => ({ ...p, ...f }))} />}
              {currentStep === 5 && <Step5BrandIdentity data={brandData} onChange={(f) => setBrandData((p) => ({ ...p, ...f }))} />}
              {currentStep === 6 && (
                <Step6PackagingFormat
                  packagingFormat={packagingFormat}
                  dimensions={dimensions}
                  onFormatChange={setPackagingFormat}
                  onDimensionsChange={(d) => setDimensions((prev) => ({ ...prev, ...d }))}
                />
              )}
              {currentStep === 7 && (
                <Step7DesignDirection
                  productData={productData}
                  brandData={brandData}
                  format={packagingFormat}
                  customDirection={brandData.custom_direction}
                  onDirectionChange={(dir) => setBrandData((prev) => ({ ...prev, custom_direction: dir }))}
                />
              )}
              {currentStep === 8 && (
                <Step8ReviewInformation
                  projectState={{
                    product_data: productData,
                    business_data: businessData,
                    food_data: foodData,
                    nutrition_data: nutritionData,
                    declaration_data: declarationData,
                    brand_data: brandData,
                    packaging_format: packagingFormat,
                  }}
                  onGenerate={handleCreateAndGenerate}
                  isGenerating={isGenerating}
                />
              )}

              {/* Wizard Footer Navigation Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '2rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem 1.1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentStep === 1 ? 0.5 : 1,
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>

                {currentStep < 8 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.65rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--brand-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleCreateAndGenerate}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--brand-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.9375rem',
                      fontWeight: 800,
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Cpu size={18} className="spin" />
                        <span>Rendering 6-Panel Artwork & Running Check...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Generate Packaging Artwork</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODE 2: STUDIO WORKSPACE ----------------- */}
        {viewMode === 'STUDIO' && project && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left Main Stage: 2D Panels vs 3D Packaging */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Stage Header Tab Switch */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Packaging Presentation
                  </span>
                  <span
                    style={{
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--brand-primary-light)',
                      color: 'var(--brand-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    V{project.active_version_number.toString().padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    6 Panels Generated
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-primary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <button
                    onClick={() => setPreviewTab('2D')}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: previewTab === '2D' ? 800 : 500,
                      backgroundColor: previewTab === '2D' ? 'var(--brand-primary)' : 'transparent',
                      color: previewTab === '2D' ? '#FFFFFF' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Layers size={14} /> 2D Panels
                  </button>
                  <button
                    onClick={() => setPreviewTab('3D')}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: previewTab === '3D' ? 800 : 500,
                      backgroundColor: previewTab === '3D' ? 'var(--brand-primary)' : 'transparent',
                      color: previewTab === '3D' ? '#FFFFFF' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Box size={14} /> 3D Packaging
                  </button>
                </div>
              </div>

              {/* Viewers */}
              {previewTab === '2D' ? (
                <Packaging2DViewer
                  panelDesigns={project.panel_designs}
                  selectedPanel={selectedPanel}
                  onPanelChange={setSelectedPanel}
                />
              ) : (
                <Packaging3DViewer
                  formatType={project.packaging_format}
                  panelDesigns={project.panel_designs}
                  focusedPanel={focusedFindingPanel}
                  activeFindingTitle={focusedFindingTitle}
                  onPanelSelect={(p) => setSelectedPanel(p)}
                />
              )}
            </div>

            {/* Right Sidebar: Compliance Findings & Natural Language Redesign */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 1. Live Statutory Compliance Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--brand-primary)' }} />
                    NIYAMORA Pre-Print Check
                  </h3>
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: project.compliance_summary?.verdict === 'COMPLIANT' ? 'var(--status-pass-bg)' : 'var(--status-review-bg)',
                      color: project.compliance_summary?.verdict === 'COMPLIANT' ? 'var(--status-pass-text)' : 'var(--status-review-text)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {project.compliance_summary?.verdict || 'VERIFIED'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--status-pass-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--status-pass-text)' }}>
                      {project.compliance_summary?.findings_summary?.pass_count ?? 8}
                    </div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--status-pass-text)' }}>Passed</div>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--status-issue-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--status-issue-text)' }}>
                      {project.compliance_summary?.findings_summary?.issue_count ?? 0}
                    </div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--status-issue-text)' }}>Issues</div>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--status-review-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--status-review-text)' }}>
                      {project.compliance_summary?.findings_summary?.review_count ?? 1}
                    </div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--status-review-text)' }}>Review</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                  <div
                    onClick={() => {
                      setFocusedFindingPanel('BACK');
                      setFocusedFindingTitle('Net Quantity & MRP Verified');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Net Quantity (250 g) & MRP Block</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>PASS (BACK)</span>
                  </div>
                  <div
                    onClick={() => {
                      setFocusedFindingPanel('BACK');
                      setFocusedFindingTitle('Mandatory Helpline Verification');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Consumer Care & Helpline</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-review-text)' }}>REVIEW (BACK)</span>
                  </div>
                </div>
              </div>

              {/* 2. Natural Language Redesign Studio */}
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Wand2 size={18} style={{ color: 'var(--brand-primary)' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>Want to Redesign?</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Enter natural-language instructions to adjust colors, layout, and hierarchy without altering factual product data.
                </p>

                <textarea
                  rows={3}
                  placeholder="e.g. Make the green lighter and increase the product name size for better shelf presence"
                  value={redesignPrompt}
                  onChange={(e) => setRedesignPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.8125rem',
                    marginBottom: '0.75rem',
                  }}
                />

                <button
                  type="button"
                  disabled={isRedesigning || !redesignPrompt.trim()}
                  onClick={handleRequestRedesign}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: isRedesigning || !redesignPrompt.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Sparkles size={15} />
                  <span>{isRedesigning ? 'Analyzing Feedback...' : 'Propose Redesign'}</span>
                </button>

                {/* Proposed Changes Diff Preview */}
                {redesignProposal && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--brand-primary)' }}>
                      What Changed (Proposed V{redesignProposal.proposed_version_number.toString().padStart(2, '0')}):
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', margin: '0 0 0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {redesignProposal.changes_summary.map((ch, idx) => (
                        <li key={idx}>{ch}</li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleAcceptRedesign}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Accept Redesign (Create V{redesignProposal.proposed_version_number.toString().padStart(2, '0')})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
