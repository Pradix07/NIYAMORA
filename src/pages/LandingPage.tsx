import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  FileCheck2, 
  ShieldAlert, 
  Eye, 
  Printer
} from 'lucide-react';
import { PackagingVisual } from '../components/common/PackagingVisual';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Public Navbar (Zero theme toggle as specified!) */}
      <header
        style={{
          height: '72px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M8 22V10L16 18L24 10V22" stroke="#FFFFFF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="22" r="2.5" fill="#10B981"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', display: 'block', lineHeight: 1 }}>
                NIYAMORA
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Where Packaging Meets Compliance
              </span>
            </div>
          </Link>

          {/* Nav Links & CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <a href="#workflow" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Workflow
            </a>
            <a href="#evidence" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Evidence & Rulers
            </a>
            <a href="#improve" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Improve Design
            </a>
            <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-default)' }} />
            <Link to="/login" className="btn btn-ghost btn-sm">
              Log In
            </Link>
            <Link to="/new-check" className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
              <span>Start a Check</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '4.5rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'center' }}>
            {/* Left Copy */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '1.25rem', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                <Printer size={14} />
                <span>Packaging Compliance Before Print</span>
              </div>

              <h1 style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
                Where Packaging Meets Compliance
              </h1>

              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '540px', marginBottom: '2rem' }}>
                Check your artwork, understand the issues, and improve the design before it reaches production.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <Link to="/new-check" className="btn btn-primary btn-lg" style={{ gap: '0.5rem', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)' }}>
                  <span>Start a Check</span>
                  <ArrowRight size={18} />
                </Link>

                <Link to="/workbench" className="btn btn-secondary btn-lg" style={{ gap: '0.5rem' }}>
                  <Eye size={18} />
                  <span>See How It Works</span>
                </Link>
              </div>

              {/* Core Philosophy Notice */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1.125rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', maxWidth: '520px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Pre-Print Screening Workspace:</strong> Prevent costly cylinder re-engraving, recalled print runs, and packaging delays before signing off on final press proofs.
                </p>
              </div>
            </div>

            {/* Right: Realistic 3D Packaging Scene with Compliance Markers */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div 
                className="card-tactile"
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  padding: '2rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xl)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Floating Inspection Evidence Badges */}
                <div
                  style={{
                    position: 'absolute',
                    top: '24px',
                    right: '-12px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--status-issue-border)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 20,
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-issue-solid)' }} />
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-issue-text)', display: 'block' }}>Legal Metrology Rule 9</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Net Qty: 2.8mm (Min 4.0mm req)</span>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '-16px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--status-good-border)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 20,
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: 'var(--status-good-solid)' }} />
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-good-text)', display: 'block' }}>FSSAI Mandatory Allergen</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Compliant 8pt Bold Callout</span>
                  </div>
                </div>

                {/* 3D Realistic Stand-Up Pouch Render */}
                <PackagingVisual type="Stand-Up Pouch" variant="hero" showEvidenceMarker={true} />

                <div style={{ marginTop: '1.25rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: '0.875rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Sample Product: Stand-Up Pouch
                  </span>
                  <span className="badge badge-sample">Pre-Print Screened</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Section */}
      <section id="workflow" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span className="badge badge-sample" style={{ marginBottom: '0.5rem' }}>Methodology</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              The Pre-Print Compliance Workflow
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              A systematic 5-stage pipeline engineered specifically for packaging designers, brand managers, and pre-press prep departments.
            </p>
          </div>

          {/* 5-Step Workflow Cards: UPLOAD -> CHECK -> IMPROVE -> COMPARE -> VERIFY */}
          <div className="grid-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            
            {/* Step 1: UPLOAD */}
            <div className="card-tactile" style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>UPLOAD</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Multi-Format Ingestion</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Upload packaging artwork PDFs, high-res packshots, 3D renders, or multi-panel dielines.
              </p>
            </div>

            {/* Step 2: CHECK */}
            <div className="card-tactile" style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>CHECK</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Statutory Rules & OCR</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Screen against Legal Metrology numeral heights, FSSAI declarations, allergen callouts, and date stamps.
              </p>
            </div>

            {/* Step 3: IMPROVE */}
            <div className="card-tactile" style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--brand-primary)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>IMPROVE</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Suggested Design Specs</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Review side-by-side suggested fixes with precise millimeter font sizing and contrast adjustments.
              </p>
            </div>

            {/* Step 4: COMPARE */}
            <div className="card-tactile" style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
                4
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>COMPARE</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Regression Tracking</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Verify that fixing an old issue (e.g. MRP) didn't accidentally introduce a new margin or text overlap.
              </p>
            </div>

            {/* Step 5: VERIFY & RECORD */}
            <div className="card-tactile" style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
                5
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>RECORD</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Label Passport Archive</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Generate complete product revision audit trails, inspection certificates, and human review sign-offs.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="evidence" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-app)' }}>
        <div className="container">
          <div className="grid-3" style={{ gap: '2rem' }}>
            {/* Pillar 1: Evidence & Rulers */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Eye size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Visual Evidence Overlays
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Every finding maps to a physical coordinate on your packaging dieline. Inspect actual bounding boxes, numeral heights, and background contrast ratios directly on the artwork.
              </p>
            </div>

            {/* Pillar 2: Preventive Pre-Print Workflow */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Printer size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Pre-Press Defect Prevention
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Identify non-compliant font sizes, missing license codes, or truncated ingredient warnings before sending files to plate making and flexo/rotogravure printers.
              </p>
            </div>

            {/* Pillar 3: Label Passport */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <FileCheck2 size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Unified Label Passport
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Maintain a verifiable historical ledger for every product SKU—tracking who uploaded each version, what was fixed, and when pre-flight checks passed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>NIYAMORA</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Where Packaging Meets Compliance</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              NIYAMORA is a pre-print packaging compliance screening workspace. It does not provide legal advice or government certification.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem' }}>
            <Link to="/login" style={{ color: 'var(--text-secondary)' }}>Log In</Link>
            <Link to="/signup" style={{ color: 'var(--text-secondary)' }}>Sign Up</Link>
            <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>Demo Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
