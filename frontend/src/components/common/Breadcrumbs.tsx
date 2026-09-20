import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
      <Link to="/dashboard" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} title="Dashboard">
        <Home size={14} />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={12} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
            {isLast || !item.path ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
            ) : (
              <Link to={item.path} style={{ color: 'var(--text-secondary)' }}>
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
