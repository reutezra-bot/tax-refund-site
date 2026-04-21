import { Resend } from 'resend';
import type { Lead } from '@/types/lead';
import type {
  CaseResult,
  AnnualResult,
  AnnualResultType,
  CaseResultType,
  ConfidenceLevel,
  RefundRange,
  SpecialPeriod,
} from '@/types/case';
import type { YearAnswerEntry } from '@/lib/actions';

const INTERNAL_EMAIL = process.env.INTERNAL_EMAIL ?? 'reut.prodify@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

// ── Label maps ────────────────────────────────────────────────────────────────

const RESULT_TYPE_LABELS: Record<CaseResultType, string> = {
  potential_refund: 'אינדיקציה חיובית להחזר מס',
  needs_review: 'נדרשת בדיקה מקצועית',
  no_clear_indication: 'לא זוהתה אינדיקציה ברורה',
};

const ANNUAL_RESULT_TYPE_LABELS: Record<AnnualResultType, string> = {
  potential_refund: 'אינדיקציה חיובית',
  needs_review: 'נדרשת בדיקה',
  no_clear_indication: 'ללא אינדיקציה',
  insufficient_data: 'נתונים לא מספיקים',
};

const REFUND_RANGE_LABELS: Record<RefundRange, string> = {
  up_to_2k: 'עד 2,000 ₪',
  '2k_to_6k': '2,000–6,000 ₪',
  above_6k: 'מעל 6,000 ₪',
};

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

const SPECIAL_PERIOD_LABELS: Record<SpecialPeriod, string> = {
  unemployment: 'דמי אבטלה',
  unpaidLeave: 'חל"ת',
  reserveDuty: 'מילואים',
  maternityLeave: 'חופשת לידה',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function yesNo(v: boolean | null | undefined): string {
  if (v === true) return 'כן';
  if (v === false) return 'לא';
  return 'לא צוין';
}

function row(label: string, value: string, shaded = false): string {
  const bg = shaded ? 'background:#f9fafb;' : '';
  return `<tr style="${bg}">
    <td style="padding:7px 10px;font-weight:600;width:170px;color:#374151">${label}</td>
    <td style="padding:7px 10px;color:#1f2937">${value}</td>
  </tr>`;
}

function section(title: string, content: string, color = '#1e3a8a'): string {
  return `
  <h3 style="color:${color};font-size:14px;margin:24px 0 8px 0;padding-bottom:4px;border-bottom:2px solid #e5e7eb">${title}</h3>
  ${content}`;
}

function bulletList(items: string[], color = '#374151'): string {
  if (items.length === 0) return '';
  return `<ul style="margin:0 0 0 0;padding:0 18px 0 0;font-size:13px;color:${color}">
    ${items.map((i) => `<li style="margin-bottom:4px">${i}</li>`).join('')}
  </ul>`;
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildContactSection(lead: Lead): string {
  const rows = [
    row('שם', lead.fullName, true),
    row('טלפון', `<a href="tel:${lead.phone}" style="color:#1e3a8a">${lead.phone}</a>`),
    row('אימייל', `<a href="mailto:${lead.email}" style="color:#1e3a8a">${lead.email}</a>`, true),
    lead.notes ? row('הערות', lead.notes) : '',
  ].join('');
  return section('פרטי יצירת קשר',
    `<table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table>`);
}

function buildResultSection(result: CaseResult): string {
  const typeLabel = RESULT_TYPE_LABELS[result.type];
  const typeColor = result.type === 'potential_refund'
    ? '#065f46' : result.type === 'needs_review' ? '#92400e' : '#6b7280';

  const rows = [
    row('תוצאה', `<strong style="color:${typeColor}">${typeLabel}</strong>`, true),
    row('רמת ביטחון', CONFIDENCE_LABELS[result.confidenceLevel]),
    result.refundRange ? row('טווח החזר משוער', REFUND_RANGE_LABELS[result.refundRange], true) : '',
    result.estimatedRefundAmountILS
      ? row('אומדן ILS', `<strong style="color:#065f46">כ-${result.estimatedRefundAmountILS.toLocaleString('he-IL')} ₪</strong>`)
      : '',
    result.manualReviewRecommended ? row('בדיקה ידנית', 'מומלצת', true) : '',
  ].join('');

  return section('תוצאה סופית',
    `<table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table>`);
}

function buildReasonsSection(result: CaseResult): string {
  const overall = result.overallReasons.length > 0
    ? `<p style="font-size:12px;color:#6b7280;margin:0 0 4px 0">סיבות כלליות:</p>${bulletList(result.overallReasons)}`
    : '';

  const crossWarnings = result.crossYearWarnings.length > 0
    ? `<p style="font-size:12px;color:#6b7280;margin:12px 0 4px 0">אזהרות בין-שנתיות:</p>${bulletList(result.crossYearWarnings, '#b45309')}`
    : '';

  const content = overall + crossWarnings;
  return content ? section('סיבות התוצאה', content) : '';
}

function buildMissingSection(result: CaseResult): string {
  if (result.missingData.length === 0) return '';
  return section('מידע חסר', bulletList(result.missingData, '#92400e'), '#92400e');
}

function buildQuestionnaireSection(
  yearAnswers: YearAnswerEntry[],
  yearlySummaries: AnnualResult[],
): string {
  const sorted = [...yearAnswers]
    .filter((u) => u.answers !== null)
    .sort((a, b) => b.year - a.year);

  if (sorted.length === 0) return '';

  const yearBlocks = sorted.map((u) => {
    const a = u.answers!;
    const annualResult = yearlySummaries.find((r) => r.year === u.year);

    // Special periods with follow-up detail
    const periodsLabel = a.specialPeriods.length > 0
      ? a.specialPeriods.map((p: SpecialPeriod) => {
          let label = SPECIAL_PERIOD_LABELS[p];
          if (p === 'unpaidLeave' && a.unpaidLeaveMonths) label += ` (${a.unpaidLeaveMonths} חודשים)`;
          if (p === 'reserveDuty' && a.reserveDutyDays) label += ` (${a.reserveDutyDays} ימים)`;
          if (p === 'maternityLeave' && a.maternityLeaveMonths) label += ` (${a.maternityLeaveMonths} חודשים)`;
          return label;
        }).join(', ')
      : 'לא';

    const lifeInsuranceVal = a.hasLifeInsurance === true
      ? `כן${a.lifeInsuranceMonthlyEstimate ? ` — ${a.lifeInsuranceMonthlyEstimate.toLocaleString('he-IL')} ₪/חודש` : ' (סכום לא הוזן)'}`
      : yesNo(a.hasLifeInsurance);

    const donationsVal = a.hasDonations === true
      ? `כן${a.donationsYearlyEstimate ? ` — ${a.donationsYearlyEstimate.toLocaleString('he-IL')} ₪/שנה` : ' (סכום לא הוזן)'}`
      : yesNo(a.hasDonations);

    // All questionnaire fields
    const qRows = [
      row('יותר ממעסיק אחד', yesNo(a.multipleEmployers), true),
      row('שנה חלקית', yesNo(a.partialYear)),
      row('תקופות מיוחדות', periodsLabel, true),
      row('ביטוח חיים פרטי', lifeInsuranceVal),
      row('תרומות לעמותות', donationsVal, true),
      row('הכנסה עצמאית/ממקור זר', yesNo(a.selfEmployedOrForeignIncome)),
    ].join('');

    // Per-year analysis result
    let annualResultBlock = '';
    if (annualResult) {
      const annualTypeLabel = ANNUAL_RESULT_TYPE_LABELS[annualResult.type];
      const annualColor = annualResult.type === 'potential_refund'
        ? '#065f46' : annualResult.type === 'needs_review' ? '#92400e' : '#6b7280';

      const annualRows = [
        row('תוצאה שנתית', `<strong style="color:${annualColor}">${annualTypeLabel}</strong>`, true),
        annualResult.refundRange
          ? row('טווח שנתי', REFUND_RANGE_LABELS[annualResult.refundRange])
          : '',
      ].join('');

      const annualReasonsList = annualResult.reasons.length > 0
        ? `<p style="font-size:11px;color:#6b7280;margin:8px 0 3px 0">סיבות:</p>${bulletList(annualResult.reasons, '#374151')}`
        : '';

      const annualMissingList = annualResult.missingData.length > 0
        ? `<p style="font-size:11px;color:#92400e;margin:8px 0 3px 0">חסר:</p>${bulletList(annualResult.missingData, '#92400e')}`
        : '';

      annualResultBlock = `
        <div style="margin-top:10px;padding:8px 10px;background:#f0f9ff;border-radius:6px;font-size:12px">
          <table style="width:100%;border-collapse:collapse">${annualRows}</table>
          ${annualReasonsList}
          ${annualMissingList}
        </div>`;
    }

    return `
      <div style="margin-bottom:20px;padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px">
        <p style="font-weight:700;color:#1e3a8a;font-size:14px;margin:0 0 10px 0">שנת מס ${u.year}</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px">${qRows}</table>
        ${annualResultBlock}
      </div>`;
  }).join('');

  return section('שאלון לפי שנה (כולל תשובות המשך)', yearBlocks);
}

function buildDocumentsSection(lead: Lead): string {
  const docs = lead.uploadedDocuments ?? [];
  if (docs.length === 0) {
    return section('מסמכים שהועלו', '<p style="color:#6b7280;font-size:13px">לא הועלו מסמכים.</p>');
  }

  const docRows = docs.map((doc) => {
    const f = doc.form106Data;
    const extracted = f
      ? [
          f.taxYear != null && `שנת מס: ${f.taxYear}`,
          f.annualTaxableIncome != null && `הכנסה חייבת: ${f.annualTaxableIncome.toLocaleString('he-IL')} ₪`,
          f.actualTaxWithheld != null && `מס שנוכה: ${f.actualTaxWithheld.toLocaleString('he-IL')} ₪`,
          f.annualTaxCreditPoints != null && `נקודות זיכוי: ${f.annualTaxCreditPoints}`,
          f.workDays != null && `ימי עבודה: ${f.workDays}`,
          f.priorYearDifferencesIncluded && 'הפרשים לשנים קודמות: כן',
        ].filter(Boolean).join(' | ')
      : 'לא חולץ';

    return `<tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:6px 8px;font-size:12px;font-weight:500">${doc.fileName}</td>
      <td style="padding:6px 8px;font-size:11px;color:#374151">${extracted}</td>
      <td style="padding:6px 8px;font-size:11px;color:#6b7280">${doc.detectedYear ?? '—'}</td>
    </tr>`;
  }).join('');

  const table = `<table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="padding:6px 8px;text-align:right;font-size:12px">קובץ</th>
        <th style="padding:6px 8px;text-align:right;font-size:12px">נתוני טופס 106</th>
        <th style="padding:6px 8px;text-align:right;font-size:12px">שנה</th>
      </tr>
    </thead>
    <tbody>${docRows}</tbody>
  </table>`;

  return section('מסמכים שהועלו', table);
}

// ── Main builder ──────────────────────────────────────────────────────────────

function buildEmailHtml(lead: Lead, result: CaseResult, yearAnswers: YearAnswerEntry[]): string {
  return `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto;color:#1f2937;padding:16px">
  <h2 style="color:#1e3a8a;margin-bottom:2px">ליד חדש — בדיקת החזר מס</h2>
  <p style="color:#9ca3af;font-size:12px;margin-top:0">${new Date(lead.createdAt).toLocaleString('he-IL')}</p>

  ${buildContactSection(lead)}
  ${buildResultSection(result)}
  ${buildReasonsSection(result)}
  ${buildMissingSection(result)}
  ${buildQuestionnaireSection(yearAnswers, result.yearlySummaries)}
  ${buildDocumentsSection(lead)}

  <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb" />
  <p style="color:#9ca3af;font-size:11px">נשלח ממערכת בדיקת זכאות להחזר מס</p>
</div>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendLeadNotification(
  lead: Lead,
  result: CaseResult,
  yearAnswers: YearAnswerEntry[],
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

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: INTERNAL_EMAIL,
    replyTo: lead.email,
    subject: `ליד חדש — ${lead.fullName} | ${RESULT_TYPE_LABELS[result.type]}`,
    html: buildEmailHtml(lead, result, yearAnswers),
    attachments,
  });

  if (error) {
    console.error('[email] Resend error:', error.name, error.message);
    return { success: false, error: error.message };
  }

  console.log('[email] Sent OK to', INTERNAL_EMAIL);
  return { success: true };
}

export { buildEmailHtml };
