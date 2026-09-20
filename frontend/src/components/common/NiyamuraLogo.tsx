import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

interface NiyamuraLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  to?: string;
  className?: string;
  style?: React.CSSProperties;
  showTagline?: boolean;
}

export const NiyamuraLogo: React.FC<NiyamuraLogoProps> = ({
  variant = 'full',
  size = 'md',
  to = '/',
  className = '',
  style = {},
  showTagline = true,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { height: 26, markWidth: 26, fontSize: '1.25rem', tagSize: '0.625rem', gap: '0.5rem' };
      case 'lg':
        return { height: 42, markWidth: 42, fontSize: '2rem', tagSize: '0.8125rem', gap: '0.75rem' };
      case 'xl':
        return { height: 54, markWidth: 54, fontSize: '2.6rem', tagSize: '0.9375rem', gap: '0.875rem' };
      case 'md':
      default:
        return { height: 34, markWidth: 34, fontSize: '1.6rem', tagSize: '0.7rem', gap: '0.625rem' };
    }
  };

  const { height, markWidth, fontSize, tagSize } = getDimensions();
  const stemColor = isDark ? '#FFFFFF' : '#0B0F19';

  // The stylized "N" mark matching Image 1 and Image 3
  const StylizedN = ({ iconSize = height }: { iconSize?: number }) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="niyamuraRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="25%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="85%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Left vertical stem */}
      <rect x="5" y="6" width="7" height="28" rx="1.5" fill={stemColor} />

      {/* Right vertical stem */}
      <rect x="28" y="6" width="7" height="28" rx="1.5" fill={stemColor} />

      {/* Stylized diagonal radiant ribbon blade crossing through N */}
      <path
        d="M6 7.5C6 6.67 6.8 6 7.8 6C8.3 6 8.8 6.25 9.1 6.6L32.8 32.5C33.4 33.1 33.4 34 32.7 34.6C32.1 35.1 31.2 35.1 30.6 34.5L6.9 8.6C6.3 8.0 6 7.75 6 7.5Z"
        fill="url(#niyamuraRibbonGrad)"
        filter="url(#ribbonGlow)"
      />

      {/* Top curved ribbon highlight wing */}
      <path
        d="M6 14C6 8.5 10 6 15 6L8.5 13.5C7.2 15 6 15.5 6 14Z"
        fill="url(#niyamuraRibbonGrad)"
        opacity="0.9"
      />

      {/* Bottom curved ribbon flare */}
      <path
        d="M34 26C34 31.5 30 34 25 34L31.5 26.5C32.8 25 34 24.5 34 26Z"
        fill="url(#niyamuraRibbonGrad)"
        opacity="0.9"
      />
    </svg>
  );

  // Icon only (squircle app mark variant)
  if (variant === 'icon') {
    return (
      <div
        className={`niyamura-icon-mark ${className}`}
        style={{
          width: `${markWidth}px`,
          height: `${markWidth}px`,
          borderRadius: '10px',
          backgroundColor: isDark ? '#0B0F19' : '#FFFFFF',
          border: '1px solid var(--border-default)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-xs)',
          ...style,
        }}
      >
        <StylizedN iconSize={markWidth * 0.85} />
      </div>
    );
  }

  // Typography-First Wordmark matching Image 1
  const content = (
    <div
      className={`niyamura-brand-wordmark ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        userSelect: 'none',
        textDecoration: 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
        {/* Stylized initial N */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '1px' }}>
          <StylizedN iconSize={height} />
        </div>

        {/* Wordmark: iyamura™ */}
        <span
          style={{
            fontSize,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-heading)',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'flex-start',
          }}
        >
          iyamura
          <span
            style={{
              fontSize: '0.45em',
              fontWeight: 700,
              marginLeft: '2px',
              marginTop: '1px',
              color: 'var(--text-muted)',
              fontFamily: 'sans-serif',
            }}
          >
            TM
          </span>
        </span>
      </div>

      {/* Subtitle / Tagline directly underneath */}
      {variant === 'full' && showTagline && (
        <span
          style={{
            fontSize: tagSize,
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            marginTop: '2px',
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          Packaging Compliance Before Print
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {content}
      </Link>
    );
  }

  return content;
};
