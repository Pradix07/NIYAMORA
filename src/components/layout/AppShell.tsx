import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopUtilityBar } from './TopUtilityBar';
import type { BreadcrumbItem } from '../common/Breadcrumbs';
import { X } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export const AppShell: React.FC<AppShellProps> = ({ children, breadcrumbs }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Desktop Sidebar (hidden on mobile via CSS) */}
      <div className="desktop-sidebar-wrapper" style={{ height: '100%', flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: 'var(--sidebar-bg)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1rem 0' }}>
              <button onClick={() => setMobileMenuOpen(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>
            <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>
        <TopUtilityBar
          breadcrumbs={breadcrumbs}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            position: 'relative',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
