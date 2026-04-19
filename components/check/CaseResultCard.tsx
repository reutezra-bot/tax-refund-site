'use client';

import Link from 'next/link';
import type { CaseResult, AnnualResult, RefundRange } from '@/types/case';
import { cn } from '@/lib/utils';

// ── 4 business outcomes ───────────────────────────────────────────────────────

type BusinessOutcome = 'no_indication' | 'up_to_2k' | '2k_to_6k' | 'above_6k';

function getOutcome(result: CaseResult): BusinessOutcome {
  if (result.refundRange === 'above_6k') return 'above_6k';
  if (result.refundRange === '2k_to_6k') return '2k_to_6k';
  if (result.refundRange === 'up_to_2k') return 'up_to_2k';
  return 'no_indication';
}

const OUTCOME: Record<
  BusinessOutcome,
  { title: string; body: string; disclaimer: string; positive: boolean }
> = {
  no_indication: {
    title: 'לא זוהתה כרגע אינדיקציה ברורה להחזר מס',
    body: 'לפי הפרטים והמסמכים שצירפת, בשלב זה לא זוהתה אינדיקציה ברורה לזכאות להחזר מס.',
    disclaimer:
      'מדובר בהערכה ראשונית בלבד, ולא בבדיקה סופית או ייעוץ מס. ייתכן שבבדיקה מלאה של כלל הנתונים והמסמכים תתקבל תוצאה שונה.',
    positive: false,
  },
  up_to_2k: {
    title: 'ייתכן שמגיע לך החזר מס של עד 2,000 ₪',
    body: 'לפי הפרטים והמסמכים שצירפת, נמצאה אינדיקציה ראשונית לזכאות אפשרית להחזר מס בטווח של עד 2,000 ₪.',
    disclaimer:
      'מדובר בהערכה ראשונית בלבד, ולא בבדיקה סופית או ייעוץ מס. הסכום הסופי עשוי להשתנות לאחר בדיקה מלאה של כלל הנתונים והמסמכים.',
    positive: true,
  },
  '2k_to_6k': {
    title: 'ייתכן שמגיע לך החזר מס בטווח של 2,000–6,000 ₪',
    body: 'לפי הפרטים והמסמכים שצירפת, נמצאה אינדיקציה ראשונית לזכאות אפשרית להחזר מס בטווח זה.',
    disclaimer:
      'מדובר בהערכה ראשונית בלבד, ולא בבדיקה סופית או ייעוץ מס. הסכום הסופי עשוי להשתנות לאחר בדיקה מלאה של כלל הנתונים והמסמכים.',
    positive: true,
  },
  above_6k: {
    title: 'ייתכן שמגיע לך החזר מס של מעל 6,000 ₪',
    body: 'לפי הפרטים והמסמכים שצירפת, נמצאה אינדיקציה ראשונית לזכאות אפשרית להחזר מס בסכום שעולה על 6,000 ₪.',
    disclaimer:
      'מדובר בהערכה ראשונית בלבד, ולא בבדיקה סופית או ייעוץ מס. הסכום הסופי עשוי להשתנות לאחר בדיקה מלאה של כלל הנתונים והמסמכים.',
    positive: true,
  },
};

// ── Per-year row ──────────────────────────────────────────────────────────────

const RANGE_LABELS: Record<RefundRange, string> = {
  up_to_2k: 'עד 2,000 ₪',
  '2k_to_6k': '2,000–6,000 ₪',
  above_6k: 'מעל 6,000 ₪',
};

function AnnualSummaryRow({ summary }: { summary: AnnualResult }) {
  const hasRange = summary.type === 'positive' && summary.refundRange;

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
      <p className="text-sm font-semibold text-slate-800">שנת מס {summary.year}</p>
      {hasRange ? (
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          {RANGE_LABELS[summary.refundRange!]}
        </span>
      ) : summary.type === 'positive' ? (
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          אינדיקציה חיובית
        </span>
      ) : null}
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface Props {
  result: CaseResult;
}

export default function CaseResultCard({ result }: Props) {
  const outcome = getOutcome(result);
  const { title, body, disclaimer, positive } = OUTCOME[outcome];

  return (
    <div className="space-y-4">
      {/* Main result banner */}
      <div
        className={cn(
          'rounded-2xl border p-6',
          positive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200',
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              positive ? 'bg-emerald-100' : 'bg-slate-100',
            )}
          >
            {positive ? (
              <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className={cn(
                'text-lg font-bold mb-2',
                positive ? 'text-emerald-900' : 'text-slate-700',
              )}
            >
              {title}
            </h2>
            <p className={cn('text-sm mb-3', positive ? 'text-emerald-800' : 'text-slate-600')}>
              {body}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">{disclaimer}</p>
          </div>
        </div>
      </div>

      {/* Per-year breakdown — only when multiple years */}
      {result.yearlySummaries.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">פירוט לפי שנה</p>
          <div>
            {result.yearlySummaries.map((s) => (
              <AnnualSummaryRow key={s.year} summary={s} />
            ))}
          </div>
        </div>
      )}

      {/* Cross-year informational notes */}
      {result.crossYearWarnings.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-1">
          {result.crossYearWarnings.map((w, i) => (
            <p key={i} className="text-xs text-slate-500 flex gap-2">
              <span className="shrink-0">ℹ</span>
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="pt-2">
        <Link
          href="/check/contact"
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-base px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          {positive ? 'אני רוצה לבדוק זכאות מלאה' : 'השאירו פרטים ונחזור אליכם'}
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
