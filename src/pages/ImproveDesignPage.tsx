import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DiffVisualizer } from '../components/improve/DiffVisualizer';
import { api } from '../services/api';
import type { ApiSuggestedDesign, ApiProduct } from '../services/api';
import { SAMPLE_SUGGESTED_CHANGES, SAMPLE_PRODUCTS } from '../data/mockData';

export const ImproveDesignPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get('productId');
  const queryVersionId = searchParams.get('versionId');

  const [loading, setLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [suggestedDesign, setSuggestedDesign] = useState<ApiSuggestedDesign | null>(null);

  const fallbackProduct = SAMPLE_PRODUCTS[0];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
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
      } catch (err) {
        console.warn('Failed to load live improve design data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryProductId, queryVersionId]);

  const handleDownloadPdf = () => {
    if (suggestedDesign?.id) {
      window.open(api.getSuggestedDesignPdfUrl(suggestedDesign.id), '_blank');
    } else {
      alert('Generating Suggested Design PDF...');
    }
  };

  const handleRunVerification = async () => {
    if (!suggestedDesign?.id) return;
    setIsVerifying(true);
    try {
      const updated = await api.verifySuggestedDesign(suggestedDesign.id);
      setSuggestedDesign(updated);
    } catch (err) {
      alert(`Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompareVersions = () => {
    const prodId = product?.id || fallbackProduct.id;
    navigate(`/compare?productId=${prodId}`);
  };

  const handleViewRegression = () => {
    const prodId = product?.id || fallbackProduct.id;
    navigate(`/regression?productId=${prodId}`);
  };

  // Convert sample changes to API format if fallback
  const mappedChanges = suggestedDesign?.change_set?.length
    ? suggestedDesign.change_set
    : SAMPLE_SUGGESTED_CHANGES.map((sc) => ({
        change_id: sc.id,
        field_key: sc.element.toLowerCase().replace(/\s+/g, '_'),
        field_name: sc.element,
        original_value: sc.originalSpec,
        suggested_value: sc.suggestedSpec,
        original_location: { x: 10, y: 70, width: 80, height: 12 },
        suggested_location: { x: 10, y: 70, width: 80, height: 12 },
        reason: sc.rationale,
        rule_code: 'LMPC-DECL-NET-QTY',
        change_type: 'CORRECTION' as const,
        status: sc.status === 'Fixed' ? ('FIXED' as const) : ('IMPROVED' as const),
      }));

  const prodName = product?.name || fallbackProduct.name;
  const prodBrand = product?.brand || fallbackProduct.brand;
  const sourcePreview = suggestedDesign?.source_preview_url ? api.getFileUrl(suggestedDesign.source_preview_url) : null;
  const sugPreview = suggestedDesign?.preview_url ? api.getFileUrl(suggestedDesign.preview_url) : null;

  if (loading && !suggestedDesign && !product) {
    return (
      <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: 'Improve Design' }]}>
        <div style={{ maxWidth: '1400px', margin: '4rem auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading suggested compliance design...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: prodName, path: `/products/${product?.id || fallbackProduct.id}` }, { label: 'Improve Design' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <DiffVisualizer
          productName={prodName}
          brandName={prodBrand}
          sourceVersionLabel={suggestedDesign?.version_label === 'V02' ? 'V01' : 'V01'}
          suggestedVersionLabel={suggestedDesign?.version_label || 'V02'}
          sourcePreviewUrl={sourcePreview}
          suggestedPreviewUrl={sugPreview}
          changes={mappedChanges}
          validationStatus={suggestedDesign?.validation_status || 'IMPROVED'}
          status={suggestedDesign?.status || 'RENDERED'}
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
