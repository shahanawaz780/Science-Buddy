import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'accent' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-2xl transition-all duration-150';

  const variantStyles = {
    default: 'border border-slate-200/90 shadow-2xs',
    elevated: 'border border-slate-200/80 shadow-sm hover:shadow-md',
    interactive: 'border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-sm cursor-pointer',
    accent: 'border border-emerald-200 bg-emerald-50/40 shadow-2xs',
    subtle: 'border border-slate-200/60 bg-slate-50/70 shadow-none'
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
