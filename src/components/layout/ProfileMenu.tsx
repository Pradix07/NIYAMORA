import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User as UserIcon, Settings, HelpCircle, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
        <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-default)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        aria-expanded={isOpen}
        aria-label="User profile menu"
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8125rem',
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ textAlign: 'left', display: 'none', minWidth: '80px' }} className="desktop-user-info">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>
            {user.name}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
            {user.company}
          </span>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="card-tactile animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            padding: '0.5rem',
          }}
        >
          {/* User Preview */}
          <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--border-default)', marginBottom: '0.35rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                <ShieldCheck size={10} /> {user.role}
              </span>
            </div>
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
            className="menu-item-hover"
          >
            <UserIcon size={16} style={{ color: 'var(--text-secondary)' }} />
            Profile
          </Link>

          <Link
            to="/settings"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
            className="menu-item-hover"
          >
            <Settings size={16} style={{ color: 'var(--text-secondary)' }} />
            Settings
          </Link>

          <button
            onClick={() => {
              setIsOpen(false);
              setShowHelpModal(true);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'left',
            }}
            className="menu-item-hover"
          >
            <HelpCircle size={16} style={{ color: 'var(--text-secondary)' }} />
            Help & Documentation
          </button>

          <div style={{ borderTop: '1px solid var(--border-default)', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--status-issue-solid)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textAlign: 'left',
              }}
              className="menu-item-hover"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="NIYAMORA Help & Guidance"
        subtitle="Packaging Compliance Before Print"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
          <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface-subtle)' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--brand-primary)' }}>Core Workflow</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <strong>CHECK → IMPROVE → COMPARE → VERIFY → RECORD</strong>
            </p>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              NIYAMORA helps packaging designers, pre-press managers, and compliance teams screen artwork prior to costly cylinder engraving, plate making, or flexographic print runs.
            </p>
          </div>

          <div>
            <h5 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Where is the Theme switch?</h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Theme preferences (System, Light, Dark) can be adjusted exclusively inside <strong>Settings → Appearance</strong>.
            </p>
          </div>

          <div>
            <h5 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Notice Regarding Regulatory Information</h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              NIYAMORA provides pre-print compliance screening and verification assistance. It is not an official government authority and does not issue legal certificates.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
