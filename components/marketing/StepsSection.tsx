import Image from 'next/image';
import { SITE_IMAGES } from '@/lib/constants';

const steps = [
  {
    number: '01',
    title: 'מעלים טופס 106',
    description: 'מעלים את טופס 106 שקיבלתם מהמעסיק. אפשר להעלות יותר מטופס אחד אם עבדתם בכמה מקומות.',
    detail: 'PDF, JPG, PNG · עד 10MB לקובץ',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    badge: 'שלב 1',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    number: '02',
    title: 'עונים על כמה שאלות',
    description: 'שאלות קצרות על מצבכם התעסוקתי בשנים הרלוונטיות.',
    detail: 'כ-2 דקות · 6 שאלות בלבד',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    badge: 'שלב 2',
    badgeColor: 'bg-sky-100 text-sky-700',
  },
  {
    number: '03',
    title: 'מקבלים תשובה ראשונית',
    description: 'מיד לאחר מסירת הפרטים מקבלים אינדיקציה ראשונית ואומדן ראשוני.',
    detail: 'מיידי · ללא המתנה',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badge: 'שלב 3',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

export default function StepsSection() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">
            התהליך
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            איך זה עובד?
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto font-light">
            תהליך מהיר ופשוט — ללא ניירת, ללא אנשים, ללא עלות
          </p>
        </div>

        {/* Two-column: steps + image */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center mb-16">

          {/* Steps list */}
          <div className="lg:col-span-3 space-y-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
              >
                {/* Icon */}
                <div className="shrink-0 w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700">
                  {step.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step.badgeColor}`}>
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-0.5">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Image */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={SITE_IMAGES.laptop}
                alt="שכיר בודק החזר מס מהמחשב"
                fill
                className="object-cover"
                sizes="400px"
              />
              <div className="absolute inset-0 bg-blue-900/20" />
              {/* Stat overlay */}
              <div className="absolute top-4 inset-x-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-0.5">ממוצע זמן בדיקה</p>
                <p className="text-2xl font-extrabold text-blue-900">3 דקות</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className="bg-blue-900 rounded-2xl px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg">מוכנים להתחיל?</p>
            <p className="text-blue-200 text-sm">בדיקה ראשונית חינם — ללא פרטי תשלום</p>
          </div>
          <a
            href="/check"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-900 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 shadow-sm transition-colors text-sm"
          >
            התחילו עכשיו
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
