'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import ProgressBar from '@/components/ui/ProgressBar';
import CaseResultCard from '@/components/check/CaseResultCard';
import ResultSourceDebug from '@/components/check/ResultSourceDebug';
import Link from 'next/link';
import { useCheckSession } from '@/lib/check-session';

const STEP_LABELS = ['מבוא', 'תיק מס', 'תוצאה', 'פרטי קשר'];

export default function ResultPage() {
  const router = useRouter();
  const { caseData } = useCheckSession();

  useEffect(() => {
    // caseId === '' means not yet hydrated — wait
    if (caseData.caseId === '') return;
    if (!caseData.result) {
      router.replace('/check/case');
    }
  }, [caseData.caseId, caseData.result, router]);

  // Not yet hydrated or no result
  if (caseData.caseId === '' || !caseData.result) return null;

  const totalDocs = caseData.years.reduce((sum, u) => sum + u.documents.length, 0);
  const yearCount = caseData.years.length;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <ProgressBar currentStep={3} totalSteps={4} labels={STEP_LABELS} className="mb-10" />

        <Link
          href="/check/case"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-900 mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          חזרה לתיק
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            תוצאת הבדיקה הראשונית
          </h1>
          <p className="text-slate-500 text-sm">
            מבוסס על {yearCount} {yearCount === 1 ? 'שנת מס' : 'שנות מס'} ו-{totalDocs}{' '}
            {totalDocs === 1 ? 'מסמך' : 'מסמכים'} שהועלו
          </p>
        </div>

        <CaseResultCard result={caseData.result} />

        <ResultSourceDebug result={caseData.result} years={caseData.years} />

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            לא מעוניינים להשאיר פרטים כרגע?{' '}
            <Link href="/" className="text-blue-700 underline underline-offset-2">
              חזרו לדף הבית
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
