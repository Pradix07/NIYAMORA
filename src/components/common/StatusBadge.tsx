import React from 'react';
import type { ComplianceStatus } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplianceStatus | 'FIXED' | 'NEW_ISSUE' | 'PENDING' | 'PASSED' | 'ACTION_REQUIRED' | 'UNDER_REVIEW' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  label,
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'GOOD':
      case 'PASSED':
        return {
          cssClass: 'badge-good',
          icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} />,
          text: label || 'PASS',
        };
      case 'REVIEW':
      case 'UNDER_REVIEW':
      case 'PENDING':
        return {
          cssClass: 'badge-review',
          icon: <AlertTriangle size={size === 'sm' ? 12 : 14} />,
          text: label || 'REVIEW',
        };
      case 'ISSUE':
      case 'ACTION_REQUIRED':
        return {
          cssClass: 'badge-issue',
          icon: <XCircle size={size === 'sm' ? 12 : 14} />,
          text: label || 'ISSUE',
        };
      case 'FIXED':
        return {
          cssClass: 'badge-fixed',
          icon: <Sparkles size={size === 'sm' ? 12 : 14} />,
          text: label || 'FIXED',
        };
      case 'NEW_ISSUE':
        return {
          cssClass: 'badge-issue',
          icon: <AlertCircle size={size === 'sm' ? 12 : 14} />,
          text: label || 'NEW ISSUE',
        };
      default:
        return {
          cssClass: 'badge-neutral',
          icon: null,
          text: label || status,
        };
    }
  };

  const { cssClass, icon, text } = getBadgeConfig();

  return (
    <span className={`badge ${cssClass} ${className}`} style={{ fontSize: size === 'sm' ? '0.7rem' : size === 'lg' ? '0.85rem' : '0.75rem', padding: size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.65rem' }}>
      {showIcon && icon}
      <span>{text}</span>
    </span>
  );
};
