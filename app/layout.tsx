import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata = {
  title: 'בדיקת זכאות להחזר מס אונליין | החזר מס לשכירים',
  description:
    'בדיקה ראשונית מהירה להחזר מס לשכירים. בודקים זכאות לפי טופס 106 ונתונים כמו תרומות, חל"ת, מילואים, אבטלה ויותר ממעסיק אחד.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen flex flex-col bg-white text-slate-800 antialiased font-[family-name:var(--font-heebo)]">
        {children}
      </body>
    </html>
  );
}
