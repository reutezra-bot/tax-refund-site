import PageShell from '@/components/layout/PageShell';
import HeroSection from '@/components/marketing/HeroSection';
import StepsSection from '@/components/marketing/StepsSection';
import TrustSection from '@/components/marketing/TrustSection';
import FAQSection from '@/components/marketing/FAQSection';
import Link from 'next/link';

export default function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <StepsSection />
      <TrustSection />
      <FAQSection />

      {/* Bottom CTA */}
      <section className="bg-blue-900 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            מוכנים לבדוק את הזכאות שלכם?
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            לוקח פחות מ-5 דקות. ללא עלות. ללא התחייבות.
          </p>
          <Link
            href="/check/case"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-50"
          >
            התחילו בדיקה חינם
            <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
