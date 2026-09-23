import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NiyamuraLogo } from '../components/common/NiyamuraLogo';
import { ThemeSwitch } from '../components/common/ThemeSwitch';
import { AuthRequiredModal } from '../components/common/AuthRequiredModal';
import pouch3D from '../assets/pouch_3d.jpg';
import carton3D from '../assets/carton_3d.jpg';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  SearchCheck,
  Wand2,
  GitCompare,
  Sliders,
  FileCheck2,
  UploadCloud,
  Package,
  Sparkles,
  Layers,
  Scale,
} from 'lucide-react';

// Aceternity UI Components
import { Spotlight } from '../components/ui/spotlight';
import { BentoGrid, BentoGridItem } from '../components/ui/bento-grid';
import { Button as MovingBorderButton } from '../components/ui/moving-border';
import { ContainerScroll } from '../components/ui/container-scroll';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    title: 'SIGN IN REQUIRED TO START A CHECK',
    description: 'Create an account or sign in to check your packaging artwork and manage your inspection history.',
    targetWorkflow: '/new-check',
  });
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
      icon: <SearchCheck className="h-6 w-6 text-blue-500" />,
      title: 'Compliance Evaluation',
      desc: 'Detects packaging compliance issues across Legal Metrology PCR 2011 and FSSAI 2020 rules.',
      path: '/workbench',
      color: '#3B82F6',
      badge: 'Legal Metrology',
    },
    {
      id: 'improve',
      icon: <Wand2 className="h-6 w-6 text-emerald-500" />,
      title: 'Design Improvement',
      desc: 'Actionable millimeter font height and contrast suggestions to resolve issues before print.',
      path: '/improve',
      color: '#10B981',
      badge: 'Design Fixes',
    },
    {
      id: 'compare',
      icon: <GitCompare className="h-6 w-6 text-purple-500" />,
      title: 'Side-by-Side Compare',
      desc: 'Track visual and statutory changes between artwork revisions seamlessly.',
      path: '/compare',
      color: '#8B5CF6',
      badge: 'Visual Diff',
    },
    {
      id: 'simulation',
      icon: <Sliders className="h-6 w-6 text-amber-500" />,
      title: 'Simulation & Revalidation',
      desc: 'Test hypothetical parameter adjustments against statutory thresholds before printing.',
      path: '/simulator',
      color: '#F59E0B',
      badge: 'What-If Engine',
    },
    {
      id: 'passport',
      icon: <FileCheck2 className="h-6 w-6 text-pink-500" />,
      title: 'Label Passport',
      desc: 'Chronological provenance ledger and inspection verification repository for enterprise audit readiness.',
      path: '/passport',
      color: '#EC4899',
      badge: 'Audit Trail',
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

      {/* 2. Hero Section with Aceternity Spotlight */}
      <section style={{ padding: '4rem 0 3.5rem', position: 'relative', overflow: 'hidden' }}>
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(124, 58, 237, 0.3)" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.15fr', gap: '3rem', alignItems: 'center' }}>
            
            {/* Left Hero Column */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/30 mb-4 text-xs font-semibold text-[var(--brand-primary)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Legal Metrology & FSSAI Pre-Print Verification</span>
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
                Pre-print compliance screening for FSSAI, Legal Metrology PCR 2011, and mandatory declaration requirements. Detect issues early, adjust design parameters, and go to print with total confidence.
              </p>

              {/* CTA Button: START A CHECK */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <MovingBorderButton onClick={handleStartCheckClick} borderRadius="0.75rem">
                  <span>START A CHECK</span>
                  <ArrowRight size={18} />
                </MovingBorderButton>

                <button
                  onClick={() => navigate('/create-packaging')}
                  className="btn btn-secondary btn-lg"
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', gap: '0.5rem' }}
                >
                  <Sparkles size={16} />
                  <span>AI Packaging Studio</span>
                </button>
              </div>

              {/* Four-Part Brand Pillars */}
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
                <div className="brand-pillar-card" style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                  <ShieldCheck size={20} className="mx-auto text-purple-600 mb-1" />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>TRUST</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Proven Audit</div>
                </div>

                <div className="brand-pillar-card" style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                  <Scale size={20} className="mx-auto text-emerald-600 mb-1" />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>COMPLIANCE</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PCR 2011 & FSSAI</div>
                </div>

                <div className="brand-pillar-card" style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                  <Package size={20} className="mx-auto text-blue-600 mb-1" />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>PRINT</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Zero Recall</div>
                </div>

                <div className="brand-pillar-card" style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                  <CheckCircle2 size={20} className="mx-auto text-amber-600 mb-1" />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>CONFIDENCE</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pre-Print Ready</div>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Interactive Artwork Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ position: 'relative' }}
            >
              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-xl)',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-good">COMPLIANCE PASS</span>
                    <span style={{ fontSize: '0.81rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SKU: ORG-P250</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-primary)' }}>Legal Metrology Validated</span>
                </div>

                {/* Packaging Formats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                    <img src={pouch3D} alt="Stand-Up Pouch" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.35rem 0.6rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
                      Stand-Up Pouch
                    </div>
                  </div>
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                    <img src={carton3D} alt="Carton Box" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.35rem 0.6rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
                      Carton Box
                    </div>
                  </div>
                </div>

                {/* Audit Key Metrics Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Principal Display Area</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>220 cm²</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min Font Height</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--status-good-solid)' }}>3.2 mm (Req: 3.0mm)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statutory Declarations</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--status-good-solid)' }}>100% Present</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Aceternity Bento Grid Features Section */}
      <section id="features" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-surface-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span className="badge badge-neutral" style={{ marginBottom: '0.75rem' }}>Enterprise Suite</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
              Built for Packaging & Legal Teams
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Comprehensive pre-print inspection, real-time font measurement, and statutory compliance history in one unified workbench.
            </p>
          </div>

          <BentoGrid>
            {featureCards.map((item) => (
              <BentoGridItem
                key={item.id}
                title={item.title}
                description={item.desc}
                icon={item.icon}
                badge={item.badge}
                onClick={() => handleProtectedFeatureClick(item.path)}
                header={
                  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-100 dark:from-neutral-900 to-neutral-200 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700/50 p-4 items-center justify-center">
                    <div className="text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>{item.title.toUpperCase()}</span>
                    </div>
                  </div>
                }
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* 4. Container Scroll Interactive Demo */}
      <section style={{ backgroundColor: 'var(--bg-app)', padding: '2rem 0' }}>
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Inspect Artwork Dielines <br />
                <span className="text-gradient-violet">With Millimeter Precision</span>
              </h2>
              <p className="text-sm md:text-base text-[var(--text-secondary)] mt-4 max-w-xl">
                Automatic bounding box extraction across Net Quantity, MRP, FSSAI License Number, Allergen Info, and Manufacturer Address.
              </p>
            </div>
          }
        >
          <div className="h-full w-full flex flex-col justify-between p-6 bg-zinc-950 text-white rounded-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-zinc-400 ml-2">NIYAMURA WORKBENCH V2.4</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                AUDIT PASS: PCR 2011 RULE 7
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
              <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 p-4">
                <img src={pouch3D} alt="Artwork Dieline Mockup" className="w-full h-48 object-cover rounded" />
                <div className="absolute top-8 left-8 border-2 border-emerald-500 bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-white rounded">
                  NET QTY: 250 g (3.2mm OK)
                </div>
                <div className="absolute bottom-8 right-8 border-2 border-amber-500 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-white rounded">
                  MRP: ₹199.00 (INCL TAXES)
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-3 text-left">
                <div className="text-sm font-semibold text-zinc-200">Legal Metrology Compliance Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">Net Quantity Font Height</span>
                    <span className="text-emerald-400 font-bold">3.2 mm (Required ≥ 3.0mm)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">Manufacturer Address</span>
                    <span className="text-emerald-400 font-bold">Verified Complete</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400">FSSAI Logo & License</span>
                    <span className="text-emerald-400 font-bold">14-Digit Valid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* 5. Workflow Section */}
      <section id="workflow" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-surface-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
            <span className="badge badge-neutral" style={{ marginBottom: '0.75rem' }}>Streamlined Audit</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
              How NIYAMURA Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              5 simple steps from dieline upload to pre-print verification record.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }} className="grid-4">
            {workflowSteps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.badgeColor,
                    }}
                  >
                    <IconComp size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: step.badgeColor, marginBottom: '0.25rem' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NiyamuraLogo variant="compact" size="sm" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} NIYAMURA. Legal Metrology & FSSAI Packaging Compliance Engine.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/rules" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Rule Library
            </Link>
            <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </footer>

      {/* Auth Required Modal */}
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
