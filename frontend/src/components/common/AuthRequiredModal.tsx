import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { NiyamuraLogo } from './NiyamuraLogo';
import { ArrowRight, UserPlus, LogIn, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetWorkflow?: string;
  title?: string;
  description?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  targetWorkflow = '/new-check',
  title = 'SIGN IN REQUIRED TO START A CHECK',
  description = 'Create an account or sign in to check your packaging artwork and manage your inspection history.',
}) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(`${path}?redirect=${encodeURIComponent(targetWorkflow)}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="460px"
    >
      <div style={{ textAlign: 'center', padding: '0.5rem 0.5rem 0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <NiyamuraLogo variant="full" size="md" />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {description}
        </p>

        {/* Concise trust points */}
        <div
          style={{
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--status-good-solid)', flexShrink: 0 }} />
            <span>Pre-print Legal Metrology & FSSAI declaration checks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <span>Tenant-isolated secure file storage & inspection history</span>
          </div>
        </div>

        {/* Action Choice Buttons with standardized labels [ Sign In ] [ Create Account ] */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => handleNavigate('/login')}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', gap: '0.6rem', justifyContent: 'center' }}
          >
            <LogIn size={18} />
            <span>Sign In</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => handleNavigate('/signup')}
            className="btn btn-secondary btn-lg"
            style={{ width: '100%', gap: '0.6rem', justifyContent: 'center' }}
          >
            <UserPlus size={18} />
            <span>Create Account</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
