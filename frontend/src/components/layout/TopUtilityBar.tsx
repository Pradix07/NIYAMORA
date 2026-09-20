import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Search } from 'lucide-react';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSwitch } from '../common/ThemeSwitch';
import { Breadcrumbs } from '../common/Breadcrumbs';
import type { BreadcrumbItem } from '../common/Breadcrumbs';

interface TopUtilityBarProps {
  breadcrumbs?: BreadcrumbItem[];
  onOpenMobileMenu?: () => void;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({
  breadcrumbs = [{ label: 'Dashboard' }],
  onOpenMobileMenu,
}) => {
  const navigate = useNavigate();

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--topbar-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-default)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        gap: '1rem',
      }}
    >
      {/* Left side: Mobile menu toggle + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onOpenMobileMenu}
          className="btn-icon mobile-menu-btn"
          aria-label="Open sidebar menu"
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Right side: Global Search + ThemeSwitch + + New Check CTA + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Quick Search */}
        <div style={{ position: 'relative', display: 'none' }} className="desktop-search-container">
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search packaging SKUs, rules, or findings..."
            style={{
              paddingLeft: '32px',
              paddingRight: '12px',
              height: '34px',
              fontSize: '0.8125rem',
              width: '260px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>

        {/* 3-State Theme Switch */}
        <ThemeSwitch size="sm" />

        {/* Quick New Check CTA */}
        <button
          onClick={() => navigate('/new-check')}
          className="btn btn-primary btn-sm"
          style={{ height: '34px', gap: '0.35rem' }}
        >
          <Plus size={15} />
          <span>New Check</span>
        </button>

        {/* Profile Menu Dropdown */}
        <ProfileMenu />
      </div>
    </header>
  );
};
