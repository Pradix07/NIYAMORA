import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DiffVisualizer } from '../components/improve/DiffVisualizer';
import { api } from '../services/api';
import type { ApiSuggestedDesign, ApiProduct } from '../services/api';
import { Sparkles, Loader2, AlertCircle, Plus } from 'lucide-react';

export const ImproveDesignPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('productId');
  const queryVersionId = searchParams.get('versionId');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [suggestedDesign, setSuggestedDesign] = useState<ApiSuggestedDesign | null>(null);

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
          // Check for existing suggested designs
          const existingDesigns = await api.listSuggestedDesigns(currentProduct.id).catch(() => []);
          if (existingDesigns.length > 0) {
            setSuggestedDesign(existingDesigns[0]);
          } else {
            // Find latest inspection or version to trigger suggest
            const inspections = await api.getInspections().catch(() => []);
            const prodInsp = inspections.find((i) => i.product_id === currentProduct!.id);
            const versionId = queryVersionId || prodInsp?.artwork_version_id;

            if (versionId) {
              const created = await api.suggestDesign(currentProduct.id, versionId).catch((err) => {
                console.warn('Could not generate live suggestion:', err);
                return null;
              });
              if (created) {
                setSuggestedDesign(created);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('Failed to load live improve design data:', err);
        setError(err.message || 'Failed to load suggested improvement plan.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryProductId, queryVersionId]);

  const handleDownloadPdf = () => {
    if (suggestedDesign?.id) {
      window.open(api.getSuggestedDesignPdfUrl(suggestedDesign.id), '_blank');
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
          <p style={{ color: 'var(--text-secondary)' }}>Generating compliance improvement dieline...</p>
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Improvement Plan Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Upload packaging artwork and run an automated pre-flight inspection check to generate deterministic dieline corrections and layout suggestions.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button onClick={() => navigate('/new-check')} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                <Plus size={16} /> Run New Packaging Check
              </button>
              <button onClick={() => navigate('/products')} className="btn btn-secondary">
                View Products
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
