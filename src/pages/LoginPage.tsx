import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NiyamuraLogo } from '../components/common/NiyamuraLogo';
import { ThemeSwitch } from '../components/common/ThemeSwitch';
import pouch3D from '../assets/pouch_3d.jpg';
import {
  LogIn,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your work email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate(redirectPath);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--topbar-bg)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <NiyamuraLogo variant="full" size="md" to="/" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeSwitch size="sm" />
          <Link to="/signup" className="btn btn-secondary btn-sm">
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Two-Column Auth Layout */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1020px',
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Left Column: Brand Story & 3D Packaging */}
          <div
            style={{
              padding: '3rem 2.5rem',
              background: 'linear-gradient(145deg, var(--bg-surface-subtle) 0%, var(--bg-surface) 100%)',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--brand-primary-light)',
                  color: 'var(--brand-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                }}
              >
                <Sparkles size={12} />
                <span>Enterprise Packaging Verification</span>
              </div>

              <h2
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: '-0.025em',
                  marginBottom: '1rem',
                }}
              >
                Packaging Compliance <br />
                <span className="text-gradient-violet">Before You Print.</span>
              </h2>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Secure multi-tenant workspace with deterministic Legal Metrology PCR 2011 & FSSAI 2020 verification, millimeter font size checks, and immutable Label Passports.
              </p>

              {/* 3D Mockup Box */}
              <div
                style={{
                  height: '210px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <img
                  src={pouch3D}
                  alt="Niyamura 3D Packaging Mockup"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFF',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  ✓ Pre-Print Screened SKU
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--status-good-solid)', flexShrink: 0 }} />
                <span>Zero-assumption OCR text & bounding box extraction</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                <span>Tenant-isolated encrypted storage & audit trail</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Form */}
          <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                Sign In
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Enter your work credentials to access your company workspace.
              </p>
            </div>

            {error && (
              <div
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--status-issue-bg)',
                  border: '1px solid var(--status-issue-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--status-issue-text)',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Password
                  </label>
                  <a href="#forgot" style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Don't have a workspace account yet?{' '}
              <Link to={`/signup?redirect=${encodeURIComponent(redirectPath)}`} style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '1.25rem 2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        © 2026 NIYAMURA. Where Packaging Meets Compliance. All rights reserved.
      </footer>
    </div>
  );
};
