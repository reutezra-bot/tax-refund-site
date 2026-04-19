'use client';

import { useState } from 'react';
import type { QuestionnaireAnswers, SpecialPeriod } from '@/types/questionnaire';
import type { UploadedDocument } from '@/types/documents';
import { cn } from '@/lib/utils';

interface QuestionnaireFormProps {
  /** Documents from the upload step — years are derived from these */
  documents: UploadedDocument[];
  initial?: Partial<QuestionnaireAnswers>;
  onSubmit: (answers: QuestionnaireAnswers) => void;
  loading?: boolean;
}

function YesNoField({
  label,
  value,
  onChange,
  includeUnknown = false,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  includeUnknown?: boolean;
}) {
  const options: { label: string; v: boolean | null }[] = [
    { label: 'כן', v: true },
    { label: 'לא', v: false },
    ...(includeUnknown ? [{ label: 'לא יודע/ת', v: null as null }] : []),
  ];

  return (
    <div>
      <p className="text-sm font-semibold text-slate-800 mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={cn(
              'px-5 py-2.5 rounded-lg border text-sm font-medium transition-all',
              value === opt.v
                ? 'bg-blue-900 border-blue-900 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SPECIAL_PERIOD_OPTIONS: { value: SpecialPeriod; label: string; icon: string }[] = [
  { value: 'unemployment', label: 'אבטלה', icon: '📋' },
  { value: 'unpaidLeave', label: 'חל"ת', icon: '🏠' },
  { value: 'reserveDuty', label: 'מילואים', icon: '🎖️' },
  { value: 'maternityLeave', label: 'חופשת לידה', icon: '👶' },
  { value: 'none', label: 'ללא אחד מאלה', icon: '—' },
];

function QuestionBlock({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function QuestionnaireForm({ documents, initial = {}, onSubmit, loading }: QuestionnaireFormProps) {
  // Derive years from uploaded documents — replace the old year-selection question
  const detectedYears = [
    ...new Set(
      documents
        .filter((d) => d.detectedYear)
        .map((d) => d.detectedYear as number),
    ),
  ].sort((a, b) => b - a);

  // Fall back to previous year if no tagged docs
  const selectedYears =
    detectedYears.length > 0
      ? detectedYears
      : initial.selectedYears?.length
        ? initial.selectedYears
        : [new Date().getFullYear() - 1];

  const [multipleEmployers, setMultipleEmployers] = useState<boolean | null>(
    initial.multipleEmployers ?? null,
  );
  const [partialYear, setPartialYear] = useState<boolean | null>(initial.partialYear ?? null);
  const [specialPeriods, setSpecialPeriods] = useState<SpecialPeriod[]>(
    initial.specialPeriods ?? [],
  );
  const [hasLifeInsurance, setHasLifeInsurance] = useState<boolean | null>(
    initial.hasLifeInsurance ?? null,
  );
  const [lifeInsuranceMonthly, setLifeInsuranceMonthly] = useState<string>(
    String(initial.lifeInsuranceMonthlyEstimate ?? ''),
  );
  const [hasDonations, setHasDonations] = useState<boolean | null>(initial.hasDonations ?? null);
  const [donationsYearly, setDonationsYearly] = useState<string>(
    String(initial.donationsYearlyEstimate ?? ''),
  );
  const [selfEmployed, setSelfEmployed] = useState<boolean | null>(
    initial.selfEmployedOrForeignIncome ?? null,
  );

  const toggleSpecialPeriod = (period: SpecialPeriod) => {
    setSpecialPeriods((prev) => {
      if (period === 'none') return ['none'];
      const withoutNone = prev.filter((p) => p !== 'none');
      return withoutNone.includes(period)
        ? withoutNone.filter((p) => p !== period)
        : [...withoutNone, period];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      selectedYears,
      multipleEmployers,
      partialYear,
      specialPeriods,
      hasLifeInsurance,
      lifeInsuranceMonthlyEstimate: lifeInsuranceMonthly ? Number(lifeInsuranceMonthly) : undefined,
      hasDonations,
      donationsYearlyEstimate: donationsYearly ? Number(donationsYearly) : undefined,
      selfEmployedOrForeignIncome: selfEmployed,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Years banner (derived from uploaded files — not a question) */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-0.5">שנות מס לבדיקה</p>
          {selectedYears.length > 0 ? (
            <p className="text-sm text-blue-700">
              {selectedYears.join(', ')}
              {detectedYears.length > 0
                ? ' — לפי המסמכים שהועלו'
                : ' — שנה אחרונה (לא צוינה שנה במסמכים)'}
            </p>
          ) : (
            <p className="text-sm text-blue-700">לא צוינה שנה — תתבצע בדיקה לשנה האחרונה</p>
          )}
        </div>
      </div>

      {/* Q1 */}
      <QuestionBlock number={1}>
        <YesNoField
          label="האם היו לכם באותה שנה יותר ממעסיק אחד?"
          value={multipleEmployers}
          onChange={setMultipleEmployers}
        />
      </QuestionBlock>

      {/* Q2 */}
      <QuestionBlock number={2}>
        <YesNoField
          label="האם עבדתם רק חלק מהשנה?"
          value={partialYear}
          onChange={setPartialYear}
        />
      </QuestionBlock>

      {/* Q3: Special periods */}
      <QuestionBlock number={3}>
        <p className="text-sm font-semibold text-slate-800 mb-3">
          האם היו באותה שנה תקופות של אחד מאלה?
        </p>
        <p className="text-xs text-slate-500 mb-3">ניתן לסמן יותר מאפשרות אחת</p>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleSpecialPeriod(opt.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                specialPeriods.includes(opt.value)
                  ? 'bg-blue-900 border-blue-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </QuestionBlock>

      {/* Q4: Life insurance */}
      <QuestionBlock number={4}>
        <YesNoField
          label="האם שילמתם ביטוח חיים באופן פרטי?"
          value={hasLifeInsurance}
          onChange={setHasLifeInsurance}
          includeUnknown
        />
        {hasLifeInsurance === true && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              מה בערך הסכום החודשי? (₪)
            </label>
            <input
              type="number"
              min={0}
              value={lifeInsuranceMonthly}
              onChange={(e) => setLifeInsuranceMonthly(e.target.value)}
              placeholder="לדוגמה: 200"
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 mb-2"
            />
            <p className="text-xs text-slate-500 leading-relaxed">
              אפשר לרשום סכום משוער בלבד. אם נתקדם, נבקש בהמשך אסמכתאות או דוח שנתי מתאים. בשלב הראשוני זה לא חובה.
            </p>
          </div>
        )}
      </QuestionBlock>

      {/* Q5: Donations */}
      <QuestionBlock number={5}>
        <YesNoField
          label="האם תרמתם לעמותות מוכרות לצורכי מס?"
          value={hasDonations}
          onChange={setHasDonations}
          includeUnknown
        />
        {hasDonations === true && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              מה בערך סך התרומות השנתי? (₪)
            </label>
            <input
              type="number"
              min={0}
              value={donationsYearly}
              onChange={(e) => setDonationsYearly(e.target.value)}
              placeholder="לדוגמה: 1000"
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 mb-2"
            />
            <p className="text-xs text-slate-500 leading-relaxed">
              אפשר לרשום סכום משוער בלבד. אם נתקדם, נבקש בהמשך קבלות על התרומות. בשלב הראשוני זה לא חובה.
            </p>
          </div>
        )}
      </QuestionBlock>

      {/* Q6: Self-employed */}
      <QuestionBlock number={6}>
        <YesNoField
          label='האם היו לכם הכנסות מעסק / כעצמאי / מחו"ל?'
          value={selfEmployed}
          onChange={setSelfEmployed}
        />
        <p className="text-xs text-slate-400">
          אם כן, המקרה עשוי לדרוש בדיקה ידנית מורחבת יותר.
        </p>
      </QuestionBlock>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-900 text-white font-bold text-base px-10 py-4 rounded-xl hover:bg-blue-800 disabled:opacity-60 shadow-sm hover:shadow-md transition-all"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            מחשב...
          </>
        ) : (
          <>
            קבלו את התוצאה
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
