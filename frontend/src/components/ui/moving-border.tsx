import React from 'react';
import { cn } from '../../utils/cn';

export function Button({
  borderRadius = '0.75rem',
  children,
  as: Component = 'button',
  className,
  onClick,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  as?: any;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) {
  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-transparent relative text-sm font-semibold p-[1px] overflow-hidden group/btn inline-flex items-center justify-center transition-transform active:scale-[0.98]',
        className
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0 rounded-[inherit] bg-[var(--brand-gradient)] opacity-80 group-hover/btn:opacity-100 transition-opacity"
      />
      <div
        className="relative px-6 py-3 rounded-[calc(0.75rem-1px)] bg-[var(--brand-primary)] text-white flex items-center justify-center space-x-2 font-medium w-full h-full group-hover/btn:bg-[var(--brand-primary-hover)] transition-colors"
      >
        {children}
      </div>
    </Component>
  );
}
