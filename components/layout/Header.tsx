import Link from 'next/link';
import Image from 'next/image';
import { LOGO_PATH } from '@/lib/constants';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src={LOGO_PATH}
              alt="אסף פרץ — משרד רואי חשבון"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/#how-it-works"
              className="text-sm text-slate-600 hover:text-blue-900 font-medium"
            >
              איך זה עובד?
            </Link>
            <Link
              href="/#faq"
              className="text-sm text-slate-600 hover:text-blue-900 font-medium"
            >
              שאלות נפוצות
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-slate-600 hover:text-blue-900 font-medium"
            >
              פרטיות
            </Link>
          </nav>

          {/* CTA */}
          <Link
            href="/check"
            className="bg-blue-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-800 shadow-sm transition-colors"
          >
            התחילו בדיקה חינם
          </Link>
        </div>
      </div>
    </header>
  );
}
