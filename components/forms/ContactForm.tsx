'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckSession } from '@/lib/check-session';
import { submitLead } from '@/lib/actions';
import { validateContactForm } from '@/lib/validators';
import Input, { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ContactForm() {
  const router = useRouter();
  const { caseData, reset } = useCheckSession();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processingAccepted, setProcessingAccepted] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
      uploadedDocuments: allDocs,
    });
    setLoading(false);

    if (!response.success) {
      setServerError(response.error ?? 'שגיאה לא צפויה. נסו שוב.');
      return;
    }

    reset();
    router.push('/thank-you');
  };

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
