import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VerificationState = 'idle' | 'success' | 'error';

interface VerificationBadgeProps {
  status: VerificationState;
  text?: string;
  className?: string;
}

export function VerificationBadge({ status, text, className }: VerificationBadgeProps) {
  const config = {
    idle: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: <Clock className="w-3 h-3" />,
      defaultText: 'Waiting for input...'
    },
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <Check className="w-3 h-3" />,
      defaultText: 'Verified'
    },
    error: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <X className="w-3 h-3" />,
      defaultText: 'Invalid'
    }
  };

  const current = config[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        current.bg,
        current.text,
        current.border,
        className
      )}
    >
      {current.icon}
      <span>{text || current.defaultText}</span>
    </div>
  );
}
