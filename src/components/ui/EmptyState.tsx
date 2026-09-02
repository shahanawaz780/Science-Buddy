import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-bold font-heading text-slate-800">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
