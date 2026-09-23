import React from 'react';
import { cn } from '../../utils/cn';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick,
  badge,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  badge?: string;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'row-span-1 rounded-2xl group/bento hover:shadow-xl transition duration-300 p-6 bg-[var(--card-bg)] border border-[var(--border-default)] justify-between flex flex-col space-y-4 cursor-pointer relative overflow-hidden hover:border-[var(--brand-primary)]/40',
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        <div className="flex items-center justify-between mb-2">
          {icon}
          {badge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
              {badge}
            </span>
          )}
        </div>
        <div className="font-heading font-bold text-[var(--text-primary)] text-lg mb-1 mt-2">
          {title}
        </div>
        <div className="font-normal text-[var(--text-secondary)] text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
