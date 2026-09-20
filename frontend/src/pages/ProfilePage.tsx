import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Settings } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell breadcrumbs={[{ label: 'Profile' }]}>
      <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>User Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Account details, assigned organization role, and compliance activity permissions
          </p>
        </div>

        {/* Profile Card */}
        <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.75rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              {user ? user.name.charAt(0).toUpperCase() : 'D'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user?.name || 'Compliance User'}</h2>
                <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                  <ShieldCheck size={12} /> {user?.role || 'COMPANY_USER'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {user?.email || 'user@company.com'} • {user?.company || 'Company Workspace'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid-2" style={{ gap: '1.25rem', borderTop: '1px solid var(--border-default)', paddingTop: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Company Affiliation
              </span>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                {user?.company || 'Company Workspace'}
              </p>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Permissions Level
              </span>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                Standard Artwork Uploader & Pre-Print Inspector
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
            <button onClick={() => navigate('/settings/appearance')} className="btn btn-secondary" style={{ gap: '0.35rem' }}>
              <Settings size={15} />
              <span>Appearance & Settings</span>
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
