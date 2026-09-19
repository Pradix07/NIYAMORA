import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DiffVisualizer } from '../components/improve/DiffVisualizer';
import { SAMPLE_SUGGESTED_CHANGES, SAMPLE_PRODUCTS } from '../data/mockData';

export const ImproveDesignPage: React.FC = () => {
  const navigate = useNavigate();
  const product = SAMPLE_PRODUCTS[0];

  const handleDownloadPdf = () => {
    alert('Sample Download: Suggested_Design_V02_NIYAMORA.pdf');
  };

  const handleDownloadImage = () => {
    alert('Sample Download: HighRes_Render_Compliant_V02.png');
  };

  const handleViewReport = () => {
    navigate('/reports');
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Products', path: '/products' }, { label: product.name, path: `/products/${product.id}` }, { label: 'Improve Design' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <DiffVisualizer
          changes={SAMPLE_SUGGESTED_CHANGES}
          onDownloadPdf={handleDownloadPdf}
          onDownloadImage={handleDownloadImage}
          onViewReport={handleViewReport}
        />
      </div>
    </AppShell>
  );
};
