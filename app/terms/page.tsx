import PageShell from '@/components/layout/PageShell';

export const metadata = {
  title: 'תנאי שימוש | בדיקת החזר מס',
};

export default function TermsPage() {
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">תנאי שימוש</h1>
        <p className="text-slate-500 text-sm mb-10">עדכון אחרון: ינואר 2025</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. קבלת התנאים</h2>
            <p className="text-slate-600 leading-relaxed">
              השימוש בשירות בדיקת הזכאות להחזר מס מהווה הסכמה לתנאים אלה. אם אינך מסכים לתנאים,
              אנא הפסק את השימוש בשירות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. מהות השירות</h2>
            <p className="text-slate-600 leading-relaxed">
              שירות זה מספק <strong>אינדיקציה ראשונית בלבד</strong> לגבי זכאות להחזר מס. התוצאות
              אינן מהוות ייעוץ מס מקצועי, אינן מחייבות, ואינן ערובה להחזר בפועל. הבדיקה הסופית
              מתבצעת על ידי מומחים ותלויה במסמכים נוספים ובנסיבות אישיות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. הגבלת אחריות</h2>
            <p className="text-slate-600 leading-relaxed">
              אנו לא נישא באחריות לכל נזק ישיר, עקיף, מקרי או תוצאתי הנובע מהשימוש בשירות
              זה או מהסתמכות על תוצאותיו. המשתמש אחראי לוודא את נכונות המידע שמסר.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. דיוק המידע</h2>
            <p className="text-slate-600 leading-relaxed">
              המשתמש מתחייב למסור מידע מדויק ואמיתי. מסירת מידע שגוי או מטעה עשויה להוביל
              לתוצאות בדיקה שגויות ולפגוע בהליך קבלת ההחזר.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. עלויות</h2>
            <p className="text-slate-600 leading-relaxed">
              הבדיקה הראשונית חינמית לחלוטין. במידה ותבחרו להמשיך לתהליך הגשת דוח מס מלא,
              ייתכן שייגבה תשלום על השירות המלא. תנאי התשלום יוצגו בפני הלקוח לפני כל התחייבות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. שינוי תנאים</h2>
            <p className="text-slate-600 leading-relaxed">
              אנו שומרים לעצמנו את הזכות לשנות תנאים אלה בכל עת. שינויים מהותיים יפורסמו
              באתר. המשך השימוש בשירות לאחר פרסום שינויים מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">7. דין חל</h2>
            <p className="text-slate-600 leading-relaxed">
              תנאים אלה כפופים לדיני מדינת ישראל. כל סכסוך שיתעורר בקשר לשירות זה יידון
              בבתי המשפט המוסמכים בישראל.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
