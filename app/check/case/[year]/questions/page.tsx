'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import YearQuestionnaire from '@/components/check/YearQuestionnaire';
import Link from 'next/link';
import { useCheckSession } from '@/lib/check-session';
import type { YearAnswers } from '@/types/case';

interface Props {
  params: Promise<{ year: string }>;
}

export default function YearQuestionsPage({ params }: Props) {
  const { year: yearParam } = use(params);
  const year = parseInt(yearParam, 10);
  const router = useRouter();
  const { caseData, setYearAnswers } = useCheckSession();
  const [loading, setLoading] = useState(false);

  const unit = caseData.years.find((u) => u.year === year);

  if (!unit && caseData.caseId !== '') {
    router.replace('/check/case');
    return null;
  }

  const handleSubmit = (answers: YearAnswers) => {
    setLoading(true);
    setYearAnswers(year, answers);
    setTimeout(() => router.push('/check/case'), 400);
  };

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Year header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/check/case/${year}/upload`}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            חזרה להעלאת מסמכים
          </Link>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            שנת מס {year} — שלב 2/2
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            שאלות לשנת {year}
          </h1>
          <p className="text-slate-600 text-base">
            כל השאלות מתייחסות לשנת {year} בלבד. לא חייבים לדעת הכל בדיוק.
          </p>
        </div>

        <YearQuestionnaire
          year={year}
          initial={unit?.answers ?? undefined}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </PageShell>
  );
}
