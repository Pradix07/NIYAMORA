import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DiffVisualizer } from '../components/improve/DiffVisualizer';
import { api } from '../services/api';
import type { ApiSuggestedDesign, ApiProduct, ApiInspection, ApiPanel } from '../services/api';
import { Sparkles, Loader2, AlertCircle, Wand2 } from 'lucide-react';

export const ImproveDesignPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('productId');
  const queryVersionId = searchParams.get('versionId');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [suggestedDesign, setSuggestedDesign] = useState<ApiSuggestedDesign | null>(null);
  const [panels, setPanels] = useState<ApiPanel[]>([]);
  const [activeInspection, setActiveInspection] = useState<ApiInspection | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        let currentProduct: ApiProduct | null = null;
        if (queryProductId) {
          currentProduct = await api.getProduct(queryProductId).catch(() => null);
        }

        if (!currentProduct) {
          const products = await api.getProducts().catch(() => []);
          if (products.length > 0) {
            currentProduct = products[0];
          }
        }

        setProduct(currentProduct);

        if (currentProduct) {
          const inspections = await api.getInspections().catch(() => []);
          const prodInsp = inspections.find((i) => i.product_id === currentProduct!.id);
          setActiveInspection(prodInsp || null);

          if (prodInsp?.panels) {
            setPanels(prodInsp.panels);
          }

          // Check for existing suggested designs ONLY (do NOT auto-create V02 on page load)
          const existingDesigns = await api.listSuggestedDesigns(currentProduct.id).catch(() => []);
          if (existingDesigns.length > 0) {
            setSuggestedDesign(existingDesigns[0]);
          } else {
            setSuggestedDesign(null);
          }
        }
      } catch (err: any) {
        console.warn('Failed to load improve design data:', err);
        setError(err.message || 'Failed to load suggested improvement plan.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryProductId, queryVersionId]);

  const handleCreateSuggestedDesign = async () => {
    if (!product) return;
    setIsCreating(true);
    setError(null);
    try {
      const versionId = queryVersionId || activeInspection?.artwork_version_id;
      if (!versionId) {
        throw new Error('No uploaded artwork version found for this product. Run an initial check first.');
      }
      const created = await api.suggestDesign(product.id, versionId);
      setSuggestedDesign(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create suggested design.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (suggestedDesign?.id) {
      const safe = (product?.name || 'Product').replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `${safe}_NIYAMORA_Suggested_Design_${suggestedDesign.version_label || 'V02'}.pdf`;
      try {
        await api.downloadSuggestedDesignPdf(suggestedDesign.id, filename);
      } catch (err: any) {
        alert(`Download failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleRunVerification = async () => {
    if (!suggestedDesign?.id) return;
    setIsVerifying(true);
    try {
      const updated = await api.verifySuggestedDesign(suggestedDesign.id);
      setSuggestedDesign(updated);
    } catch (err: any) {
      alert(`Verification failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompareVersions = () => {
    if (product?.id) {
      navigate(`/compare?productId=${product.id}`);
    } else {
      navigate('/compare');
    }
  };

  const handleViewRegression = () => {
    if (product?.id) {
      navigate(`/regression?productId=${product.id}`);
    } else {
      navigate('/regression');
    }
  };

  const prodName = product?.name || 'Packaging Artwork';
  const prodBrand = product?.brand || 'Brand';
  const prodId = product?.id || '';

  if (loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Improve Design' }]}>
        <div style={{ maxWidth: '1400px', margin: '4rem auto', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading design suggestions...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: prodName, path: prodId ? `/products/${prodId}` : '/products' }, { label: 'Improve Design' }]}>
        <div style={{ maxWidth: '800px', margin: '3rem auto' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--status-issue-solid)' }}>
            <AlertCircle size={36} style={{ color: 'var(--status-issue-solid)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unable to Load Improvement Plan</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>
            <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ margin: '0 auto' }}>
              View Products
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!suggestedDesign) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: prodName, path: prodId ? `/products/${prodId}` : '/products' }, { label: 'Improve Design' }]}>
        <div style={{ maxWidth: '800px', margin: '3rem auto' }}>
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Sparkles size={24} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Suggested Design Created Yet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Generate deterministic, compliance-verified packaging adjustments (V02) based on statutory findings. Original branding and layout are preserved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleCreateSuggestedDesign}
                disabled={isCreating}
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                <span>{isCreating ? 'Creating Suggested Design (V02)...' : 'Create Suggested Design (V02)'}</span>
              </button>
              <button onClick={() => navigate('/workbench')} className="btn btn-secondary">
                Back to Workbench
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const sourcePreview = suggestedDesign.source_preview_url ? api.getFileUrl(suggestedDesign.source_preview_url) : null;
  const sugPreview = suggestedDesign.preview_url ? api.getFileUrl(suggestedDesign.preview_url) : null;

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: prodName, path: `/products/${prodId}` }, { label: 'Improve Design' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <DiffVisualizer
          productName={prodName}
          brandName={prodBrand}
          sourceVersionLabel="V01"
          suggestedVersionLabel={suggestedDesign.version_label || 'V02'}
          sourcePreviewUrl={sourcePreview}
          suggestedPreviewUrl={sugPreview}
          changes={suggestedDesign.change_set || []}
          panels={panels}
          validationStatus={suggestedDesign.validation_status || 'IMPROVED'}
          status={suggestedDesign.status || 'RENDERED'}
          onDownloadPdf={handleDownloadPdf}
          onRunVerification={handleRunVerification}
          onCompareVersions={handleCompareVersions}
          onViewRegression={handleViewRegression}
          isVerifying={isVerifying}
        />
      </div>
    </AppShell>
  );
};
