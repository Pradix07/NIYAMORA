import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import type { PackagingType } from '../types';
import { api } from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  Image, 
  Layers, 
  Link2, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const NewCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadMode, setUploadMode] = useState<'artwork' | 'photo' | 'multi' | 'ecom'>('artwork');
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<PackagingType>('Stand-Up Pouch');
  const [brandName, setBrandName] = useState('');
  const [netQuantity, setNetQuantity] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (file: File) => {
    setActualFile(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setSelectedFileMeta({
      name: file.name,
      size: `${sizeInMb} MB`,
      type: file.type || 'Artwork File',
    });
    setErrorMessage(null);
    if (!productName) {
      // derive clean product name from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setProductName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleStartCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualFile && !selectedFileMeta) {
      setErrorMessage('Please select or drag-and-drop a packaging artwork file (PDF, PNG, JPG).');
      return;
    }
    if (!productName.trim()) {
      setErrorMessage('Please provide a Product Master Name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (actualFile) {
        formData.append('file', actualFile);
      } else {
        const dummyContent = `%PDF-1.4\n1 0 obj\n<< /Title (${productName}) /Author (${brandName || 'Company'}) >>\nendobj\n%%EOF`;
        const blob = new Blob([dummyContent], { type: 'application/pdf' });
        const dummyFile = new File([blob], selectedFileMeta?.name || 'packaging_artwork.pdf', { type: 'application/pdf' });
        formData.append('file', dummyFile);
      }

      formData.append('product_name', productName);
      formData.append('brand', brandName);
      formData.append('packaging_type', productType);
      formData.append('net_quantity', netQuantity);
      formData.append('source_type', uploadMode === 'photo' ? 'PRODUCT_PHOTO' : uploadMode === 'multi' ? 'MULTIPLE_IMAGES' : 'PACKAGING_ARTWORK');

      const response = await api.uploadCheck(formData);
      navigate(`/processing?inspectionId=${response.inspection_id}`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload artwork and initiate inspection. Please verify backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: 'New Check' }]}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div>
          <span className="badge badge-sample" style={{ marginBottom: '0.35rem' }}>Pre-Print Screening</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Start a New Packaging Check</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Upload packaging dielines or high-resolution packshots to evaluate against Legal Metrology, FSSAI, and mandatory declaration rules.
          </p>
        </div>

        {errorMessage && (
          <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'var(--status-issue-bg)', border: '1px solid var(--status-issue-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-issue-text)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleStartCheck} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Ingestion Source Selector */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.875rem' }}>
              1. Select Input Source
            </h3>

            <div className="grid-4" style={{ gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setUploadMode('artwork')}
                className="card-tactile"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  border: uploadMode === 'artwork' ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                  backgroundColor: uploadMode === 'artwork' ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                }}
              >
                <FileText size={22} style={{ color: uploadMode === 'artwork' ? 'var(--brand-primary)' : 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Packaging Artwork (PDF / AI)</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Vector Dielines</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('photo')}
                className="card-tactile"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  border: uploadMode === 'photo' ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                  backgroundColor: uploadMode === 'photo' ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                }}
              >
                <Image size={22} style={{ color: uploadMode === 'photo' ? 'var(--brand-primary)' : 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>High-Res Packshot</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>300 DPI Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('multi')}
                className="card-tactile"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  border: uploadMode === 'multi' ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                  backgroundColor: uploadMode === 'multi' ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                }}
              >
                <Layers size={22} style={{ color: uploadMode === 'multi' ? 'var(--brand-primary)' : 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Multiple Image Panels</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Front / Back / Sides</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('ecom')}
                className="card-tactile"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  border: uploadMode === 'ecom' ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                  backgroundColor: uploadMode === 'ecom' ? 'var(--brand-primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                }}
              >
                <Link2 size={22} style={{ color: uploadMode === 'ecom' ? 'var(--brand-primary)' : 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>E-Commerce Listing</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Catalog Ingest</span>
              </button>
            </div>
          </div>

          {/* Section 2: Upload Drop Zone */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.875rem' }}>
              2. Upload Artwork File
            </h3>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              style={{
                border: isDragging ? '2px dashed var(--brand-primary)' : '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: isDragging ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--brand-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <UploadCloud size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Drag and drop your packaging file here, or browse
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1rem' }}>
                Supports PDF (Vector / Dieline), PNG, JPEG, or WEBP up to 100MB.
              </p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                Browse Local Files
              </button>
            </div>

            {/* Selected File Preview */}
            {selectedFileMeta && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block' }}>
                      {selectedFileMeta.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {selectedFileMeta.size} • {selectedFileMeta.type}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-good" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={12} /> Ready for Ingestion
                  </span>
                  <button type="button" onClick={() => { setSelectedFileMeta(null); setActualFile(null); }} className="btn-icon" style={{ width: '28px', height: '28px' }} aria-label="Remove file">
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Quality Precheck Notice */}
            <div style={{ marginTop: '0.875rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Info size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
              <span>
                <strong>Pre-Flight Ingestion:</strong> Files are validated, stored in secure company storage, and analyzed for resolution, focus, and statutory typography.
              </span>
            </div>
          </div>

          {/* Section 3: Product Master Information */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.875rem' }}>
              3. Product Information (Auto-detected or Specified)
            </h3>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Product Master Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Chia Crunch Pouch"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aura Botanicals"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Packaging Format
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as PackagingType)}
                  style={{ width: '100%' }}
                >
                  <option value="Stand-Up Pouch">Stand-Up Pouch</option>
                  <option value="Glass Bottle">Glass Bottle</option>
                  <option value="Rigid Carton">Rigid Carton</option>
                  <option value="Jar / Tub">Jar / Tub</option>
                  <option value="Tin Can">Tin Can</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Declared Net Quantity (for Rule 9 Sizing)
                </label>
                <input
                  type="text"
                  value={netQuantity}
                  onChange={(e) => setNetQuantity(e.target.value)}
                  placeholder="e.g. 250 g"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Submission CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{ gap: '0.5rem', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Uploading Artwork...</span>
                </>
              ) : (
                <>
                  <span>Ingest & Extract Packaging</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </AppShell>
  );
};
