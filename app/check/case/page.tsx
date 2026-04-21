'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import ProgressBar from '@/components/ui/ProgressBar';
import YearUnitCard from '@/components/check/YearUnitCard';
import { useCheckSession } from '@/lib/check-session';
import { calculateCaseResult } from '@/lib/analysis/case-analysis';
import { SUPPORTED_YEARS } from '@/lib/tax-config/index';
import Link from 'next/link';

const STEP_LABELS = ['מבוא', 'תיק מס', 'תוצאה', 'פרטי קשר'];

export default function CasePage() {
  const router = useRouter();
  const { caseData, addYear, removeYear, setCaseResult, reset } = useCheckSession();
  const [selectedNewYear, setSelectedNewYear] = useState<number | ''>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const existingYears = new Set(caseData.years.map((u) => u.year));
  const availableYears = SUPPORTED_YEARS.filter((y) => !existingYears.has(y));

  const handleAddYear = () => {
    if (!selectedNewYear) {
      setAddError('יש לבחור שנת מס');
      return;
    }
    setAddError(null);
    addYear(Number(selectedNewYear));
    setSelectedNewYear('');
    router.push(`/check/case/${selectedNewYear}/upload`);
  };

  // A year is "ready" when it has answers. A document is optional — the analysis
  // engine handles questionnaire-only input and returns needs_review if signals exist.
  const isYearReady = (year: number) => {
    const unit = caseData.years.find((u) => u.year === year);
    if (!unit) return false;
    return unit.answers !== null;
  };

  const readyYears = caseData.years.filter((u) => isYearReady(u.year));
  const anyYearExtracting = caseData.years.some((u) =>
    u.documents.some((d) => d.extracting),
  );
  const canAnalyze = readyYears.length > 0 && !anyYearExtracting;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setTimeout(() => {
      const result = calculateCaseResult(caseData.years);
      setCaseResult(result);
      router.push('/check/result');
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('להתחיל מחדש? כל הנתונים יימחקו.')) {
      reset();
      router.push('/');
    }
  };

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <ProgressBar currentStep={2} totalSteps={4} labels={STEP_LABELS} className="mb-10" />

        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">תיק הבדיקה שלכם</h1>
            <p className="text-slate-500 text-sm">
              הוסיפו שנות מס לתיק, העלו טפסים וענו על שאלות לכל שנה בנפרד.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="shrink-0 text-xs text-slate-400 hover:text-red-500 underline underline-offset-2 transition-colors mt-1"
          >
            התחל מחדש
          </button>
        </div>

        {/* Year cards */}
        {caseData.years.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium mb-1">עוד לא נוספו שנות מס</p>
            <p className="text-slate-400 text-sm">בחרו שנה בטופס למטה כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {caseData.years.map((unit) => (
              <YearUnitCard
                key={unit.year}
                unit={unit}
                isReady={isYearReady(unit.year)}
                onRemove={() => removeYear(unit.year)}
              />
            ))}
          </div>
        )}

        {/* Add year form */}
        {availableYears.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">הוספת שנת מס לתיק</p>
            <div className="flex gap-3">
              <select
                value={selectedNewYear}
                onChange={(e) => {
                  setAddError(null);
                  setSelectedNewYear(e.target.value ? Number(e.target.value) : '');
                }}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">— בחרו שנה —</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={handleAddYear}
                className="shrink-0 inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                הוסף
              </button>
            </div>
            {addError && (
              <p className="text-xs text-red-500 mt-2">{addError}</p>
            )}
          </div>
        )}

        {availableYears.length === 0 && caseData.years.length > 0 && (
          <p className="text-xs text-slate-400 text-center mb-6">
            כל שנות המס הנתמכות כבר נוספו לתיק.
          </p>
        )}

        {/* Analyze CTA */}
        {caseData.years.length > 0 && (
          <div className="space-y-3">
            {anyYearExtracting && (
              <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
                ממתין לסיום ניתוח המסמכים...
              </p>
            )}
            {!canAnalyze && !anyYearExtracting && readyYears.length === 0 && (
              <p className="text-xs text-slate-400 text-center">
                כדי לקבל תוצאה, יש להשלים לפחות שנה אחת: העלאת טופס + מענה על שאלות.
              </p>
            )}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || analyzing}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  מנתח...
                </>
              ) : (
                <>
                  בדקו את התוצאה
                  <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center">
              <Link href="/check" className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
                חזרה למסך הפתיחה
              </Link>
            </p>
          </div>
        )}

        {caseData.years.length === 0 && (
          <p className="text-center mt-4">
            <Link href="/check" className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
              חזרה למסך הפתיחה
            </Link>
          </p>
        )}
      </div>
    </PageShell>
  );
}
