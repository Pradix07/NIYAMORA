import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeSwitchProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({
  size = 'sm',
  className = '',
}) => {
  const { themeMode, setThemeMode } = useTheme();

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 13 : 15;
  const padding = isSmall ? '2px' : '3px';

  return (
    <div
      className={`niyamura-theme-switch ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'var(--theme-switch-bg)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-full)',
        padding,
        position: 'relative',
        userSelect: 'none',
        boxShadow: 'var(--shadow-xs)',
      }}
      role="group"
      aria-label="Theme Mode Selection"
    >
      {/* Light Mode Button */}
      <button
        type="button"
        onClick={() => setThemeMode('light')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isSmall ? '4px 6px' : '5px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: themeMode === 'light' ? 'var(--theme-switch-active-bg)' : 'transparent',
          color: themeMode === 'light' ? 'var(--theme-switch-active-text)' : 'var(--text-muted)',
          boxShadow: themeMode === 'light' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
          transition: 'all var(--transition-fast)',
          border: 'none',
          cursor: 'pointer',
        }}
        title="Light mode"
        aria-pressed={themeMode === 'light'}
      >
        <Sun size={iconSize} />
      </button>

      {/* Dark Mode Button */}
      <button
        type="button"
        onClick={() => setThemeMode('dark')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isSmall ? '4px 6px' : '5px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: themeMode === 'dark' ? 'var(--theme-switch-active-bg)' : 'transparent',
          color: themeMode === 'dark' ? 'var(--theme-switch-active-text)' : 'var(--text-muted)',
          boxShadow: themeMode === 'dark' ? '0 1px 3px rgba(0,0,0,0.25)' : 'none',
          transition: 'all var(--transition-fast)',
          border: 'none',
          cursor: 'pointer',
        }}
        title="Dark mode"
        aria-pressed={themeMode === 'dark'}
      >
        <Moon size={iconSize} />
      </button>

      {/* System Preference Button */}
      <button
        type="button"
        onClick={() => setThemeMode('system')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isSmall ? '4px 6px' : '5px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: themeMode === 'system' ? 'var(--theme-switch-active-bg)' : 'transparent',
          color: themeMode === 'system' ? 'var(--theme-switch-active-text)' : 'var(--text-muted)',
          boxShadow: themeMode === 'system' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
          transition: 'all var(--transition-fast)',
          border: 'none',
          cursor: 'pointer',
        }}
        title="System preference"
        aria-pressed={themeMode === 'system'}
      >
        <Laptop size={iconSize} />
      </button>
    </div>
  );
};
