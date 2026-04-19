import Link from 'next/link';

export const metadata = {
  title: 'ניהול לידים | בדיקת החזר מס',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/leads" className="font-bold text-white hover:text-slate-200">
              🗂️ ניהול לידים
            </Link>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white"
            target="_blank"
          >
            ← האתר הציבורי
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200">
        ממשק ניהול פנימי — לא לשיתוף
      </footer>
    </div>
  );
}
