'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import ProgressBar from '@/components/ui/ProgressBar';
import ContactForm from '@/components/forms/ContactForm';
import Link from 'next/link';
import { useCheckSession } from '@/lib/check-session';
import { cn } from '@/lib/utils';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

const STEP_LABELS = ['מבוא', 'תיק מס', 'תוצאה', 'פרטי קשר'];

const resultSummary = {
  positive: {
    label: 'נמצאה אינדיקציה חיובית',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  review: {
    label: 'נדרשת בדיקה נוספת',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  insufficient: {
    label: 'לא זוהתה אינדיקציה מספקת',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  },
} as const;

export default function ContactPage() {
  const router = useRouter();
  const { caseData } = useCheckSession();

  useEffect(() => {
    if (caseData.caseId === '') return;
    if (!caseData.result) {
      router.replace('/check/result');
    }
  }, [caseData.caseId, caseData.result, router]);

  if (caseData.caseId === '' || !caseData.result) return null;

  const summary = resultSummary[caseData.result.type];

  return (
    <PageShell>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <ProgressBar currentStep={4} totalSteps={4} labels={STEP_LABELS} className="mb-10" />

        <Link
          href="/check/result"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-900 mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          חזרה לתוצאה
        </Link>

        {/* Result recap */}
        <div className={cn('border rounded-xl px-4 py-2.5 text-sm font-medium mb-6 inline-flex items-center gap-2', summary.color)}>
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {summary.label}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          השאירו פרטים ונחזור אליכם
        </h1>
        <p className="text-slate-600 text-base leading-relaxed mb-8">
          לאחר קבלת הפרטים, נבצע בדיקה מעמיקה יותר ונחזור אליכם במידת הצורך להשלמת מסמכים.
        </p>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <ContactForm />
        </div>

        {/* Alternative contact via WhatsApp */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 mb-2">מעדיפים לדבר ישירות?</p>
          <WhatsAppButton
            variant="inline"
            label="פנו אלינו בוואטסאפ"
            message="שלום, עברתי בדיקת החזר מס ואשמח לברר פרטים נוספים"
          />
        </div>
      </div>
    </PageShell>
  );
}
