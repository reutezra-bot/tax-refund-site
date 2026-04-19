import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'בדיקת זכאות להחזר מס | בדיקה ראשונית חינם',
  description:
    'בדקו תוך כמה דקות אם ייתכן שמגיע לכם החזר מס. מעלים טופס 106, עונים על כמה שאלות קצרות, ומקבלים תשובה ראשונית.',
  openGraph: {
    locale: 'he_IL',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen flex flex-col bg-white text-slate-800 antialiased font-[family-name:var(--font-heebo)]">
        {children}
      </body>
    </html>
  );
}
