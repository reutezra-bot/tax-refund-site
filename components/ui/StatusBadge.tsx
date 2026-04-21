import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types/lead';
import type { InitialResultType } from '@/types/lead';

const statusColors: Record<LeadStatus, string> = {
  'חדש': 'bg-blue-50 text-blue-700 border-blue-200',
  'ממתין לבדיקה': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'נבדק': 'bg-slate-50 text-slate-600 border-slate-200',
  'חסר מסמכים': 'bg-orange-50 text-orange-700 border-orange-200',
  'רלוונטי להמשך טיפול': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'לא רלוונטי': 'bg-red-50 text-red-600 border-red-200',
  'טופל': 'bg-slate-100 text-slate-500 border-slate-200',
};

const resultColors: Record<InitialResultType, string> = {
  potential_refund: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  needs_review: 'bg-amber-50 text-amber-700 border-amber-200',
  no_clear_indication: 'bg-slate-50 text-slate-500 border-slate-200',
};

const resultLabels: Record<InitialResultType, string> = {
  potential_refund: 'אינדיקציה חיובית',
  needs_review: 'נדרשת בדיקה',
  no_clear_indication: 'לא זוהתה אינדיקציה',
};

interface StatusBadgeProps {
  type: 'status' | 'result';
  value: LeadStatus | InitialResultType;
  className?: string;
}

export default function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const colorClass =
    type === 'status'
      ? statusColors[value as LeadStatus]
      : resultColors[value as InitialResultType];

  const label =
    type === 'status' ? value : resultLabels[value as InitialResultType];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
