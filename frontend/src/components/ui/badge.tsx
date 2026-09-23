import * as React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'neutral';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] border-transparent',
    secondary: 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-transparent',
    outline: 'text-[var(--text-primary)] border-[var(--border-default)]',
    success: 'bg-[var(--status-good-bg)] text-[var(--status-good-text)] border-[var(--status-good-border)]',
    warning: 'bg-[var(--status-review-bg)] text-[var(--status-review-text)] border-[var(--status-review-border)]',
    destructive: 'bg-[var(--status-issue-bg)] text-[var(--status-issue-text)] border-[var(--status-issue-border)]',
    neutral: 'bg-[var(--bg-inset)] text-[var(--text-muted)] border-[var(--border-subtle)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
