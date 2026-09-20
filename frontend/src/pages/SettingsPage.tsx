import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const { user, updateProfile } = useAuth();

  const activeTab = tab || 'general';

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [companyName, setCompanyName] = useState(user?.company || 'Aura Packaging Labs');
  const [userName, setUserName] = useState(user?.name || 'Devin Vance');
  const [userEmail, setUserEmail] = useState(user?.email || 'devin@aurapackaging.com');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: userName, email: userEmail, company: companyName });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Settings', path: '/settings' }, { label: activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }]}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Workspace Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage account preferences, appearance, security credentials, and organization profile.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-container">
          <button
            onClick={() => navigate('/settings/general')}
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          >
            General
          </button>
          <button
            onClick={() => navigate('/settings/appearance')}
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          >
            Appearance (Theme)
          </button>
          <button
            onClick={() => navigate('/settings/security')}
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          >
            Security
          </button>
          <button
            onClick={() => navigate('/settings/notifications')}
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          >
            Notifications
          </button>
          <button
            onClick={() => navigate('/settings/workspace')}
            className={`tab-btn ${activeTab === 'workspace' ? 'active' : ''}`}
          >
            Workspace
          </button>
        </div>

        {savedSuccess && (
          <div
            className="animate-fade-in"
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--status-good-bg)',
              border: '1px solid var(--status-good-border)',
              color: 'var(--status-good-text)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Check size={16} />
            <span>Settings saved successfully.</span>
          </div>
        )}

        {/* TAB: APPEARANCE (ONLY place in the entire app where theme control exists!) */}
        {activeTab === 'appearance' && (
          <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Theme & Interface Appearance</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Select your preferred visual mode. System mode automatically aligns with your operating-system appearance.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Theme Mode Selection
              </label>

              {/* Stylish 3D Segmented Control */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  maxWidth: '560px',
                }}
              >
                {/* System Option */}
                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className="card-tactile"
                  style={{
                    padding: '1.25rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                    border: themeMode === 'system' ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    backgroundColor: themeMode === 'system' ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                    cursor: 'pointer',
                    boxShadow: themeMode === 'system' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'var(--shadow-sm)',
                  }}
                >
                  <Monitor size={24} style={{ color: themeMode === 'system' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: themeMode === 'system' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    System
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Follows OS</span>
                </button>

                {/* Light Option */}
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className="card-tactile"
                  style={{
                    padding: '1.25rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                    border: themeMode === 'light' ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    backgroundColor: themeMode === 'light' ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                    cursor: 'pointer',
                    boxShadow: themeMode === 'light' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'var(--shadow-sm)',
                  }}
                >
                  <Sun size={24} style={{ color: themeMode === 'light' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: themeMode === 'light' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    Light
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Crisp editorial surfaces</span>
                </button>

                {/* Dark Option */}
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className="card-tactile"
                  style={{
                    padding: '1.25rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                    border: themeMode === 'dark' ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    backgroundColor: themeMode === 'dark' ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                    cursor: 'pointer',
                    boxShadow: themeMode === 'dark' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'var(--shadow-sm)',
                  }}
                >
                  <Moon size={24} style={{ color: themeMode === 'dark' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: themeMode === 'dark' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    Dark
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deep charcoal & navy</span>
                </button>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <span>Active resolved theme: <strong>{resolvedTheme.toUpperCase()}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>General Account Preferences</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Basic account and default packaging workspace configuration
            </p>

            <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Default Measurement Unit
                  </label>
                  <select defaultValue="Metric (mm / g / ml)" style={{ width: '100%' }}>
                    <option value="Metric (mm / g / ml)">Metric (mm / g / ml) - Recommended for Legal Metrology</option>
                    <option value="Imperial (in / oz / fl.oz)">Imperial (in / oz / fl.oz)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Default Regulatory Standard
                  </label>
                  <select defaultValue="India (FSSAI / Legal Metrology)" style={{ width: '100%' }}>
                    <option value="India (FSSAI / Legal Metrology)">India (Legal Metrology + FSSAI)</option>
                    <option value="FDA / USA CFR Title 21">FDA / USA (CFR Title 21)</option>
                    <option value="EU Regulation 1169/2011">EU (Regulation 1169/2011)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: SECURITY */}
        {activeTab === 'security' && (
          <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Security & Credentials</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Manage password, active session tokens, and role-based access.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block' }}>Assigned Access Role</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role assigned during workspace invitation</span>
                </div>
                <span className="badge badge-sample" style={{ fontWeight: 800 }}>
                  {user?.role || 'COMPANY_USER'}
                </span>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block' }}>Password</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last updated 3 weeks ago</span>
                </div>
                <button onClick={() => alert('Password change dialog')} className="btn btn-secondary btn-sm">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Notification Preferences</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Configure alerts for pre-print violations, specialist review requests, and PDF report completions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>Pre-Print Violation Alerts</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send email immediately when critical Legal Metrology issues are detected.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>Human Review Requests</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notify when an ambiguous finding requires human sign-off.</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB: WORKSPACE */}
        {activeTab === 'workspace' && (
          <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Organization Workspace</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Manage brand guidelines, team members, and packaging dieline standards.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
};
