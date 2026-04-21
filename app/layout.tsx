import type { Metadata } from 'next';
import Script from 'next/script';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'בדיקת זכאות להחזר מס אונליין | החזר מס לשכירים',
  description:
    'בדיקה ראשונית מהירה להחזר מס לשכירים. בודקים זכאות לפי טופס 106 ונתונים כמו תרומות, חל"ת, מילואים, אבטלה ויותר ממעסיק אחד.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18109792367"
        strategy="afterInteractive"
      />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18109792367');
        `}
      </Script>
      <body className="min-h-screen flex flex-col bg-white text-slate-800 antialiased font-[family-name:var(--font-heebo)]">
        {children}
      </body>
    </html>
  );
}