import PageShell from '@/components/layout/PageShell';

export const metadata = {
  title: 'מדיניות פרטיות | בדיקת החזר מס',
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">מדיניות פרטיות</h1>
        <p className="text-slate-500 text-sm mb-10">עדכון אחרון: ינואר 2025</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. כללי</h2>
            <p className="text-slate-600 leading-relaxed">
              מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך כאשר
              אתה משתמש בשירות בדיקת הזכאות להחזר מס. השימוש בשירות מהווה הסכמה לתנאי מדיניות זו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. המידע שאנו אוספים</h2>
            <p className="text-slate-600 leading-relaxed mb-3">אנו אוספים את סוגי המידע הבאים:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>פרטים אישיים: שם מלא, מספר טלפון, כתובת אימייל</li>
              <li>מסמכים פיננסיים: טופס 106 ומסמכים קשורים שתבחרו להעלות</li>
              <li>מידע על פעילות תעסוקתית: שנות עבודה, מעסיקים, תקופות מיוחדות</li>
              <li>נתוני שימוש: מידע טכני על האופן בו אתה משתמש באתר</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. כיצד אנו משתמשים במידע</h2>
            <p className="text-slate-600 leading-relaxed mb-3">המידע שלך משמש אך ורק לצרכים הבאים:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>ביצוע בדיקת זכאות ראשונית להחזר מס</li>
              <li>יצירת קשר עמך בנוגע לתוצאות הבדיקה</li>
              <li>השלמת תהליך הגשת דוח המס (בהסכמתך)</li>
              <li>שיפור השירות שלנו</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. אבטחת המידע</h2>
            <p className="text-slate-600 leading-relaxed">
              אנו מיישמים אמצעי אבטחה מתאימים להגנה על המידע האישי שלך מפני גישה לא מורשית,
              שינוי, חשיפה או מחיקה. המסמכים שלך מוצפנים ומאובטחים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. שיתוף מידע עם צדדים שלישיים</h2>
            <p className="text-slate-600 leading-relaxed">
              אנו לא מוכרים, משכירים או מעבירים את המידע האישי שלך לצדדים שלישיים ללא הסכמתך
              המפורשת, למעט כנדרש על פי דין.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. זכויותיך</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              בהתאם לחוק הגנת הפרטיות, יש לך זכות:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>לעיין במידע האישי שלך המוחזק אצלנו</li>
              <li>לבקש תיקון של מידע שגוי</li>
              <li>לבקש מחיקת המידע שלך</li>
              <li>לבקש הגבלת עיבוד המידע שלך</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">7. יצירת קשר</h2>
            <p className="text-slate-600 leading-relaxed">
              לכל שאלה בנוגע למדיניות הפרטיות שלנו, ניתן לפנות אלינו דרך טופס יצירת הקשר באתר.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
