'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import UploadDropzone from '@/components/check/UploadDropzone';
import UploadedFilesList from '@/components/check/UploadedFilesList';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useCheckSession } from '@/lib/check-session';
import type { UploadedDocument } from '@/types/documents';
import { useState } from 'react';

interface Props {
  params: Promise<{ year: string }>;
}

export default function YearUploadPage({ params }: Props) {
  const { year: yearParam } = use(params);
  const year = parseInt(yearParam, 10);
  const router = useRouter();
  const { caseData, setYearDocs } = useCheckSession();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const unit = caseData.years.find((u) => u.year === year);

  // Guard: if the year isn't in the case yet, redirect
  if (!unit && caseData.caseId !== '') {
    router.replace('/check/case');
    return null;
  }

  const documents = unit?.documents ?? [];
  const isExtracting = documents.some((d) => d.extracting);

  const handleChange = (docs: UploadedDocument[]) => {
    setYearDocs(year, docs);
  };

  const handleContinue = () => {
    const uploaded = documents.filter((d) => !d.extracting);
    if (uploaded.length === 0) {
      setSubmitError('יש להעלות לפחות טופס 106 אחד לשנה זו לפני המשך');
      return;
    }
    if (isExtracting) {
      setSubmitError('אנא המתינו לסיום ניתוח הטפסים');
      return;
    }
    setSubmitError(null);
    router.push(`/check/case/${year}/questions`);
  };

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Year header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/check/case"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            חזרה לתיק
          </Link>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            שנת מס {year} — שלב 1/2
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            העלאת טופס 106 לשנת {year}
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            אם עבדתם אצל יותר ממעסיק אחד בשנת {year}, העלו טופס 106 מכל מעסיק.
            המערכת תנתח כל טופס בנפרד.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <UploadDropzone
            documents={documents}
            sessionId={caseData.caseId}
            onChange={handleChange}
          />

          <UploadedFilesList
            documents={documents}
            onRemove={(id) => setYearDocs(year, documents.filter((d) => d.id !== id))}
            onUpdateYear={(id, detectedYear) =>
              setYearDocs(
                year,
                documents.map((d) => d.id === id ? { ...d, detectedYear } : d),
              )
            }
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3 mb-6">
          <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800 leading-relaxed">
            טופס 106 לשנת {year} ניתן למצוא בפורטל השכר של מעסיקכם, או בתלוש השכר האחרון של שנת {year}.
          </p>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {submitError}
          </div>
        )}

        <Button onClick={handleContinue} size="lg" fullWidth disabled={isExtracting}>
          {isExtracting ? 'מנתח טפסים...' : `המשך לשאלות לשנת ${year}`}
          {!isExtracting && (
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </Button>
      </div>
    </PageShell>
  );
}
