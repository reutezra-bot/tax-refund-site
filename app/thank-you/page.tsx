import Link from 'next/link';
import PageShell from '@/components/layout/PageShell';

export default function ThankYouPage() {
  return (
    <PageShell>
      <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Success icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            הפרטים שלך התקבלו בהצלחה
          </h1>

          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            נבצע בדיקה מעמיקה יותר ונחזור אליך במידת הצורך.
          </p>

          <div className="bg-slate-50 rounded-2xl p-5 text-right mb-8 space-y-2">
            <p className="text-sm font-semibold text-slate-700 mb-3">מה קורה עכשיו?</p>
            {[
              'הפרטים שלך נשמרו במערכת שלנו',
              'נבצע בדיקה ידנית מעמיקה',
              'אם יידרשו מסמכים נוספים, ניצור איתך קשר',
              'בדרך כלל חוזרים תוך 1-3 ימי עסקים',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-900 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-800 shadow-sm"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
