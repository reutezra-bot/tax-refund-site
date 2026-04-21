import { Resend } from 'resend';
import type { Lead } from '@/types/lead';
import type { RefundRange, YearAnswers, SpecialPeriod } from '@/types/case';

interface YearAnswerEntry {
  year: number;
  answers: YearAnswers | null;
}

const INTERNAL_EMAIL = process.env.INTERNAL_EMAIL ?? 'reut.prodify@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

const RESULT_LABELS: Record<string, string> = {
  potential_refund: 'אינדיקציה חיובית להחזר מס',
  needs_review: 'נדרשת בדיקה מקצועית',
  no_clear_indication: 'לא זוהתה אינדיקציה ברורה',
};

const REFUND_RANGE_LABELS: Record<RefundRange, string> = {
  up_to_2k: 'עד 2,000 ₪',
  '2k_to_6k': '2,000–6,000 ₪',
  above_6k: 'מעל 6,000 ₪',
};

const SPECIAL_PERIOD_LABELS: Record<SpecialPeriod, string> = {
  unemployment: 'דמי אבטלה',
  unpaidLeave: 'חל"ת',
  reserveDuty: 'מילואים',
  maternityLeave: 'חופשת לידה',
};

interface EmailPayload {
  lead: Lead;
  refundRange?: RefundRange;
  years?: YearAnswerEntry[];
  overallReasons?: string[];
  missingData?: string[];
}

export async function sendLeadNotification(
  lead: Lead,
  refundRange?: RefundRange,
  years?: YearAnswerEntry[],
  overallReasons?: string[],
  missingData?: string[],
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

  const payload: EmailPayload = { lead, refundRange, years, overallReasons, missingData };

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: INTERNAL_EMAIL,
    replyTo: lead.email,
    subject: `ליד חדש — ${lead.fullName} | בדיקת החזר מס`,
    html: buildEmailHtml(payload),
    attachments,
  });

  if (error) {
    console.error('[email] Resend error:', error.name, error.message);
    return { success: false, error: error.message };
  }

  console.log('[email] Sent OK to', INTERNAL_EMAIL);
  return { success: true };
}

function yesNo(v: boolean | null | undefined): string {
  if (v === true) return 'כן';
  if (v === false) return 'לא';
  return 'לא צוין';
}

function buildQuestionnaireHtml(years: YearAnswerEntry[]): string {
  const rows = years
    .filter((u) => u.answers)
    .sort((a, b) => b.year - a.year)
    .map((u) => {
      const a = u.answers!;

      const fields: { label: string; value: string }[] = [
        { label: 'יותר ממעסיק אחד', value: yesNo(a.multipleEmployers) },
        { label: 'שנה חלקית', value: yesNo(a.partialYear) },
        {
          label: 'תקופות מיוחדות',
          value: a.specialPeriods.length > 0
            ? a.specialPeriods.map((p: SpecialPeriod) => SPECIAL_PERIOD_LABELS[p]).join(', ')
            : 'לא',
        },
        {
          label: 'ביטוח חיים',
          value: a.hasLifeInsurance === true
            ? `כן${a.lifeInsuranceMonthlyEstimate ? ` — ${a.lifeInsuranceMonthlyEstimate.toLocaleString('he-IL')} ₪/חודש` : ' (סכום לא הוזן)'}`
            : yesNo(a.hasLifeInsurance),
        },
        {
          label: 'תרומות',
          value: a.hasDonations === true
            ? `כן${a.donationsYearlyEstimate ? ` — ${a.donationsYearlyEstimate.toLocaleString('he-IL')} ₪/שנה` : ' (סכום לא הוזן)'}`
            : yesNo(a.hasDonations),
        },
        { label: 'הכנסה עצמאית / ממקור זר', value: yesNo(a.selfEmployedOrForeignIncome) },
      ];

      const fieldRows = fields
        .map(
          (f) =>
            `<tr><td style="padding:4px 8px;color:#6b7280;width:180px">${f.label}</td><td style="padding:4px 8px;color:#1f2937">${f.value}</td></tr>`,
        )
        .join('');

      return `
        <div style="margin-bottom:16px">
          <p style="font-weight:600;color:#374151;margin:0 0 6px 0">שנת מס ${u.year}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;background:#f9fafb;border-radius:8px">
            ${fieldRows}
          </table>
        </div>`;
    })
    .join('');

  return rows
    ? `<h3 style="color:#374151;margin-bottom:12px">תשובות השאלון לפי שנה</h3>${rows}`
    : '';
}

function buildEmailHtml(payload: EmailPayload): string {
  const { lead, refundRange, years, overallReasons, missingData } = payload;

  const resultStatus = lead.initialResult;
  const resultLabel = refundRange
    ? `${RESULT_LABELS[resultStatus] ?? resultStatus} — ${REFUND_RANGE_LABELS[refundRange]}`
    : RESULT_LABELS[resultStatus] ?? resultStatus;

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

  const reasonsHtml =
    overallReasons && overallReasons.length > 0
      ? `<h3 style="color:#374151;margin-bottom:8px">סיבות התוצאה</h3>
         <ul style="margin:0 0 24px 0;padding:0 16px 0 0;font-size:13px;color:#374151">
           ${overallReasons.map((r) => `<li style="margin-bottom:4px">${r}</li>`).join('')}
         </ul>`
      : '';

  const missingHtml =
    missingData && missingData.length > 0
      ? `<h3 style="color:#92400e;margin-bottom:8px">מידע חסר</h3>
         <ul style="margin:0 0 24px 0;padding:0 16px 0 0;font-size:13px;color:#92400e">
           ${missingData.map((m) => `<li style="margin-bottom:4px">${m}</li>`).join('')}
         </ul>`
      : '';

  return `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937">
  <h2 style="color:#1e3a8a;margin-bottom:4px">ליד חדש — בדיקת החזר מס</h2>
  <p style="color:#6b7280;font-size:13px;margin-top:0">${new Date(lead.createdAt).toLocaleString('he-IL')}</p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr style="background:#f9fafb">
      <td style="padding:8px;font-weight:bold;width:140px">שם</td>
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
      <td style="padding:8px;font-weight:bold">תוצאה שהוצגה</td>
      <td style="padding:8px;font-weight:600;color:#1e3a8a">${resultLabel}</td>
    </tr>
    ${lead.notes ? `
    <tr style="background:#f9fafb">
      <td style="padding:8px;font-weight:bold">הערות</td>
      <td style="padding:8px">${lead.notes}</td>
    </tr>` : ''}
  </table>

  ${years && years.length > 0 ? buildQuestionnaireHtml(years) : ''}

  ${reasonsHtml}
  ${missingHtml}

  ${docsRows ? `
  <h3 style="color:#374151;margin-bottom:8px">מסמכים שהועלו</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
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
