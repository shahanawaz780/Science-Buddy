import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this information. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) => {
  return (
    <div className={`p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl bg-rose-50/50 border border-rose-200/70 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-bold font-heading text-slate-900">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={RotateCcw}
          className="border-rose-200 hover:bg-rose-50 text-rose-900"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
