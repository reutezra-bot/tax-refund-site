import { Resend } from 'resend';
import type { Lead } from '@/types/lead';
import type { RefundRange } from '@/types/case';

const INTERNAL_EMAIL = process.env.INTERNAL_EMAIL ?? 'reut.prodify@gmail.com';

// Resend requires a verified sender domain for custom from-addresses.
// Until a domain is verified, use the Resend shared sandbox sender.
// Set RESEND_FROM_EMAIL in .env.local once your domain is verified.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

const REFUND_RANGE_LABELS: Record<RefundRange, string> = {
  up_to_2k: 'עד 2,000 ₪',
  '2k_to_6k': '2,000–6,000 ₪',
  above_6k: 'מעל 6,000 ₪',
};

export async function sendLeadNotification(
  lead: Lead,
  refundRange?: RefundRange,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email not sent. Lead:', lead.id);
    return { success: false, error: 'RESEND_API_KEY not set' };
  }

  const resend = new Resend(apiKey);

  const attachments = (lead.uploadedDocuments ?? [])
    .filter((doc) => doc.fileBase64)
    .map((doc) => ({
      filename: doc.fileName,
      content: Buffer.from(doc.fileBase64!, 'base64'),
    }));

  const debugSubject = `ליד חדש — ${lead.fullName} | בדיקת החזר מס [קבצים: ${attachments.length}/${(lead.uploadedDocuments ?? []).length}]`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: INTERNAL_EMAIL,
    replyTo: lead.email,
    subject: debugSubject,
    html: buildEmailHtml(lead, refundRange),
    attachments,
  });

  if (error) {
    console.error('[email] Resend error (name=%s message=%s)', error.name, error.message, error);
    return { success: false, error: error.message };
  }

  console.log('[email] Sent OK to', INTERNAL_EMAIL);
  return { success: true };
}

function buildEmailHtml(lead: Lead, refundRange?: RefundRange): string {
  const resultLabel =
    refundRange
      ? REFUND_RANGE_LABELS[refundRange]
      : lead.initialResult === 'positive'
        ? 'אינדיקציה חיובית (ללא טווח)'
        : lead.initialResult === 'review'
          ? 'נדרשת בדיקה'
          : 'לא זוהתה אינדיקציה';

  const docsRows = (lead.uploadedDocuments ?? [])
    .map((doc) => {
      const f = doc.form106Data;
      const fields = f
        ? [
            f.taxYear != null && `שנת מס: ${f.taxYear}`,
            f.annualTaxableIncome != null && `הכנסה חייבת: ${f.annualTaxableIncome.toLocaleString('he-IL')} ₪`,
            f.actualTaxWithheld != null && `מס שנוכה: ${f.actualTaxWithheld.toLocaleString('he-IL')} ₪`,
            f.annualTaxCreditPoints != null && `נקודות זיכוי: ${f.annualTaxCreditPoints}`,
            f.workDays != null && `ימי עבודה: ${f.workDays}`,
            f.priorYearDifferencesIncluded && `הפרשים לשנים קודמות: כן`,
          ]
            .filter(Boolean)
            .join(' | ')
        : 'לא חולץ';

      return `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:6px 8px;font-weight:500">${doc.fileName}</td>
          <td style="padding:6px 8px;color:#374151">${fields}</td>
          <td style="padding:6px 8px;color:#6b7280;font-size:11px">${doc.detectedYear ?? '—'}</td>
        </tr>`;
    })
    .join('');

  return `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937">
  <h2 style="color:#1e3a8a;margin-bottom:4px">ליד חדש — בדיקת החזר מס</h2>
  <p style="color:#6b7280;font-size:13px;margin-top:0">${new Date(lead.createdAt).toLocaleString('he-IL')}</p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr style="background:#f9fafb">
      <td style="padding:8px;font-weight:bold;width:120px">שם</td>
      <td style="padding:8px">${lead.fullName}</td>
    </tr>
    <tr>
      <td style="padding:8px;font-weight:bold">טלפון</td>
      <td style="padding:8px"><a href="tel:${lead.phone}">${lead.phone}</a></td>
    </tr>
    <tr style="background:#f9fafb">
      <td style="padding:8px;font-weight:bold">אימייל</td>
      <td style="padding:8px"><a href="mailto:${lead.email}">${lead.email}</a></td>
    </tr>
    <tr>
      <td style="padding:8px;font-weight:bold">תוצאה ראשונית</td>
      <td style="padding:8px;font-weight:600;color:#1e3a8a">${resultLabel}</td>
    </tr>
    ${lead.notes ? `
    <tr style="background:#f9fafb">
      <td style="padding:8px;font-weight:bold">הערות</td>
      <td style="padding:8px">${lead.notes}</td>
    </tr>` : ''}
  </table>

  ${docsRows ? `
  <h3 style="color:#374151;margin-bottom:8px">מסמכים שהועלו</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="padding:6px 8px;text-align:right;font-weight:600">קובץ</th>
        <th style="padding:6px 8px;text-align:right;font-weight:600">נתונים שחולצו</th>
        <th style="padding:6px 8px;text-align:right;font-weight:600">שנה</th>
      </tr>
    </thead>
    <tbody>${docsRows}</tbody>
  </table>` : '<p style="color:#6b7280">לא הועלו מסמכים.</p>'}

  <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
  <p style="color:#9ca3af;font-size:11px">נשלח ממערכת בדיקת זכאות להחזר מס</p>
</div>`;
}

export { buildEmailHtml };
