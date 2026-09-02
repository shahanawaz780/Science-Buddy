import React from 'react';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading science content...',
  description = 'Please wait a moment while we prepare your lesson.',
  className = ''
}) => {
  return (
    <div className={`p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-emerald-100 border-t-emerald-600 animate-spin" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-base font-bold font-heading text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
