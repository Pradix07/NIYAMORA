import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  Cpu,
  SearchCheck,
  Wand2,
  History,
  GitCompare,
  TrendingDown,
  Sliders,
  CheckSquare,
  FileSpreadsheet,
  FileCheck2,
  BookOpen,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  onItemClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const location = useLocation();
  const [settingsExpanded, setSettingsExpanded] = useState(() => location.pathname.startsWith('/settings'));

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Boxes },
    { label: 'New Check', path: '/new-check', icon: PlusCircle, highlight: true },
    { label: 'Processing', path: '/processing', icon: Cpu },
    { label: 'Results / Workbench', path: '/workbench', icon: SearchCheck },
    { label: 'Improve Design', path: '/improve', icon: Wand2 },
    { label: 'Versions', path: '/versions', icon: History },
    { label: 'Compare', path: '/compare', icon: GitCompare },
    { label: 'Regression', path: '/regression', icon: TrendingDown },
    { label: 'Simulator', path: '/simulator', icon: Sliders },
    { label: 'Review Center', path: '/review', icon: CheckSquare, badge: '3' },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Label Passport', path: '/passport', icon: FileCheck2 },
    { label: 'Rule Library', path: '/rules', icon: BookOpen },
  ];

  const settingsSubItems = [
    { label: 'General', path: '/settings/general' },
    { label: 'Appearance', path: '/settings/appearance', note: 'Theme' },
    { label: 'Security', path: '/settings/security' },
    { label: 'Notifications', path: '/settings/notifications' },
    { label: 'Workspace', path: '/settings/workspace' },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border-default)' }}>
        <NavLink to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M8 22V10L16 18L24 10V22" stroke="#FFFFFF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="24" cy="22" r="2.5" fill="#10B981"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', display: 'block', lineHeight: 1 }}>
              NIYAMORA
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.01em', marginTop: '3px', display: 'block' }}>
              Packaging Compliance
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '0.875rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.35rem 0.65rem 0.25rem' }}>
          Compliance Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: isItemActive ? 600 : 500,
                color: isItemActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                backgroundColor: isItemActive ? 'var(--brand-primary-light)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
              className="sidebar-link-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={17} style={{ color: isItemActive ? 'var(--brand-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    backgroundColor: 'var(--status-review-bg)',
                    color: 'var(--status-review-text)',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--status-review-border)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Settings Collapsible Section */}
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-default)' }}>
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: location.pathname.startsWith('/settings') ? 'var(--brand-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            className="sidebar-link-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Settings size={17} style={{ color: 'var(--text-muted)' }} />
              <span>Settings</span>
            </div>
            {settingsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {settingsExpanded && (
            <div style={{ paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.2rem' }}>
              {settingsSubItems.map((sub) => {
                const isSubActive = location.pathname === sub.path || (sub.path === '/settings/general' && location.pathname === '/settings');
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    onClick={onItemClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      fontWeight: isSubActive ? 600 : 500,
                      color: isSubActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      backgroundColor: isSubActive ? 'var(--brand-primary-light)' : 'transparent',
                    }}
                    className="sidebar-link-hover"
                  >
                    <span>{sub.label}</span>
                    {sub.note && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {sub.note}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer Branding Badge (NO profile here, profile is strictly top-right!) */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>NIYAMORA Workspace</p>
        <p style={{ fontSize: '0.7rem' }}>Phase 1 Product Foundation</p>
      </div>
    </aside>
  );
};
