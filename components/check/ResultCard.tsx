import Link from 'next/link';
import type { EligibilityResult, RefundRange } from '@/lib/eligibility';
import { REFUND_RANGE_LABELS, CONFIDENCE_LABELS } from '@/lib/eligibility';
import { cn } from '@/lib/utils';

const resultConfig = {
  positive: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-emerald-100 text-emerald-700',
    borderColor: 'border-emerald-200',
    titleColor: 'text-emerald-800',
    title: 'נמצאה אינדיקציה ראשונית להחזר מס',
    body: 'לפי הנתונים שהוזנו והמסמכים שצורפו, נראה שייתכן שמגיע לך החזר מס. כדי שנוכל לבצע בדיקה מעמיקה יותר ולחזור אליך, אפשר להשאיר עכשיו פרטים.',
    ctaLabel: 'השאירו פרטים ונחזור אליכם',
    ctaStyle: 'bg-emerald-700 hover:bg-emerald-600 text-white',
    bg: 'bg-emerald-50',
  },
  review: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    iconBg: 'bg-amber-100 text-amber-700',
    borderColor: 'border-amber-200',
    titleColor: 'text-amber-800',
    title: 'נדרשת בדיקה נוספת',
    body: 'נמצאו נתונים שעשויים להצביע על זכאות, אך נדרשת בדיקה נוספת כדי לקבוע זאת בצורה מדויקת יותר.',
    ctaLabel: 'השאירו פרטים לבדיקה',
    ctaStyle: 'bg-amber-700 hover:bg-amber-600 text-white',
    bg: 'bg-amber-50',
  },
  insufficient: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-slate-100 text-slate-500',
    borderColor: 'border-slate-200',
    titleColor: 'text-slate-700',
    title: 'כרגע לא זוהתה אינדיקציה מספקת',
    body: 'לפי הבדיקה הראשונית, כרגע לא זוהתה אינדיקציה מספקת להחזר במסלול זה. אם יש פרטים נוספים שלא הוזנו או אם תרצו שנבדוק בכל זאת, אפשר להשאיר פרטים.',
    ctaLabel: 'השאירו פרטים בכל זאת',
    ctaStyle: 'bg-slate-700 hover:bg-slate-600 text-white',
    bg: 'bg-slate-50',
  },
} as const;

const refundRangeConfig: Record<RefundRange, { label: string; color: string; bg: string; barWidth: string }> = {
  up_to_2k: {
    label: REFUND_RANGE_LABELS.up_to_2k,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    barWidth: 'w-1/3',
  },
  '2k_to_6k': {
    label: REFUND_RANGE_LABELS['2k_to_6k'],
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    barWidth: 'w-2/3',
  },
  above_6k: {
    label: REFUND_RANGE_LABELS.above_6k,
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    barWidth: 'w-full',
  },
};

const confidenceConfig = {
  high:   { label: CONFIDENCE_LABELS.high,   color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  medium: { label: CONFIDENCE_LABELS.medium, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  low:    { label: CONFIDENCE_LABELS.low,    color: 'text-slate-600 bg-slate-100 border-slate-200' },
};

interface ResultCardProps {
  result: EligibilityResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const config = resultConfig[result.type];
  const confidence = confidenceConfig[result.confidenceLevel];

  return (
    <div className={cn('rounded-2xl border-2 p-6 sm:p-8 space-y-6', config.borderColor, config.bg)}>

      {/* ── Header: Icon + Title ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', config.iconBg)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className={cn('text-2xl font-bold leading-snug', config.titleColor)}>
              {config.title}
            </h2>
            {/* Confidence badge inline with title */}
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border shrink-0', confidence.color)}>
              ודאות: {confidence.label}
            </span>
          </div>
          <p className="text-slate-600 mt-1 leading-relaxed text-sm sm:text-base">{config.body}</p>
        </div>
      </div>

      {/* ── Preliminary refund range ────────────────────────────────── */}
      {result.refundRange && (
        <div className={cn('rounded-xl p-5 border border-white/60', refundRangeConfig[result.refundRange].bg)}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                אומדן ראשוני
              </p>
              <p className={cn('text-3xl font-extrabold', refundRangeConfig[result.refundRange].color)}>
                {refundRangeConfig[result.refundRange].label}
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-white/70 border border-slate-200 px-2.5 py-1 rounded-full">
              ראשוני בלבד
            </span>
          </div>

          {/* Visual range bar */}
          <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                result.refundRange === 'up_to_2k'
                  ? 'bg-slate-400'
                  : result.refundRange === '2k_to_6k'
                    ? 'bg-blue-500'
                    : 'bg-emerald-500',
                refundRangeConfig[result.refundRange].barWidth,
              )}
            />
          </div>

          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            האומדן הוא ראשוני בלבד, מבוסס על הנתונים והמסמכים שהוזנו, ואינו מהווה קביעה
            סופית לזכאות או לגובה ההחזר.
          </p>
        </div>
      )}

      {/* ── Indicators ─────────────────────────────────────────────── */}
      {result.indicators.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            גורמים שנלקחו בחשבון
          </p>
          <ul className="flex flex-wrap gap-2">
            {result.indicators.map((ind) => (
              <li
                key={ind}
                className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full"
              >
                <svg className="w-3 h-3 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Why did I get this result? ──────────────────────────────── */}
      {result.reasoningBullets.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-white/80 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            למה קיבלתי את התוצאה הזו?
          </p>
          <ul className="space-y-2">
            {result.reasoningBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Warnings ───────────────────────────────────────────────── */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1.5">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5 leading-relaxed">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {w}
            </p>
          ))}
        </div>
      )}

      {/* ── Legal disclaimer ────────────────────────────────────────── */}
      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-200/60 pt-4">
        * זו אינדיקציה ראשונית בלבד ואינה מהווה ייעוץ מס. התוצאה הסופית תיקבע לאחר בדיקה מעמיקה על ידי מומחה מס.
      </p>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <Link
        href="/check/contact"
        className={cn(
          'inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base shadow-sm hover:shadow-md transition-all',
          config.ctaStyle,
        )}
      >
        {config.ctaLabel}
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
