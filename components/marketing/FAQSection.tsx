'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'מה זה טופס 106?',
    answer:
      'טופס 106 הוא אישור שנתי שמעסיקכם מחויב למסור לכם בתום כל שנת מס. הוא מסכם את ההכנסות, הניכויים, והמס שנוכה מהשכר. הטופס זמין לרוב בפורטל השכר של מעסיקכם או על גבי תלוש השכר האחרון.',
  },
  {
    question: 'מי זכאי להחזר מס?',
    answer:
      'שכירים שעבדו אצל יותר ממעסיק אחד, עבדו רק חלק מהשנה, היו בתקופות מיוחדות כמו אבטלה, חל"ת, מילואים, חופשת לידה, שילמו ביטוח חיים פרטי, או תרמו לעמותות מוכרות — עשויים להיות זכאים להחזר מס.',
  },
  {
    question: 'על אילו שנים אפשר לתבוע החזר?',
    answer:
      'ניתן לתבוע החזר מס על השנים האחרונות (עד 6 שנים אחורה). המערכת שלנו תציג אוטומטית את השנים הרלוונטיות עבורכם.',
  },
  {
    question: 'האם הבדיקה הראשונית עולה כסף?',
    answer:
      'לא. הבדיקה הראשונית חינם לחלוטין. לא נבקש פרטי תשלום בשום שלב. רק אם נמצאת זכאות ובחרתם להמשיך לתהליך המלא — ייתכן שיהיה עמלה בגין הגשת הדוח בפועל.',
  },
  {
    question: 'מה קורה אחרי שמשאירים פרטים?',
    answer:
      'נבצע בדיקה מעמיקה יותר ונחזור אליכם. ייתכן שנבקש מסמכים נוספים כדי לאמת את הזכאות ולהכין את הדוח להגשה לרשות המסים.',
  },
  {
    question: 'כמה זמן לוקח לקבל את ההחזר?',
    answer:
      'לאחר הגשת דוח מס לרשות המסים, ההחזר מתקבל בדרך כלל תוך כמה שבועות עד מספר חודשים, תלוי בעומס ברשות המסים.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-right gap-4 hover:text-blue-900 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900 text-base leading-snug">{question}</span>
        <svg
          className={cn('w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 text-slate-600 leading-relaxed text-sm">{answer}</div>
      )}
    </div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="bg-slate-50 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            שאלות נפוצות
          </h2>
          <p className="text-slate-600 text-lg">
            תשובות לשאלות הכי נפוצות שאנחנו מקבלים
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6">
          {faqs.map((faq, i) => (
            <FAQItem key={i} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
