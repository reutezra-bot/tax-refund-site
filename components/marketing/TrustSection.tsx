import Image from 'next/image';
import { SITE_IMAGES } from '@/lib/constants';

const trustItems = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    iconBg: 'bg-blue-50 text-blue-700',
    title: 'אבטחת מידע מלאה',
    description: 'המסמכים שלכם מוצפנים ומאובטחים. הפרטים לא מועברים לצד שלישי ללא הסכמתכם.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-emerald-50 text-emerald-700',
    title: 'ללא עלות ראשונית',
    description: 'הבדיקה הראשונית חינם לחלוטין. לא נבקש פרטי תשלום בשום שלב של הבדיקה.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    iconBg: 'bg-amber-50 text-amber-700',
    title: 'בדיקה אנושית',
    description: 'כל מקרה עם אינדיקציה נבדק ידנית על ידי מומחי מס לפני חזרה אליכם.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    iconBg: 'bg-sky-50 text-sky-700',
    title: 'מהיר ופשוט',
    description: 'כל התהליך לוקח כמה דקות. לא צריך לצרף עשרות מסמכים בשלב הראשוני.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    iconBg: 'bg-violet-50 text-violet-700',
    title: 'מורשה ומוסמך',
    description: 'הבדיקה מבוצעת תחת פיקוח משרד רואה חשבון מורשה. מקצועיות ואחריות בכל שלב.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    iconBg: 'bg-rose-50 text-rose-600',
    title: 'זמינות גבוהה',
    description: 'ניתן לפנות אלינו גם בוואטסאפ לשאלות ולעדכונים לאורך כל התהליך.',
  },
];

export default function TrustSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">
            למה לבחור בנו
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            שקיפות, מקצועיות, ויחס אישי
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto font-light">
            כך אנחנו עובדים — ללא הפתעות, ללא עלויות נסתרות
          </p>
        </div>

        {/* Two-column: image + trust items */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">

          {/* Image column */}
          <div className="hidden lg:block lg:col-span-2 sticky top-24">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/5]">
              <Image
                src={SITE_IMAGES.calculator}
                alt="חישוב החזר מס — מסמכים פיננסיים ומחשבון"
                fill
                className="object-cover object-top"
                sizes="400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 to-transparent" />

              {/* Stats overlay */}
              <div className="absolute bottom-4 inset-x-4 space-y-2">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.229V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.228V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ממוצע אומדן ראשוני</p>
                    <p className="text-base font-extrabold text-slate-900">2,000–6,000 ₪</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust grid */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trustItems.map((item, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-colors group"
              >
                <div className={`shrink-0 w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-900 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
