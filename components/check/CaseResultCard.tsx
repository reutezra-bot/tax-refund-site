'use client';

import Link from 'next/link';
import type { CaseResult, AnnualResult, RefundRange } from '@/types/case';
import { cn } from '@/lib/utils';

type BusinessOutcome = 'no_clear_indication' | 'up_to_2k' | '2k_to_6k' | 'above_6k' | 'needs_review';

function getOutcome(result: CaseResult): BusinessOutcome {
  if (result.refundRange === 'above_6k') return 'above_6k';
  if (result.refundRange === '2k_to_6k') return '2k_to_6k';
  if (result.refundRange === 'up_to_2k') return 'up_to_2k';
  if (result.type === 'needs_review') return 'needs_review';
  return 'no_clear_indication';
}

const OUTCOME: Record<
  BusinessOutcome,
  { title: string; body: string; disclaimer: string; positive: boolean; review?: boolean }
> = {
  no_clear_indication: {
    title: 'לא זוהתה כרגע אינדיקציה ברורה להחזר מס',
    body: 'לפי הפרטים והמסמכים שצירפת, בשלב זה לא זוהתה אינדיקציה ברורה לזכאות להחזר מס. חשוב לוודא שכל המידע הרלוונטי הוזן — תרומות, ביטוח חיים, מילואים, חל"ת, חופשת לידה ומעסיקים נוספים.',
    disclaimer: 'מדובר בהערכה ראשונית בלבד, ולא בבדיקה סופית או ייעוץ מס.',
    positive: false,
  },
  needs_review: {
    title: 'המידע שמסרת מצביע על ייתכנות להחזר מס — נדרשת בדיקה',
    body: 'תשובותיך מצביעות על גורמים שעשויים להקנות זכאות להחזר מס, אך נדרשים פרטים נוספים כדי לאמוד זאת במדויק. מומחה שלנו יבדוק את המקרה שלך ויחזור אליך.',
    disclaimer: 'מדובר בהערכה ראשונית בלבד, ולא בבדיקה סופית או ייעוץ מס.',
    positive: false,
    review: true,
  },
  up_to_2k: {
    title: 'ייתכן שמגיע לך החזר מס של עד 2,000 ₪',
    body: 'לפי הפרטים והמסמכים שצירפת, נמצאה אינדיקציה ראשונית לזכאות אפשרית להחזר מס בטווח של עד 2,000 ₪.',
    disclaimer: 'מדובר בהערכה ראשונית בלבד. הסכום הסופי עשוי להשתנות לאחר בדיקה מלאה.',
    positive: true,
  },
  '2k_to_6k': {
    title: 'ייתכן שמגיע לך החזר מס בטווח של 2,000–6,000 ₪',
    body: 'לפי הפרטים והמסמכים שצירפת, נמצאה אינדיקציה ראשונית לזכאות אפשרית להחזר מס בטווח זה.',
    disclaimer: 'מדובר בהערכה ראשונית בלבד. הסכום הסופי עשוי להשתנות לאחר בדיקה מלאה.',
    positive: true,
  },
  above_6k: {
    title: 'ייתכן שמגיע לך החזר מס של מעל 6,000 ₪',
    body: 'לפי הפרטים והמסמכים שצירפת, נמצאה אינדיקציה ראשונית לזכאות אפשרית להחזר מס בסכום שעולה על 6,000 ₪.',
    disclaimer: 'מדובר בהערכה ראשונית בלבד. הסכום הסופי עשוי להשתנות לאחר בדיקה מלאה.',
    positive: true,
  },
};

const RANGE_LABELS: Record<RefundRange, string> = {
  up_to_2k: 'עד 2,000 ₪',
  '2k_to_6k': '2,000–6,000 ₪',
  above_6k: 'מעל 6,000 ₪',
};

function AnnualSummaryRow({ summary }: { summary: AnnualResult }) {
  const hasRange = summary.type === 'potential_refund' && summary.refundRange;

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
      <p className="text-sm font-semibold text-slate-800">שנת מס {summary.year}</p>
      {hasRange ? (
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          {RANGE_LABELS[summary.refundRange!]}
        </span>
      ) : summary.type === 'potential_refund' ? (
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          אינדיקציה חיובית
        </span>
      ) : summary.type === 'needs_review' ? (
        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          נדרשת בדיקה
        </span>
      ) : null}
    </div>
  );
}

interface Props {
  result: CaseResult;
}

export default function CaseResultCard({ result }: Props) {
  const outcome = getOutcome(result);
  const { title, body, disclaimer, positive, review } = OUTCOME[outcome];

  const bannerColor = positive
    ? 'bg-emerald-50 border-emerald-200'
    : review
    ? 'bg-amber-50 border-amber-200'
    : 'bg-slate-50 border-slate-200';

  const iconBg = positive ? 'bg-emerald-100' : review ? 'bg-amber-100' : 'bg-slate-100';
  const titleColor = positive ? 'text-emerald-900' : review ? 'text-amber-900' : 'text-slate-700';
  const bodyColor = positive ? 'text-emerald-800' : review ? 'text-amber-800' : 'text-slate-600';

  return (
    <div className="space-y-4">
      {/* Main result banner */}
      <div className={cn('rounded-2xl border p-6', bannerColor)}>
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            {positive ? (
              <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : review ? (
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className={cn('text-lg font-bold mb-2', titleColor)}>{title}</h2>
            <p className={cn('text-sm mb-3', bodyColor)}>{body}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{disclaimer}</p>
          </div>
        </div>
      </div>

      {/* Missing data — shown for needs_review */}
      {result.missingData.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-amber-800 mb-1">מידע שעשוי לשפר את הדיוק:</p>
          {result.missingData.map((item, i) => (
            <p key={i} className="text-xs text-amber-700 flex gap-2">
              <span className="shrink-0">•</span>
              <span>{item}</span>
            </p>
          ))}
        </div>
      )}

      {/* Per-year breakdown */}
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

      {/* Cross-year warnings */}
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
