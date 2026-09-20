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
  Cpu,
  Wand2,
  GitCompare,
  Sliders,
  FileCheck2,
  UploadCloud,
  FileCheck,
  Package,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
      icon: Cpu,
      title: 'AI-Powered Analysis',
      desc: 'Detects compliance issues across Legal Metrology and FSSAI rules.',
      path: '/workbench',
      color: '#3B82F6',
    },
    {
      id: 'improve',
      icon: Wand2,
      title: 'Design Improvement',
      desc: 'Get actionable millimeter font and contrast suggestions to fix issues.',
      path: '/improve',
      color: '#10B981',
    },
    {
      id: 'compare',
      icon: GitCompare,
      title: 'Side-by-Side Compare',
      desc: 'Track visual and statutory changes to validate improvements.',
      path: '/compare',
      color: '#8B5CF6',
    },
    {
      id: 'simulation',
      icon: Sliders,
      title: 'Simulation & Revalidation',
      desc: 'Test hypothetical artwork values to ensure final design remains compliant.',
      path: '/simulator',
      color: '#F59E0B',
    },
    {
      id: 'passport',
      icon: FileCheck2,
      title: 'Label Passport',
      desc: 'Complete immutable audit trail and history ledger for transparency.',
      path: '/passport',
      color: '#EC4899',
    },
  ];

  const workflowSteps = [
    {
      number: '1',
      title: '1. CHECK',
      subtitle: 'Upload your artwork or product images',
      icon: UploadCloud,
      badgeColor: '#3B82F6',
    },
    {
      number: '2',
      title: '2. IMPROVE',
      subtitle: 'Get structured design suggestions',
      icon: Wand2,
      badgeColor: '#10B981',
    },
    {
      number: '3',
      title: '3. COMPARE',
      subtitle: 'Review changes side by side',
      icon: GitCompare,
      badgeColor: '#8B5CF6',
    },
    {
      number: '4',
      title: '4. VERIFY',
      subtitle: 'Ensure compliance before print',
      icon: ShieldCheck,
      badgeColor: '#F97316',
    },
    {
      number: '5',
      title: '5. RECORD',
      subtitle: 'Save to your Label Passport',
      icon: FileCheck2,
      badgeColor: '#EC4899',
    },
  ];

  return (
    <div id="home" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* 1. Global Navigation Bar matching reference */}
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
          {/* Left: Brand Typography Wordmark (No enclosing box) */}
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
                  Log In
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

      {/* 2. Hero Section matching reference image */}
      <section style={{ padding: '3.5rem 0 3.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle radial ambient background light */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '500px',
            background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.12) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 75%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.15fr', gap: '3rem', alignItems: 'center' }}>
            
            {/* Left Hero Column */}
            <div>
              {/* Eyebrow Line: Uniform Opacity & Color flanked by hairline dividers */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  maxWidth: '520px',
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-strong)', opacity: 0.5 }} />
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <span>TRUST</span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span>COMPLY</span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span>PRINT</span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span>WITH CONFIDENCE</span>
                </div>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-strong)', opacity: 0.5 }} />
              </div>

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

              {/* Tagline / Subtitle from reference */}
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

              {/* Supporting Text */}
              <p
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  maxWidth: '520px',
                  marginBottom: '2rem',
                }}
              >
                AI-powered pre-print compliance for FSSAI, Legal Metrology and mandatory declaration rules. Catch issues early, improve designs, and go to print with confidence.
              </p>

              {/* CTA Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <button
                  onClick={handleStartCheckClick}
                  className="btn btn-primary btn-lg"
                  style={{
                    padding: '0.85rem 2rem',
                    borderRadius: 'var(--radius-lg)',
                    gap: '0.75rem',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.45)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ArrowRight size={20} />
                    <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                      <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700 }}>Start a Check</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.85, fontWeight: 500 }}>
                        {user ? 'Open Workspace' : '(Sign in required)'}
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Value Proposition 4 Pillars Row matching Reference Image 2 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-default)',
                  maxWidth: '520px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <ShieldCheck size={19} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    TRUST
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <FileCheck size={19} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    COMPLY
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <Package size={19} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    PRINT
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <BarChart3 size={19} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-secondary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    WITH CONFIDENCE
                  </span>
                </div>
              </div>

            </div>

            {/* Right Hero Column: 3D Packaging Centerpiece + Floating Glass Card on Outer Right */}
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

              {/* Floating Translucent Glass Compliance Card placed BESIDE the pouch on the outer right */}
              <div
                className="glass-card animate-float"
                style={{
                  position: 'absolute',
                  top: '10%',
                  right: '-12px',
                  width: '235px',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  zIndex: 20,
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {/* Visual indicator callout */}
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
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Compliant</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--status-good-solid)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>Legal Metrology</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Compliant</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--status-good-solid)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>Mandatory Declarations</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Compliant</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--status-good-solid)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>Allergen Labelling</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--status-good-text)' }}>Compliant</span>
                    </div>
                  </div>
                </div>

                {/* Ready for Print badge */}
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
                    }}
                  >
                    <span>Ready for Print</span>
                    <CheckCircle2 size={13} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. Five Feature Cards Row (Floating below hero) matching reference image */}
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
                    if (user) navigate(feat.path);
                    else setAuthModalOpen(true);
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

      {/* 4. The Niyamura Workflow Section matching reference image */}
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
                The Niyamura Workflow
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                From Upload to <span className="text-gradient-violet">Print-Ready</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '620px' }}>
                A simple, structured workflow to ensure your packaging meets all compliance requirements.
              </p>
            </div>

            {/* Subtitle callout */}
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

          {/* 5-Step Connected Horizontal Stepper */}
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
                  {/* Step Icon Badge */}
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

      {/* 5. Packaging Formats & Regulations Showcase */}
      <section id="regulations" style={{ padding: '2rem 0 5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem' }}>
            <span className="badge badge-sample" style={{ marginBottom: '0.5rem' }}>Coverage</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Multi-Format Commercial Packaging
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Screened against Legal Metrology PCR 2011 and FSSAI 2020 labelling requirements across all standard commercial container formats.
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
              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Glass Bottles</h4>
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
              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Jars & Canisters</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nutraceutical tubs, protein powders, creams, and condiments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Regulatory Resources Section */}
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
            <span className="badge badge-sample" style={{ marginBottom: '0.5rem' }}>Resources</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Pre-Print Compliance Knowledge Base
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Practical guides, statutory rule references, and pre-press checklists curated for packaging designers and regulatory specialists.
            </p>
          </div>

          <div className="grid-3" style={{ gap: '1.5rem' }}>
            <div className="card-tactile" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <BookOpen size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Legal Metrology PCR 2011 Guide</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Comprehensive guide on minimum numeral font heights, principal display panel area calculations, and unit sale price requirements.
                </p>
              </div>
              <Link to="/rules" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.875rem', marginTop: '1.25rem' }}>
                <span>Explore Rules</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card-tactile" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-good-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <CheckCircle2 size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>FSSAI 2020 Labelling Handbook</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Mandatory nutritional panels, allergen warnings, vegetarian/non-vegetarian logos, license display, and batch declarations.
                </p>
              </div>
              <Link to="/rules" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.875rem', marginTop: '1.25rem' }}>
                <span>View FSSAI Specs</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card-tactile" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--status-review-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Sparkles size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pre-Press Artwork Checklist</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Print-ready checklist covering bleed dimensions, barcode quiet zones, contrast ratios, and color separation best practices.
                </p>
              </div>
              <button onClick={handleStartCheckClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.875rem', marginTop: '1.25rem', color: 'var(--brand-primary)', textAlign: 'left' }}>
                <span>Run Checklist Check</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action Section (Replaces Pricing) */}
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
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '500px',
                height: '300px',
                background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <span className="badge badge-sample" style={{ marginBottom: '1rem' }}>
              Pre-Print Statutory Assurance
            </span>

            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
              Ensure Compliance <span className="text-gradient-violet">Before You Print.</span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 2.25rem auto' }}>
              Screen your packaging artwork against Legal Metrology PCR 2011 and FSSAI 2020 rules before plate making. Catch issues early, improve designs, and go to print with confidence.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleStartCheckClick}
                className="btn btn-primary btn-lg"
                style={{
                  padding: '0.85rem 2.25rem',
                  borderRadius: 'var(--radius-lg)',
                  gap: '0.75rem',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.45)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ArrowRight size={20} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Start a Check</span>
                </div>
              </button>

              <Link
                to="/rules"
                className="btn btn-secondary btn-lg"
                style={{
                  padding: '0.85rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
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
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Log In</Link>
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

      {/* Auth Gate Modal for Start a Check */}
      <AuthRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        targetWorkflow="/new-check"
      />
    </div>
  );
};
