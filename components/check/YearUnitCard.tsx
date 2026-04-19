'use client';

import Link from 'next/link';
import type { TaxYearUnit } from '@/types/case';

interface Props {
  unit: TaxYearUnit;
  isReady: boolean;
  onRemove: () => void;
}

function StatusBadge({ isReady, hasDoc, hasAnswers, isExtracting }: {
  isReady: boolean;
  hasDoc: boolean;
  hasAnswers: boolean;
  isExtracting: boolean;
}) {
  if (isExtracting) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
        <span className="w-2.5 h-2.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        מנתח...
      </span>
    );
  }
  if (isReady) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        מוכן לבדיקה
      </span>
    );
  }
  if (!hasDoc) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
        חסר טופס 106
      </span>
    );
  }
  if (!hasAnswers) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
        חסרות תשובות
      </span>
    );
  }
  return null;
}

export default function YearUnitCard({ unit, isReady, onRemove }: Props) {
  const { year, documents, answers } = unit;
  const completedDocs = documents.filter((d) => !d.extracting);
  const extractingDocs = documents.filter((d) => d.extracting);
  const hasDoc = completedDocs.length > 0;
  const hasAnswers = answers !== null;
  const isExtracting = extractingDocs.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-base">שנת מס {year}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {documents.length === 0
                ? 'אין מסמכים'
                : `${completedDocs.length} ${completedDocs.length === 1 ? 'מסמך' : 'מסמכים'}${extractingDocs.length > 0 ? ` (${extractingDocs.length} בניתוח)` : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge isReady={isReady} hasDoc={hasDoc} hasAnswers={hasAnswers} isExtracting={isExtracting} />
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label={`הסר שנת ${year}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
        <Link
          href={`/check/case/${year}/upload`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {hasDoc ? 'ערוך מסמכים' : 'העלאת טופס 106'}
        </Link>

        <Link
          href={`/check/case/${year}/questions`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-900 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {hasAnswers ? 'ערוך תשובות' : 'מענה על שאלות'}
        </Link>
      </div>

      {/* Per-doc extraction errors */}
      {completedDocs.some((d) => d.extractionError) && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          לא הצלחנו לנתח את טופס 106 שצירפת ברמת ודאות מספקת. אפשר להשאיר פרטים ונחזור אליך לבדיקה מעמיקה.
        </div>
      )}
    </div>
  );
}
