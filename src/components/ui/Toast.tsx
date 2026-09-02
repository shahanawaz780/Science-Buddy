import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = ''
}) => {
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-950',
      iconColor: 'text-emerald-600'
    },
    error: {
      icon: AlertCircle,
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-950',
      iconColor: 'text-rose-600'
    },
    info: {
      icon: Info,
      border: 'border-sky-200',
      bg: 'bg-sky-50',
      text: 'text-sky-950',
      iconColor: 'text-sky-600'
    }
  };

  const { icon: Icon, border, bg, text, iconColor } = typeConfig[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-md ${bg} ${border} ${text} ${className} animate-in slide-in-from-top-2 duration-200`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 space-y-0.5">
        <h4 className="text-sm font-bold leading-tight">{title}</h4>
        {message && <p className="text-xs text-slate-600 leading-relaxed">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
