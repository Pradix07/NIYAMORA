import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NiyamuraLogo } from '../components/common/NiyamuraLogo';
import { ThemeSwitch } from '../components/common/ThemeSwitch';
import { AuthRequiredModal } from '../components/common/AuthRequiredModal';
import pouch3D from '../assets/pouch_3d.jpg';
import bottle3D from '../assets/bottle_3d.jpg';
import carton3D from '../assets/carton_3d.jpg';
import jar3D from '../assets/jar_3d.jpg';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  SearchCheck,
  Wand2,
  GitCompare,
  Sliders,
  FileCheck2,
  UploadCloud,
  FileCheck,
  Package,
  BookOpen,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    title: 'SIGN IN REQUIRED TO START A CHECK',
    description: 'Create an account or sign in to check your packaging artwork and manage your inspection history.',
    targetWorkflow: '/new-check',
  });
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [activeNav, setActiveNav] = useState('home');

  // Dynamic active navigation indicator tracking scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'workflow', 'regulations', 'resources'];
      const scrollPosition = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i];
        if (sectionId === 'home') {
          if (scrollPosition < 400) {
            setActiveNav('home');
            break;
          }
        } else {
          const el = document.getElementById(sectionId);
          if (el && el.offsetTop <= scrollPosition) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartCheckClick = () => {
    if (user) {
      navigate('/new-check');
    } else {
      setAuthModalConfig({
        title: 'SIGN IN REQUIRED TO START A CHECK',
        description: 'Create an account or sign in to check your packaging artwork and manage your inspection history.',
        targetWorkflow: '/new-check',
      });
      setAuthModalOpen(true);
    }
  };

  const handleProtectedFeatureClick = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      setAuthModalConfig({
        title: 'SIGN IN REQUIRED TO ACCESS WORKSPACE',
        description: 'Create an account or sign in to check your packaging artwork and manage your inspection history.',
        targetWorkflow: path,
      });
      setAuthModalOpen(true);
    }
  };

  const handleDownloadResourceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      navigate('/rules');
    } else {
      setAuthModalConfig({
        title: 'SIGN IN REQUIRED TO DOWNLOAD',
        description: 'Create an account to download and save this resource.',
        targetWorkflow: '/rules',
      });
      setAuthModalOpen(true);
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveNav(id);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Product' },
    { id: 'workflow', label: 'How it Works' },
    { id: 'regulations', label: 'Regulations' },
    { id: 'resources', label: 'Resources' },
  ];

  const featureCards = [
    {
      id: 'analysis',
      icon: SearchCheck,
      title: 'Compliance Evaluation',
      desc: 'Detects packaging compliance issues across Legal Metrology and FSSAI rules.',
      path: '/workbench',
      color: '#3B82F6',
    },
    {
      id: 'improve',
      icon: Wand2,
      title: 'Design Improvement',
      desc: 'Actionable millimeter font height and contrast suggestions to resolve issues.',
      path: '/improve',
      color: '#10B981',
    },
    {
      id: 'compare',
      icon: GitCompare,
      title: 'Side-by-Side Compare',
      desc: 'Track visual and statutory changes between artwork revisions.',
      path: '/compare',
      color: '#8B5CF6',
    },
    {
      id: 'simulation',
      icon: Sliders,
      title: 'Simulation & Revalidation',
      desc: 'Test hypothetical parameter adjustments against statutory thresholds before print.',
      path: '/simulator',
      color: '#F59E0B',
    },
    {
      id: 'passport',
      icon: FileCheck2,
      title: 'Label Passport',
      desc: 'Chronological provenance ledger and inspection verification repository.',
      path: '/passport',
      color: '#EC4899',
    },
  ];

  const workflowSteps = [
    {
      number: '1',
      title: '1. CHECK',
      subtitle: 'Upload your artwork dielines or product packshots',
      icon: UploadCloud,
      badgeColor: '#3B82F6',
    },
    {
      number: '2',
      title: '2. IMPROVE',
      subtitle: 'Review structured design suggestions and fixes',
      icon: Wand2,
      badgeColor: '#10B981',
    },
    {
      number: '3',
      title: '3. COMPARE',
      subtitle: 'Verify revisions side-by-side without regression',
      icon: GitCompare,
      badgeColor: '#8B5CF6',
    },
    {
      number: '4',
      title: '4. VERIFY',
      subtitle: 'Ensure compliance before plate making and print',
      icon: ShieldCheck,
      badgeColor: '#F97316',
    },
    {
      number: '5',
      title: '5. RECORD',
      subtitle: 'Save verification records to your Label Passport',
      icon: FileCheck2,
      badgeColor: '#EC4899',
    },
  ];

  return (
    <div id="home" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* 1. Global Navigation Bar */}
      <header
        style={{
          height: '74px',
          backgroundColor: 'var(--topbar-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-default)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Brand Typography Wordmark */}
          <NiyamuraLogo variant="full" size="md" to="/" />

          {/* Center: Dynamic Active Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            className="desktop-search-container"
          >
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--brand-primary-light)' : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.875rem',
                    position: 'relative',
                    transition: 'all var(--transition-fast)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="menu-item-hover"
                >
                  {item.label}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '25%',
                        right: '25%',
                        height: '2px',
                        backgroundColor: 'var(--brand-primary)',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                </a>
              );
            })}
            <Link
              to="/rules"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
              className="menu-item-hover"
            >
              Rule Library
            </Link>
          </nav>

          {/* Right: Theme Switch + Auth CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeSwitch size="sm" />

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link to="/dashboard" className="btn btn-secondary btn-sm">
                  Dashboard
                </Link>
                <button onClick={handleStartCheckClick} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
                  <span>Start a Check</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link to="/login" className="btn btn-secondary btn-sm" style={{ padding: '0.45rem 1rem' }}>
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '0.45rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{ padding: '4rem 0 3.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle radial ambient background light */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '500px',
            background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.1) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 75%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.15fr', gap: '3rem', alignItems: 'center' }}>
            
            {/* Left Hero Column */}
            <div>
              {/* Main Headline */}
              <h1
                style={{
                  fontSize: 'clamp(2.6rem, 5.2vw, 3.95rem)',
                  fontWeight: 800,
                  lineHeight: 1.08,
                  letterSpacing: '-0.035em',
                  marginBottom: '0.75rem',
                }}
              >
                Compliant <br />
                Packaging. <br />
                <span className="text-gradient-violet">Stronger Brands.</span>
              </h1>

              {/* Tagline / Subtitle */}
              <p
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: 'var(--brand-accent)',
                  marginBottom: '1rem',
                  letterSpacing: '-0.01em',
                }}
              >
                From design to compliance.
              </p>

              {/* Supporting Text - Accurate, clean copy without AI buzzwords */}
              <p
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  maxWidth: '520px',
                  marginBottom: '2rem',
                }}
              >
                Pre-print compliance for FSSAI, Legal Metrology and mandatory declaration requirements. Catch issues early, improve designs, and go to print with confidence.
              </p>

              {/* CTA Button: START A CHECK */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <button
                  onClick={handleStartCheckClick}
                  className="btn btn-primary btn-lg"
                  style={{
                    padding: '0.9rem 2.25rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span>START A CHECK</span>
                    <ArrowRight size={18} />
                  </div>
                </button>
              </div>

              {/* Lower Four-Part Brand Strip: Refined, Subtle 3D, Premium with COMPLIANCE */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.85rem',
                  paddingTop: '1.75rem',
                  borderTop: '1px solid var(--border-default)',
                  maxWidth: '520px',
                }}
              >
                {/* Pillar 1: TRUST */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '0.45rem',
                    padding: '0.85rem 0.5rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  className="brand-pillar-card"
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--brand-primary-light)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-primary)',
                      boxShadow: '0 2px 6px rgba(124, 58, 237, 0.15)',
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    TRUST
                  </span>
                </div>

                {/* Pillar 2: COMPLIANCE */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '0.45rem',
                    padding: '0.85rem 0.5rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  className="brand-pillar-card"
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--status-good-solid)',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                    }}
                  >
                    <FileCheck size={20} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    COMPLIANCE
                  </span>
                </div>

                {/* Pillar 3: PRINT */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '0.45rem',
                    padding: '0.85rem 0.5rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  className="brand-pillar-card"
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(249, 115, 22, 0.12)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F97316',
                      boxShadow: '0 2px 6px rgba(249, 115, 22, 0.15)',
                    }}
                  >
                    <Package size={20} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    PRINT
                  </span>
                </div>

                {/* Pillar 4: WITH CONFIDENCE */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '0.45rem',
                    padding: '0.85rem 0.5rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  className="brand-pillar-card"
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3B82F6',
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.15)',
                    }}
                  >
                    <BarChart3 size={20} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-primary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    WITH CONFIDENCE
                  </span>
                </div>
              </div>

            </div>

            {/* Right Hero Column: 3D Packaging Centerpiece + Floating Compliance Card */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              
              {/* Main Realistic 3D Packaging Container */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  position: 'relative',
                  borderRadius: 'var(--radius-2xl)',
                  overflow: 'hidden',
                  boxShadow: '0 24px 60px -15px rgba(0, 0, 0, 0.45)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <img
                  src={pouch3D}
                  alt="Niyamura 3D Stand-Up Pouch Packaging Mockup"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'cover',
                  }}
                />
              </div>

              {/* Floating Glass Compliance Card on Outer Right */}
              <div
                className="glass-card animate-float"
                style={{
                  position: 'absolute',
                  top: '8%',
                  right: '-12px',
                  width: '240px',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  zIndex: 20,
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--brand-lavender)',
                    fontStyle: 'italic',
                    marginBottom: '0.65rem',
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  From design to compliance ↗
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--status-good-solid)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>FSSAI Compliance</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Evaluated Compliant</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--status-good-solid)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>Legal Metrology</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Evaluated Compliant</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--status-good-solid)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>Mandatory Declarations</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Evaluated Compliant</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--status-good-solid)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>Allergen Labelling</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Evaluated Compliant</span>
                    </div>
                  </div>
                </div>

                {/* Compliance Ready for Print badge */}
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
                    }}
                  >
                    <span>Compliance Ready for Print</span>
                    <CheckCircle2 size={13} />
                  </div>
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.2 }}>
                    Evaluated workflow status; not government certification.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. Five Feature Cards Row */}
      <section id="features" style={{ padding: '2.5rem 0 4rem' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1rem',
            }}
          >
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = activeFeatureIndex === idx;

              return (
                <div
                  key={feat.id}
                  onClick={() => {
                    setActiveFeatureIndex(idx);
                    handleProtectedFeatureClick(feat.path);
                  }}
                  className="glass-card"
                  style={{
                    padding: '1.25rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isActive ? `1px solid ${feat.color}` : '1px solid var(--border-default)',
                    transform: isActive ? 'translateY(-4px)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: `${feat.color}20`,
                          color: feat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${feat.color}40`,
                        }}
                      >
                        <Icon size={19} />
                      </div>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <ArrowRight size={13} />
                      </div>
                    </div>

                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                      {feat.title}
                    </h3>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. The Niyamura Workflow Section */}
      <section
        id="workflow"
        style={{
          padding: '5rem 0',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-default)',
          borderBottom: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-2xl)',
          margin: '0 1rem 4rem',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--brand-primary)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                The NIYAMURA Workflow
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                From Upload to <span className="text-gradient-violet">Print-Ready</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '620px' }}>
                A structured, step-by-step pre-print compliance verification process.
              </p>
            </div>

            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--brand-accent)',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                paddingTop: '1rem',
              }}
            >
              <span>Simple steps. Big confidence.</span>
              <span style={{ fontSize: '1.2rem' }}>⤵</span>
            </div>
          </div>

          {/* 5-Step Connected Stepper */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1rem',
              position: 'relative',
            }}
          >
            {workflowSteps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.number}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: st.badgeColor,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      boxShadow: `0 4px 14px ${st.badgeColor}40`,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    {st.title}
                  </h4>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {st.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Packaging Formats Showcase */}
      <section id="regulations" style={{ padding: '2rem 0 5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem' }}>
            <span className="badge badge-sample" style={{ marginBottom: '0.5rem' }}>Packaging Coverage</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Multi-Format Commercial Packaging
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Screened against Legal Metrology PCR 2011 and FSSAI 2020 labelling requirements across standard commercial container formats.
            </p>
          </div>

          <div className="grid-4" style={{ gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden' }}>
              <div style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={pouch3D} alt="Stand-Up Pouch" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Stand-Up Pouches</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zipper pouches, retort packs, and flexible food packaging.</p>
            </div>

            <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden' }}>
              <div style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={bottle3D} alt="Glass Bottle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Glass Bottles & Jars</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Oils, beverages, wellness elixirs, and liquid containers.</p>
            </div>

            <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden' }}>
              <div style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={carton3D} alt="Rigid Carton" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Rigid Cartons</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cosmetics, personal care, outer secondary packaging boxes.</p>
            </div>

            <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden' }}>
              <div style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={jar3D} alt="Jars and Tubs" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Canisters & Tubs</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nutraceutical tubs, protein powders, creams, and condiments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Regulatory Resources Section (Publicly Viewable; Auth-Gated Download) */}
      <section
        id="resources"
        style={{
          padding: '4.5rem 0',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-default)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem' }}>
            <span className="badge badge-sample" style={{ marginBottom: '0.5rem' }}>Official Guidance</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Statutory Knowledge Base & Reference Guides
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Official statutory provisions, gazette notifications, and pre-press checklists curated for packaging designers and regulatory specialists.
            </p>
          </div>

          <div className="grid-3" style={{ gap: '1.5rem' }}>
            <div className="card-tactile" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <BookOpen size={22} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Dept. of Consumer Affairs
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Legal Metrology PCR 2011 Guide</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Statutory provisions on minimum numeral font heights (Schedule-II & Rule 9), principal display panel calculations, and Unit Sale Price (USP) rules.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <Link to="/rules" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-primary)' }}>
                  <span>View Rules</span>
                  <ArrowRight size={14} />
                </Link>
                <button onClick={handleDownloadResourceClick} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                  Download Resource
                </button>
              </div>
            </div>

            <div className="card-tactile" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-good-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  FSSAI Authority of India
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>FSSAI 2020 Labelling Regulations</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Mandatory nutritional panels, allergen declarations, vegetarian/non-vegetarian logos, FSSAI 14-digit license placement, and batch declarations.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <Link to="/rules" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-primary)' }}>
                  <span>View FSSAI Specs</span>
                  <ArrowRight size={14} />
                </Link>
                <button onClick={handleDownloadResourceClick} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                  Download Resource
                </button>
              </div>
            </div>

            <div className="card-tactile" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <FileCheck2 size={22} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Pre-Press Standards
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pre-Print Verification Checklist</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Artwork guidelines covering bleed dimensions, barcode quiet zones, minimum contrast ratios, and mandatory manufacturer declaration grouping.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <Link to="/rules" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-primary)' }}>
                  <span>Explore Catalog</span>
                  <ArrowRight size={14} />
                </Link>
                <button onClick={handleDownloadResourceClick} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                  Download Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div
            className="glass-panel"
            style={{
              padding: '3.5rem 2.5rem',
              textAlign: 'center',
              maxWidth: '840px',
              margin: '0 auto',
              borderRadius: 'var(--radius-2xl)',
              background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-surface-subtle) 100%)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span className="badge badge-sample" style={{ marginBottom: '1rem' }}>
              Pre-Print Packaging Verification
            </span>

            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
              Ensure Compliance <span className="text-gradient-violet">Before You Print.</span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 2.25rem auto' }}>
              Screen your packaging artwork against Legal Metrology PCR 2011 and FSSAI 2020 rules before cylinder engraving and plate making.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleStartCheckClick}
                className="btn btn-primary btn-lg"
                style={{
                  padding: '0.9rem 2.25rem',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span>START A CHECK</span>
                  <ArrowRight size={18} />
                </div>
              </button>

              <Link
                to="/rules"
                className="btn btn-secondary btn-lg"
                style={{
                  padding: '0.9rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                }}
              >
                <span>Browse Rule Library</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
            <NiyamuraLogo variant="full" size="md" to="/" />

            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sign In</Link>
              <Link to="/signup" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Create Account</Link>
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')} style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Product</a>
              <a href="#workflow" onClick={(e) => handleNavClick(e, 'workflow')} style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>How it Works</a>
              <Link to="/rules" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Regulatory Library</Link>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <p>© 2026 NIYAMURA. Packaging Compliance Before Print. All rights reserved.</p>
            <p>Statutory screening against Legal Metrology PCR 2011 & FSSAI 2020. Internal verification record; not a government certification.</p>
          </div>
        </div>
      </footer>

      {/* Auth Gate Modal */}
      <AuthRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalConfig.title}
        description={authModalConfig.description}
        targetWorkflow={authModalConfig.targetWorkflow}
      />
    </div>
  );
};
