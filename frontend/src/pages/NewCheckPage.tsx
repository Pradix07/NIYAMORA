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
  AlertCircle,
  Plus
} from 'lucide-react';

interface UploadedPanelItem {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  panelType: 'FRONT' | 'BACK' | 'SIDE_LEFT' | 'SIDE_RIGHT' | 'TOP' | 'BOTTOM' | 'OTHER';
  previewUrl?: string;
}

export const NewCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadMode, setUploadMode] = useState<'artwork' | 'photo' | 'multi' | 'ecom'>('artwork');
  
  // Single file state (for artwork, photo, ecom modes)
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  
  // Multi-panel state (for multi mode)
  const [uploadedPanels, setUploadedPanels] = useState<UploadedPanelItem[]>([]);
  
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<PackagingType>('Stand-Up Pouch');
  const [brandName, setBrandName] = useState('');
  const [netQuantity, setNetQuantity] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const guessPanelType = (filename: string): 'FRONT' | 'BACK' | 'SIDE_LEFT' | 'SIDE_RIGHT' | 'TOP' | 'BOTTOM' | 'OTHER' => {
    const lower = filename.toLowerCase();
    if (lower.includes('front')) return 'FRONT';
    if (lower.includes('back') || lower.includes('rear') || lower.includes('nutrition')) return 'BACK';
    if (lower.includes('left')) return 'SIDE_LEFT';
    if (lower.includes('right')) return 'SIDE_RIGHT';
    if (lower.includes('side')) return 'SIDE_LEFT';
    if (lower.includes('top') || lower.includes('seal') || lower.includes('cap') || lower.includes('lid')) return 'TOP';
    if (lower.includes('bottom') || lower.includes('base')) return 'BOTTOM';
    return 'OTHER';
  };

  const handleFilesAdded = (incomingFiles: FileList | File[]) => {
    const fileArray = Array.from(incomingFiles);
    if (fileArray.length === 0) return;

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxBytes = 100 * 1024 * 1024; // 100MB

    const validFiles: File[] = [];
    for (const f of fileArray) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      const isValidExt = ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
      if (!isValidExt && !validTypes.includes(f.type)) {
        setErrorMessage(`File "${f.name}" has an unsupported format. Supported: PDF, PNG, JPEG, WEBP.`);
        continue;
      }
      if (f.size > maxBytes) {
        setErrorMessage(`File "${f.name}" exceeds the 100MB size limit.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    if (uploadMode === 'multi') {
      setUploadedPanels((prev) => {
        const existingKeys = new Set(prev.map((p) => `${p.name}_${p.file.size}`));
        const newPanels: UploadedPanelItem[] = [];

        for (const f of validFiles) {
          const key = `${f.name}_${f.size}`;
          if (existingKeys.has(key)) {
            continue; // Skip exact duplicate
          }
          const sizeInMb = (f.size / (1024 * 1024)).toFixed(1);
          const pType = guessPanelType(f.name);
          newPanels.push({
            id: `panel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            file: f,
            name: f.name,
            size: `${sizeInMb} MB`,
            type: f.type || 'Artwork Image',
            panelType: pType,
            previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
          });
        }

        return [...prev, ...newPanels];
      });
      setErrorMessage(null);
    } else {
      // Single file mode
      const first = validFiles[0];
      setActualFile(first);
      const sizeInMb = (first.size / (1024 * 1024)).toFixed(1);
      setSelectedFileMeta({
        name: first.name,
        size: `${sizeInMb} MB`,
        type: first.type || 'Artwork File',
      });
      setErrorMessage(null);
    }
  };

  const handleRemovePanel = (id: string) => {
    setUploadedPanels((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handlePanelTypeChange = (id: string, newType: UploadedPanelItem['panelType']) => {
    setUploadedPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, panelType: newType } : p))
    );
  };

  const handleStartCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadMode === 'multi') {
      if (uploadedPanels.length === 0) {
        setErrorMessage('Please select or upload at least one packaging panel image (Front, Back, Side, etc.).');
        return;
      }
    } else {
      if (!actualFile) {
        setErrorMessage('Please select or drag-and-drop a packaging artwork file (PDF, PNG, JPG).');
        return;
      }
    }

    if (!productName.trim()) {
      setErrorMessage('Please provide a Product Master Name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      if (uploadMode === 'multi') {
        for (const panel of uploadedPanels) {
          formData.append('files', panel.file);
          formData.append('panel_types', panel.panelType);
        }
        // Primary file for backwards compatibility
        formData.append('file', uploadedPanels[0].file);
        formData.append('panel_type', uploadedPanels[0].panelType);
      } else {
        if (actualFile) {
          formData.append('file', actualFile);
          formData.append('panel_type', 'FRONT');
        }
      }

      formData.append('product_name', productName.trim());
      formData.append('brand', brandName.trim());
      formData.append('packaging_type', productType);
      formData.append('net_quantity', netQuantity.trim());
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Start a New Packaging Check</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
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
          
          {/* Section 1: Input Source Selector */}
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
                <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Packaging Artwork</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Upload your packaging design file</span>
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
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Front / Back / Sides / Top</span>
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
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Product Photo & Declarations</span>
              </button>
            </div>
          </div>

          {/* Section 2: Upload Drop Zone */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {uploadMode === 'multi' ? '2. Upload Packaging Panels (One Check)' : '2. Upload Artwork File'}
              </h3>
              {uploadMode === 'multi' && uploadedPanels.length > 0 && (
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                  {uploadedPanels.length} panel{uploadedPanels.length > 1 ? 's' : ''} added
                </span>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple={uploadMode === 'multi'}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesAdded(e.target.files);
                  // Reset input value so re-selecting same file triggers onChange
                  e.target.value = '';
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
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFilesAdded(e.dataTransfer.files);
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
                {uploadMode === 'multi' 
                  ? 'Drag and drop multiple panel images here, or browse' 
                  : 'Drag and drop your packaging file here, or browse'}
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1rem' }}>
                {uploadMode === 'multi'
                  ? 'Upload Front, Back, Left, Right, Top panels. Supported: PDF, PNG, JPEG, WEBP up to 100MB each.'
                  : 'Supported: PDF, PNG, JPEG, WEBP up to 100MB.'}
              </p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                {uploadMode === 'multi' ? 'Browse & Select Panel Files' : 'Browse Local Files'}
              </button>
            </div>

            {/* MULTI-PANEL ITEMS LIST */}
            {uploadMode === 'multi' && uploadedPanels.length > 0 && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Uploaded Panels for this Inspection ({uploadedPanels.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', gap: '0.35rem' }}
                  >
                    <Plus size={14} />
                    <span>Add Another Image</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {uploadedPanels.map((panel) => (
                    <div
                      key={panel.id}
                      style={{
                        padding: '0.875rem 1rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      {/* Left: Icon/Thumb + Name + Size */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {panel.previewUrl ? (
                            <img src={panel.previewUrl} alt={panel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <FileText size={18} />
                          )}
                        </div>
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {panel.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {panel.size} • {panel.type}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Panel Identifier Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Panel:
                        </label>
                        <select
                          value={panel.panelType}
                          onChange={(e) => handlePanelTypeChange(panel.id, e.target.value as any)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-surface-subtle)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="FRONT">Front Panel</option>
                          <option value="BACK">Back Panel</option>
                          <option value="SIDE_LEFT">Left Side</option>
                          <option value="SIDE_RIGHT">Right Side</option>
                          <option value="TOP">Top / Seal</option>
                          <option value="BOTTOM">Bottom</option>
                          <option value="OTHER">Other / General</option>
                        </select>
                      </div>

                      {/* Right: Status badge & Remove button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span className="badge badge-good" style={{ fontSize: '0.7rem' }}>
                          <CheckCircle2 size={12} /> Ready to Analyze
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePanel(panel.id)}
                          className="btn-icon"
                          style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
                          aria-label={`Remove ${panel.name}`}
                          title="Remove image"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SINGLE FILE PREVIEW (for artwork, photo, ecom modes) */}
            {uploadMode !== 'multi' && selectedFileMeta && actualFile && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {actualFile.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(actualFile)} alt={selectedFileMeta.name} style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#FFF' }} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedFileMeta.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {selectedFileMeta.size} • {selectedFileMeta.type}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span className="badge badge-good" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={12} /> Ready to Analyze
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
                Files are checked for quality and format before analysis.
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
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nutriva California Almonds"
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
                  placeholder="e.g. Nutriva"
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
                  <span>Analyzing Packaging...</span>
                </>
              ) : (
                <>
                  <span>Analyze Packaging →</span>
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
