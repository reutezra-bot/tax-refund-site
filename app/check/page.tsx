import Link from 'next/link';
import PageShell from '@/components/layout/PageShell';
import ProgressBar from '@/components/ui/ProgressBar';

const STEP_LABELS = ['מבוא', 'תיק מס', 'תוצאה', 'פרטי קשר'];

export default function CheckIntroPage() {
  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <ProgressBar currentStep={1} totalSteps={4} labels={STEP_LABELS} className="mb-10" />

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl text-blue-700 mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            לפני שמתחילים
          </h1>

          <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            הבדיקה מתבצעת לפי שנות מס. לכל שנה תעלו את{' '}
            <strong className="text-slate-800">טופס 106</strong> הרלוונטי ותענו על שאלות קצרות
            לאותה שנה בלבד.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 text-right mb-8 space-y-3">
            {[
              { icon: '📅', text: 'בוחרים שנת מס ומעלים טופס 106 לאותה שנה' },
              { icon: '❓', text: 'עונים על שאלות קצרות לאותה שנה' },
              { icon: '➕', text: 'אפשר להוסיף שנות מס נוספות לאותו תיק' },
              { icon: '⚡', text: 'תוצאה ראשונית לכל שנה ולתיק כולו' },
              { icon: '🔒', text: 'ללא חיוב, ללא התחייבות' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-700">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          <Link
            href="/check/case"
            className="inline-flex items-center justify-center gap-2 bg-blue-900 text-white font-bold text-lg px-10 py-4 rounded-xl hover:bg-blue-800 shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            פתחו תיק בדיקה
            <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
