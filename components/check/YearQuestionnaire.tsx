'use client';

import { useState } from 'react';
import type { YearAnswers, SpecialPeriod } from '@/types/case';
import { cn } from '@/lib/utils';

interface YearQuestionnaireProps {
  year: number;
  initial?: YearAnswers;
  onSubmit: (answers: YearAnswers) => void;
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

const SPECIAL_PERIOD_OPTIONS: { value: SpecialPeriod; label: string }[] = [
  { value: 'unemployment', label: 'אבטלה' },
  { value: 'unpaidLeave', label: 'חל"ת' },
  { value: 'reserveDuty', label: 'מילואים' },
  { value: 'maternityLeave', label: 'חופשת לידה' },
];

function QuestionBlock({ number, children }: { number: number; children: React.ReactNode }) {
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

export default function YearQuestionnaire({ year, initial, onSubmit, loading }: YearQuestionnaireProps) {
  const [multipleEmployers, setMultipleEmployers] = useState<boolean | null>(
    initial?.multipleEmployers ?? null,
  );
  const [partialYear, setPartialYear] = useState<boolean | null>(
    initial?.partialYear ?? null,
  );
  const [specialPeriods, setSpecialPeriods] = useState<SpecialPeriod[]>(
    initial?.specialPeriods ?? [],
  );
  const [noneSelected, setNoneSelected] = useState(
    initial ? initial.specialPeriods.length === 0 && initial.multipleEmployers !== null : false,
  );
  const [hasLifeInsurance, setHasLifeInsurance] = useState<boolean | null>(
    initial?.hasLifeInsurance ?? null,
  );
  const [lifeInsuranceMonthly, setLifeInsuranceMonthly] = useState(
    String(initial?.lifeInsuranceMonthlyEstimate ?? ''),
  );
  const [hasDonations, setHasDonations] = useState<boolean | null>(
    initial?.hasDonations ?? null,
  );
  const [donationsYearly, setDonationsYearly] = useState(
    String(initial?.donationsYearlyEstimate ?? ''),
  );
  const [selfEmployed, setSelfEmployed] = useState<boolean | null>(
    initial?.selfEmployedOrForeignIncome ?? null,
  );

  const toggleSpecialPeriod = (period: SpecialPeriod) => {
    setNoneSelected(false);
    setSpecialPeriods((prev) =>
      prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period],
    );
  };

  const toggleNone = () => {
    setNoneSelected(true);
    setSpecialPeriods([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      year,
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

      {/* Q1 */}
      <QuestionBlock number={1}>
        <YesNoField
          label={`האם במהלך שנת ${year} היו לכם יותר ממעסיק אחד?`}
          value={multipleEmployers}
          onChange={setMultipleEmployers}
        />
      </QuestionBlock>

      {/* Q2 */}
      <QuestionBlock number={2}>
        <YesNoField
          label={`האם במהלך שנת ${year} עבדתם רק חלק מהשנה?`}
          value={partialYear}
          onChange={setPartialYear}
        />
      </QuestionBlock>

      {/* Q3 */}
      <QuestionBlock number={3}>
        <p className="text-sm font-semibold text-slate-800 mb-3">
          האם במהלך שנת {year} היו תקופות של אחד מאלה?
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
          <button
            type="button"
            onClick={toggleNone}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
              noneSelected && specialPeriods.length === 0
                ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50',
            )}
          >
            ללא אחד מאלה
          </button>
        </div>
      </QuestionBlock>

      {/* Q4 */}
      <QuestionBlock number={4}>
        <YesNoField
          label={`האם במהלך שנת ${year} שילמתם ביטוח חיים באופן פרטי?`}
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
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}
      </QuestionBlock>

      {/* Q5 */}
      <QuestionBlock number={5}>
        <YesNoField
          label={`האם במהלך שנת ${year} תרמתם לעמותות מוכרות לצורכי מס?`}
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
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}
      </QuestionBlock>

      {/* Q6 */}
      <QuestionBlock number={6}>
        <YesNoField
          label={`האם במהלך שנת ${year} היו לכם הכנסות מעסק / כעצמאי / מחו"ל?`}
          value={selfEmployed}
          onChange={setSelfEmployed}
        />
        <p className="text-xs text-slate-400">
          אם כן, המקרה עשוי לדרוש בדיקה ידנית מורחבת.
        </p>
      </QuestionBlock>

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
            שומר...
          </>
        ) : (
          <>
            שמור וחזור לתיק
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
