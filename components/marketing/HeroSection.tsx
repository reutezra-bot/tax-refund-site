import Link from 'next/link';
import Image from 'next/image';
import { SITE_IMAGES, whatsappHref } from '@/lib/constants';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_#60a5fa_0%,_transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-center">

          {/* ── Text column (right in RTL) ─────────────────────────── */}
          <div className="lg:col-span-3">
            {/* Pill label */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-blue-100 text-xs font-medium px-3 py-1.5 rounded-full mb-5 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              בדיקה ראשונית חינם · ללא התחייבות
            </div>

            {/* Headline — refined hierarchy */}
            <h1 className="mb-5">
  <span className="block text-blue-200 text-lg sm:text-xl font-light leading-snug mb-1">
    שכירים בישראל?
  </span>
  <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
    בדיקת זכאות ל<span className="text-sky-300">החזר מס</span>
  </span>
</h1>
      

        <p className="text-lg text-blue-100 leading-relaxed max-w-2xl">
  מעלים טופס 106, עונים על כמה שאלות קצרות, ומקבלים בדיקה ראשונית מהירה אם ייתכן שמגיע לכם החזר מס.
</p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/check"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 font-bold text-base sm:text-lg px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 active:bg-blue-100 transition-all"
              >
                התחילו בדיקה חינם
                <svg className="w-4 h-4 rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/25 text-white font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                שאלות? כתבו לנו
              </a>
            </div>

            {/* Trust micro-badges */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-200/70">
              {[
                'ללא חיוב עד לתוצאה סופית',
                'פרטיות מלאה',
                'תשובה תוך דקות',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ── Image column (left in RTL) ─────────────────────────── */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] ring-1 ring-white/10 bg-blue-950">
              <Image
                src={SITE_IMAGES.hero}
                alt="מומחית מס מחייכת — בדיקת החזר מס"
                fill
                className="object-contain object-center"
                priority
                sizes="(max-width: 1024px) 0px, 400px"
              />
              {/* Gradient overlay at bottom for readability */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-blue-950/70 to-transparent" />

              {/* Floating result preview card */}
              <div className="absolute bottom-4 inset-x-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 leading-none mb-0.5">תוצאה ראשונית</p>
                    <p className="text-sm font-bold text-emerald-700">נמצאה אינדיקציה חיובית</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
