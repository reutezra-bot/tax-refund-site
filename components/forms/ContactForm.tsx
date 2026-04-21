'use client';

import { useState } from 'react';
import { useCheckSession } from '@/lib/check-session';
import { submitLead } from '@/lib/actions';
import { validateContactForm } from '@/lib/validators';
import Input, { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ContactForm() {
  const { caseData } = useCheckSession();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processingAccepted, setProcessingAccepted] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateContactForm({
      fullName,
      phone,
      email,
      termsAccepted,
      processingAccepted,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    if (!caseData.result) {
      setServerError('לא נמצאה תוצאת בדיקה. אנא חזרו לתחילת הבדיקה.');
      return;
    }

    const allDocs = caseData.years.flatMap((u) => u.documents);

    setLoading(true);
    const response = await submitLead({
      fullName,
      phone,
      email,
      notes,
      initialResult: caseData.result.type,
      refundRange: caseData.result.refundRange,
      uploadedDocuments: allDocs,
      years: caseData.years,
    });
    setLoading(false);

    if (!response.success) {
      setServerError(response.error ?? 'שגיאה לא צפויה. נסו שוב.');
      return;
    }

    // Show success inline — do NOT reset or navigate, as that would trigger
    // the contact page's useEffect to redirect back mid-flow.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-5">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">הפרטים נשלחו בהצלחה</h2>
          <p className="text-slate-600 text-base">נחזור אליך בהקדם.</p>
        </div>
        <Link
          href="/"
          className="inline-block mt-4 text-sm text-blue-700 underline underline-offset-2 hover:text-blue-900"
        >
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input
        label="שם מלא"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        placeholder="ישראל ישראלי"
        autoComplete="name"
      />

      <Input
        label="טלפון"
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        placeholder="050-0000000"
        autoComplete="tel"
        dir="ltr"
      />

      <Input
        label="אימייל"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="email@example.com"
        autoComplete="email"
        dir="ltr"
      />

      <Textarea
        label="הערות (אופציונלי)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="פרטים נוספים שתרצו לציין..."
      />

      {/* Checkboxes */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 shrink-0"
          />
          <span className="text-sm text-slate-700">
            אני מאשר/ת את{' '}
            <Link href="/terms" target="_blank" className="text-blue-700 underline underline-offset-2">
              תנאי השימוש
            </Link>{' '}
            ו
            <Link href="/privacy" target="_blank" className="text-blue-700 underline underline-offset-2">
              מדיניות הפרטיות
            </Link>
            <span className="text-red-500 mr-0.5">*</span>
          </span>
        </label>
        {errors.termsAccepted && (
          <p className="text-xs text-red-600 mr-7">{errors.termsAccepted}</p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={processingAccepted}
            onChange={(e) => setProcessingAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 shrink-0"
          />
          <span className="text-sm text-slate-700">
            אני מאשר/ת עיבוד מידע ומסמכים לצורך בדיקת הזכאות
            <span className="text-red-500 mr-0.5">*</span>
          </span>
        </label>
        {errors.processingAccepted && (
          <p className="text-xs text-red-600 mr-7">{errors.processingAccepted}</p>
        )}
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {serverError}
        </div>
      )}

      <Button type="submit" loading={loading} fullWidth size="lg">
        שליחת הפרטים
      </Button>
    </form>
  );
}
