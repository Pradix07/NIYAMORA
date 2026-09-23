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

// shadcn UI Components
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
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

  useEffect(() => {
    if (projectIdFromUrl) {
      loadProject(projectIdFromUrl);
    } else {
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
    }
  };

  const handleCreateAndGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      let activeProj = project;
      const title = `${brandData.brand_name || productData.brand_name || 'Brand'} ${productData.product_name || 'Product'} Packaging`;
      const projectPayload = {
        title,
        packaging_format: packagingFormat,
        dimensions,
        product_data: productData,
        business_data: businessData,
        food_data: foodData,
        nutrition_data: nutritionData,
        declaration_data: declarationData,
        brand_data: brandData,
        custom_direction: brandData.custom_direction,
      };

      if (!activeProj) {
        activeProj = await api.createPackagingProject(projectPayload);
        setProject(activeProj);
        setSearchParams({ id: activeProj.id });
      } else {
        activeProj = await api.updatePackagingProject(activeProj.id, projectPayload);
        setProject(activeProj);
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
    try {
      const updated = await api.acceptRedesign(project.id);
      setProject(updated);
      setRedesignProposal(null);
      setRedesignPrompt('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept redesign proposal');
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'AI Packaging Studio' }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">AI PACKAGING STUDIO</h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Create, inspect, re-design, and prepare 2D/3D packaging artwork for print.
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          {viewMode === 'STUDIO' && project && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('WIZARD')}
                className="btn btn-secondary btn-sm gap-1.5"
              >
                <Sliders size={15} />
                <span>Edit Product Info</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const title = project.title || 'Packaging';
                    const safe = title.replace(/[^a-zA-Z0-9_\-]/g, '_');
                    await api.downloadPackagingPdf(project.id, `${safe}_Print_Export.pdf`);
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to download packaging PDF');
                  }
                }}
                className="btn btn-primary btn-sm gap-1.5 shadow-sm"
              >
                <FileDown size={15} />
                <span>Export Print PDF</span>
              </button>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE 1: GUIDED WIZARD */}
        {viewMode === 'WIZARD' && (
          <div className="space-y-6">
            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between bg-[var(--bg-surface-subtle)] p-2 rounded-xl border border-[var(--border-default)] overflow-x-auto">
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--card-bg)] text-[var(--brand-primary)] shadow-sm font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPassed
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-[var(--border-default)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isPassed ? <Check size={12} /> : st.num}
                    </div>
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Body Content */}
            <Card className="p-6">
              {currentStep === 1 && (
                <Step1ProductBasics data={productData} onChange={(val) => setProductData({ ...productData, ...val })} />
              )}
              {currentStep === 2 && (
                <Step2BusinessLegal data={businessData} onChange={(val) => setBusinessData({ ...businessData, ...val })} />
              )}
              {currentStep === 3 && (
                <Step3FoodInfo
                  foodData={foodData}
                  nutritionData={nutritionData}
                  onFoodChange={(val) => setFoodData({ ...foodData, ...val })}
                  onNutritionChange={(val) => setNutritionData({ ...nutritionData, ...val })}
                />
              )}
              {currentStep === 4 && (
                <Step4Declarations data={declarationData} onChange={(val) => setDeclarationData({ ...declarationData, ...val })} />
              )}
              {currentStep === 5 && (
                <Step5BrandIdentity data={brandData} onChange={(val) => setBrandData({ ...brandData, ...val })} />
              )}
              {currentStep === 6 && (
                <Step6PackagingFormat
                  packagingFormat={packagingFormat}
                  dimensions={dimensions}
                  onFormatChange={(f) => setPackagingFormat(f)}
                  onDimensionsChange={(d) => setDimensions({ ...dimensions, ...d })}
                />
              )}
              {currentStep === 7 && (
                <Step7DesignDirection
                  productData={productData}
                  brandData={brandData}
                  customDirection={brandData.custom_direction}
                  onDirectionChange={(dir) => setBrandData({ ...brandData, custom_direction: dir })}
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

              {/* Wizard Nav Controls */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border-default)]">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="btn btn-secondary btn-sm gap-1 disabled:opacity-40"
                >
                  <ArrowLeft size={15} />
                  <span>Previous</span>
                </button>

                {currentStep < 8 ? (
                  <button
                    onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
                    className="btn btn-primary btn-sm gap-1"
                  >
                    <span>Next Step</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    onClick={handleCreateAndGenerate}
                    disabled={isGenerating}
                    className="btn btn-primary btn-sm gap-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Sparkles size={15} />
                    <span>{isGenerating ? 'Generating 2D & 3D Packaging...' : 'Generate Packaging Artwork'}</span>
                  </button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* MODE 2: INTERACTIVE STUDIO & PREVIEW WORKSPACE */}
        {viewMode === 'STUDIO' && project && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: 2D Dieline / 3D Canvas Preview */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewTab('3D')}
                      className={`btn btn-sm ${previewTab === '3D' ? 'btn-primary' : 'btn-secondary'} text-xs gap-1.5`}
                    >
                      <Box size={14} /> 3D Packaging Mockup
                    </button>
                    <button
                      onClick={() => setPreviewTab('2D')}
                      className={`btn btn-sm ${previewTab === '2D' ? 'btn-primary' : 'btn-secondary'} text-xs gap-1.5`}
                    >
                      <Layers size={14} /> 2D Dieline Canvas
                    </button>
                  </div>

                  <Badge variant="success" className="gap-1">
                    <ShieldCheck size={12} /> Compliance Ready
                  </Badge>
                </div>

                <div className="h-[480px] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-zinc-950">
                  {previewTab === '3D' ? (
                    <Packaging3DViewer
                      formatType={project.packaging_format}
                      panelDesigns={project.panel_designs}
                      focusedPanel={selectedPanel}
                    />
                  ) : (
                    <Packaging2DViewer
                      panelDesigns={project.panel_designs}
                      selectedPanel={selectedPanel}
                      onPanelChange={(p) => setSelectedPanel(p)}
                    />
                  )}
                </div>
              </Card>
            </div>

            {/* Right 5 Columns: AI Redesign & Rule Guidance Panel */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                  <Wand2 className="text-[var(--brand-primary)]" size={18} />
                  <span>AI Redesign & Parameter Assistant</span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Request automatic layout adjustments, font height corrections, or color contrast fixes.
                </p>

                <textarea
                  rows={3}
                  placeholder="e.g. Increase net quantity font height to 3.5mm, make ingredient list bolder, and align FSSAI logo..."
                  value={redesignPrompt}
                  onChange={(e) => setRedesignPrompt(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]"
                />

                <button
                  onClick={handleRequestRedesign}
                  disabled={isRedesigning || !redesignPrompt.trim()}
                  className="btn btn-primary btn-sm w-full gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{isRedesigning ? 'Generating Redesign Proposal...' : 'Apply AI Redesign'}</span>
                </button>

                {redesignProposal && (
                  <div className="p-3.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--brand-primary)]/30 space-y-3">
                    <div className="text-xs font-bold text-[var(--brand-primary)]">Redesign Proposal Ready</div>
                    <ul className="text-xs text-[var(--text-secondary)] list-disc pl-4 space-y-1">
                      {redesignProposal.changes_summary?.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                    <button
                      onClick={handleAcceptRedesign}
                      className="btn btn-primary btn-sm w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      Accept & Update Packaging
                    </button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CreatePackagingPage;
