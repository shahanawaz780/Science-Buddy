import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  id,
  className = '',
  disabled,
  ...props
}, ref) => {
  const generatedId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={generatedId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-2xs">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={generatedId}
          disabled={disabled}
          className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-xl border transition-all duration-150 py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            Icon && iconPosition === 'left' ? 'pl-10' : ''
          } ${Icon && iconPosition === 'right' ? 'pr-10' : ''} ${
            error ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-semibold text-rose-600 animate-in fade-in-50">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
