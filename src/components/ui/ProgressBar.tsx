import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'emerald' | 'indigo' | 'amber' | 'gradient';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  variant = 'emerald',
  className = '',
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  };

  const variantStyles = {
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500'
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>{label || 'Progress'}</span>
          <span className="font-mono text-slate-900">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 ${sizeStyles[size]}`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
