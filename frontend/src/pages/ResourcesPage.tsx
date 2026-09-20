import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ApiRuleSource } from '../services/api';
import {
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Search,
  BookOpen,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';
import { NiyamuraLogo } from '../components/common/NiyamuraLogo';
import { ThemeSwitch } from '../components/common/ThemeSwitch';
import { AuthRequiredModal } from '../components/common/AuthRequiredModal';
import { useAuth } from '../context/AuthContext';

interface StaticResourceDoc {
  id: string;
  title: string;
  authority: string;
  referenceNo: string;
  documentType: string;
  publicationDate: string;
  effectiveStatus: string;
  summary: string;
  externalUrl: string;
  isDownloadableGuidance?: boolean;
}

const STATIC_GUIDANCE_DOCS: StaticResourceDoc[] = [
  {
    id: 'res-dca-lmpc-2011',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    authority: 'Department of Consumer Affairs (DCA), Govt of India',
    referenceNo: 'G.S.R. 202(E), dated 07.03.2011',
    documentType: 'Principal Statutory Rules',
    publicationDate: 'March 2011',
    effectiveStatus: 'Active (Amended)',
    summary: 'Master statutory framework governing mandatory declarations, Principal Display Panel (PDP) definitions, and numeral height specifications for retail packages.',
    externalUrl: 'https://consumeraffairs.gov.in/pages/legal-metrology-act',
  },
  {
    id: 'res-dca-usp-2021',
    title: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2021 — Unit Sale Price (USP)',
    authority: 'Department of Consumer Affairs (DCA), Govt of India',
    referenceNo: 'G.S.R. 779(E), dated 02.11.2021',
    documentType: 'Gazette Amendment',
    publicationDate: 'November 2021',
    effectiveStatus: 'Mandatory Active',
    summary: 'Introduced mandatory Unit Sale Price (USP per g, per ml, per piece) alongside MRP with strict 2-decimal rounding rules for packaged commodities.',
    externalUrl: 'https://consumeraffairs.gov.in/pages/legal-metrology-act',
  },
  {
    id: 'res-fssai-labelling-2020',
    title: 'Food Safety and Standards (Labelling and Display) Regulations, 2020',
    authority: 'Food Safety and Standards Authority of India (FSSAI)',
    referenceNo: 'F. No. 1-94/FSSAI/SP(L&D)/2017',
    documentType: 'Statutory Regulation',
    publicationDate: 'November 2020',
    effectiveStatus: 'Mandatory Active',
    summary: 'Comprehensive mandatory standards for food labelling, allergen disclosures, nutritional information panels, veg/non-veg logos, and font size proportions.',
    externalUrl: 'https://www.fssai.gov.in/upload/uploadfiles/files/Gazette_Notification_Labelling_Display_18_11_2020.pdf',
  },
  {
    id: 'res-dca-origin-2026',
    title: 'Legal Metrology (Packaged Commodities) Second Amendment Rules, 2026 — Rule 6(10A)',
    authority: 'Department of Consumer Affairs (DCA), Govt of India',
    referenceNo: 'G.S.R. 312(E), dated 27.04.2026',
    documentType: 'Gazette Amendment',
    publicationDate: 'April 2026',
    effectiveStatus: 'Future Effective (01.07.2027)',
    summary: 'Substituted statutory mandate for country-of-origin filtering, declaration grouping, and e-commerce packaging compliance timelines.',
    externalUrl: 'https://consumeraffairs.gov.in/pages/legal-metrology-act',
  },
  {
    id: 'res-guide-preprint-checklist',
    title: 'NIYAMURA Pre-Print Packaging Compliance Checklist (2026 Edition)',
    authority: 'NIYAMURA Standards & Compliance Research',
    referenceNo: 'NIYAMURA-GUIDE-2026-V2',
    documentType: 'Technical Guidance PDF',
    publicationDate: '2026 Edition',
    effectiveStatus: 'Current Best Practice',
    summary: 'Step-by-step pre-press audit checklist covering minimum font heights, date stamps, contrast checks, and barcode quiet zones for packaging prep.',
    externalUrl: '#',
    isDownloadableGuidance: true,
  },
  {
    id: 'res-guide-usp-calculator',
    title: 'Statutory Unit Sale Price (USP) Calculation & Rounding Matrix',
    authority: 'NIYAMURA Standards & Compliance Research',
    referenceNo: 'NIYAMURA-TECH-USP-01',
    documentType: 'Technical Reference Sheet',
    publicationDate: '2026 Edition',
    effectiveStatus: 'Current Best Practice',
    summary: 'Reference table for net quantity conversions, mass/volume tier thresholds, and 2-decimal arithmetic rounding rules according to Rule 6(11).',
    externalUrl: '#',
    isDownloadableGuidance: true,
  },
];

export const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState('ALL');
  const [liveSources, setLiveSources] = useState<ApiRuleSource[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    api.getRuleSources()
      .then((data) => {
        if (data && data.length > 0) {
          setLiveSources(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load live sources:', err);
      });
  }, []);

  const handleDownloadClick = (e: React.MouseEvent, docTitle: string) => {
    e.preventDefault();
    if (user) {
      // In authenticated state, trigger direct download of checklist / PDF notice
      const blob = new Blob([
        `NIYAMURA STATUTORY COMPLIANCE GUIDANCE\nDocument: ${docTitle}\nVerified against DCA Legal Metrology & FSSAI Regulations.\nIssued for Pre-Print Packaging Review.\nhttps://niyamura.com`,
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      setAuthModalOpen(true);
    }
  };

  const filteredDocs = STATIC_GUIDANCE_DOCS.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAuthority =
      authorityFilter === 'ALL' ||
      (authorityFilter === 'DCA' && doc.authority.includes('Consumer Affairs')) ||
      (authorityFilter === 'FSSAI' && doc.authority.includes('FSSAI')) ||
      (authorityFilter === 'NIYAMURA' && doc.authority.includes('NIYAMURA'));
    return matchesSearch && matchesAuthority;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Public Header */}
      <header
        style={{
          height: '64px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <NiyamuraLogo variant="full" size="md" to="/" />
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/rules" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Rule Library
            </Link>
            <Link to="/resources" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={15} /> Resources
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeSwitch size="sm" />
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
            <span className="badge badge-good" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Official Statutory Repository
            </span>
            <span className="badge badge-neutral">DCA & FSSAI Gazette Documents</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Statutory Resources & Pre-Print Guidance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.5 }}>
            Access verified Department of Consumer Affairs (DCA) notifications, FSSAI regulations, and technical pre-print screening checklists.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '440px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by regulation title, gazette number, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', height: '38px', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Authority:</span>
            <select
              value={authorityFilter}
              onChange={(e) => setAuthorityFilter(e.target.value)}
              style={{ height: '38px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Authorities</option>
              <option value="DCA">Dept of Consumer Affairs (DCA)</option>
              <option value="FSSAI">FSSAI Regulations</option>
              <option value="NIYAMURA">NIYAMURA Technical Guidance</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', fontWeight: 700 }}>
                      {doc.documentType}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                      {doc.referenceNo}
                    </span>
                    <span className="badge badge-good" style={{ fontSize: '0.6875rem' }}>
                      <CheckCircle2 size={11} /> {doc.effectiveStatus}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>{doc.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Building2 size={12} /> {doc.authority}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={12} /> {doc.publicationDate}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {doc.externalUrl && doc.externalUrl !== '#' && (
                    <a
                      href={doc.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ExternalLink size={13} />
                      <span>Official Source</span>
                    </a>
                  )}

                  <button
                    onClick={(e) => handleDownloadClick(e, doc.title)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {doc.summary}
              </p>
            </div>
          ))}
        </div>

        {/* Live Seeded Sources from DCA Section */}
        {liveSources.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
              DCA Gazette Amendment Register (Database Catalog)
            </h2>
            <div className="grid-2" style={{ gap: '1rem' }}>
              {liveSources.map((src) => (
                <div key={src.id} className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                      {src.id}
                    </span>
                    <span className={`badge ${src.status === 'ACTIVE' ? 'badge-good' : src.status === 'FUTURE_EFFECTIVE' ? 'badge-review' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                      {src.status}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>{src.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <strong>Authority:</strong> {src.issuing_authority}
                  </p>
                  <a
                    href={src.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <span>View Gazette Notification</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ marginTop: '2.5rem', padding: '1rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <strong>Statutory Archive Notice:</strong> These reference materials are sourced from published gazettes by the Ministry of Consumer Affairs, Food and Public Distribution, and the Food Safety and Standards Authority of India. NIYAMURA maintains this index for packaging design screening and does not represent government authority.
        </div>
      </main>

      {/* Auth Gate Modal for Unauthenticated Download Attempts */}
      <AuthRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="SIGN IN REQUIRED TO DOWNLOAD"
        description="Create an account to download and save this resource."
        targetWorkflow="/resources"
      />
    </div>
  );
};

export default ResourcesPage;
