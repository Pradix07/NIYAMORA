import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('devin@aurapackaging.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Failed to sign in. Please verify credentials.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M8 22V10L16 18L24 10V22" stroke="#FFFFFF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="22" r="2.5" fill="#10B981"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              NIYAMORA
            </span>
          </Link>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>Welcome Back</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Sign in to access your pre-print compliance workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--status-issue-bg)',
                border: '1px solid var(--status-issue-border)',
                color: 'var(--status-issue-text)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '42px', marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-default)', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => { setShowForgotModal(false); setForgotSent(false); }}
        title="Reset Password"
        subtitle="Enter your email address to receive password reset instructions."
      >
        {forgotSent ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--status-good-bg)', color: 'var(--status-good-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <ShieldCheck size={24} />
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Reset Link Dispatched</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              If an account exists for {email}, a reset link has been dispatched.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForgotModal(false)}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Account Email
              </label>
              <input
                type="email"
                defaultValue={email}
                placeholder="name@company.com"
                style={{ width: '100%' }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setForgotSent(true)}>
              Send Reset Link
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
