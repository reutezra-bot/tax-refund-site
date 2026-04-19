import type { QuestionnaireAnswers } from '@/types/questionnaire';
import type { UploadedDocument } from '@/types/documents';
import {
  deriveSignals,
  type Form106ExtractedData,
} from './form106-parser';
import { getTaxConfig, applyBrackets } from './tax-config/index';

// ── Public types ──────────────────────────────────────────────────────────────

export type EligibilityResultType = 'positive' | 'review' | 'insufficient';
export type RefundRange = 'up_to_2k' | '2k_to_6k' | 'above_6k';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export const REFUND_RANGE_LABELS: Record<RefundRange, string> = {
  up_to_2k: 'עד 2,000 ₪',
  '2k_to_6k': '2,000–6,000 ₪',
  above_6k: 'מעל 6,000 ₪',
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

export interface EligibilityResult {
  type: EligibilityResultType;
  score: number;
  refundRange?: RefundRange;
  confidenceLevel: ConfidenceLevel;
  indicators: string[];
  /** Hebrew bullets for the "למה קיבלתי" section.
   *  RULE: must never include specific numeric values from the mock parser —
   *  only signal types and qualitative descriptions. */
  reasoningBullets: string[];
  warnings: string[];
  manualReviewRecommended: boolean;
  detectedYears: number[];
  /** IDs of the documents that produced this result.
   *  Used to detect staleness: if current docs differ, recalculate. */
  sourceDocumentIds: string[];
  /** Raw extracted data per document — used by the dev debug panel only. */
  parsedForms: Form106ExtractedData[];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Estimate annual tax due for one Form 106.
 * Returns null if critical inputs are missing.
 */
function estimateTaxDue(data: Form106ExtractedData): number | null {
  if (data.annualTaxableIncome === null) return null;
  const year = data.taxYear ?? new Date().getFullYear() - 1;
  const config = getTaxConfig(year);

  const grossTax = applyBrackets(data.annualTaxableIncome, config);
  const creditPoints = data.annualTaxCreditPoints ?? 2.25; // conservative default if missing
  const creditsAmount = creditPoints * config.creditPointValueAnnual;
  return Math.max(0, Math.round(grossTax - creditsAmount));
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function calculateEligibility(
  answers: Partial<QuestionnaireAnswers>,
  documents: UploadedDocument[],
): EligibilityResult {
  const indicators: string[] = [];
  const reasoningBullets: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  let manualReviewRecommended = false;

  // ── Source document IDs (for staleness detection) ─────────────────────────
  const sourceDocumentIds = documents.map((d) => d.id);

  // ── Detected tax years (from AI extraction or manual detectedYear field) ──
  const detectedYears = [
    ...new Set(
      documents.flatMap((d) => {
        const fromExtraction = d.form106Data?.taxYear;
        const fromMeta = d.detectedYear;
        return [fromExtraction, fromMeta].filter((y): y is number => !!y);
      }),
    ),
  ].sort((a, b) => b - a);

  // ── Read real extracted data (set during upload via /api/extract-form106) ──
  // Documents without form106Data are skipped from numeric analysis but still
  // counted for multi-document signals.
  const parsedForms: Form106ExtractedData[] = documents
    .filter((d) => d.form106Data != null)
    .map((d) => d.form106Data!);

  // ── Aggregate signals across all forms ────────────────────────────────────
  let totalWithheld = 0;
  let totalEstimatedDue = 0;
  let totalRefundPotential = 0;
  let hasAnyValidForm = false;
  let worstConfidence = 1.0;
  let hasPriorYearIssues = false;
  let hasMissingCriticalFields = false;

  for (const form of parsedForms) {
    const signals = deriveSignals(form);

    for (const w of form.extractionWarnings) {
      if (!warnings.includes(w)) warnings.push(w);
    }

    if (signals.lowConfidenceSignal) hasMissingCriticalFields = true;
    if (signals.priorYearComplexitySignal) hasPriorYearIssues = true;
    worstConfidence = Math.min(worstConfidence, form.extractionConfidence);

    if (form.annualTaxableIncome === null || form.actualTaxWithheld === null) continue;
    hasAnyValidForm = true;

    const estimatedDue = estimateTaxDue(form);
    if (estimatedDue === null) continue;

    totalWithheld += form.actualTaxWithheld;
    totalEstimatedDue += estimatedDue;
    const formPotential = form.actualTaxWithheld - estimatedDue;
    totalRefundPotential += formPotential;

    // ── Per-form reasoning bullets (qualitative — no mock-specific numbers) ──

    if (signals.meaningfulTaxWithholdingSignal) {
      score += 25;
      if (!indicators.includes('מס שנוכה בפועל')) indicators.push('מס שנוכה בפועל');
      reasoningBullets.push(
        'נמצא מס שנוכה בפועל בטופס 106 — נבדק האם שולם מס ביתר ביחס להכנסה השנתית החייבת',
      );
    }

    if (signals.partialYearEmploymentSignal) {
      score += 18;
      if (!indicators.includes('עבודה חלקית בשנה')) indicators.push('עבודה חלקית בשנה');
      reasoningBullets.push(
        'ניתוח הטופס מצביע על ייתכנות של עבודה בחלק מהשנה בלבד — מצב שמגדיל לעיתים את אפשרות ההחזר',
      );
    }

    if (form.annualTaxCreditPoints !== null) {
      score += 8;
      reasoningBullets.push(
        'בטופס זוהו נקודות זיכוי שנתיות שנלקחו בחשבון באומדן הראשוני',
      );
    }

    if (signals.priorYearComplexitySignal) {
      manualReviewRecommended = true;
      reasoningBullets.push(
        'בטופס זוהו הפרשים לשנים קודמות — מצב זה מחייב זהירות בפרשנות הנתונים ומומלצת בדיקה מקצועית',
      );
    }

    if (signals.deductionSupportSignal) {
      score += 10;
      const parts: string[] = [];
      if (form.section45ACredit) parts.push('זיכוי מס (סעיף 45א)');
      if (form.lifeInsuranceDeduction) parts.push('ניכוי ביטוח חיים');
      if (form.pensionContributionsEmployee) parts.push('הפקדות פנסיה');
      if (parts.length > 0) {
        if (!indicators.includes('ניכויים/זיכויים בטופס')) indicators.push('ניכויים/זיכויים בטופס');
        reasoningBullets.push(
          `בטופס זוהו ניכויים וזיכויים נוספים: ${parts.join(', ')} — שנלקחו בחשבון באומדן הראשוני`,
        );
      }
    }

    if (formPotential > 0) {
      score += formPotential > 6000 ? 35 : formPotential > 2000 ? 22 : 12;
    }
  }

  // ── Multi-document (count of all uploaded files) ─────────────────────────
  if (documents.length > 1) {
    score += 15;
    indicators.push('מספר טפסי 106');
    reasoningBullets.push(
      `הועלו ${documents.length} טפסי 106 — מה שמצביע על יותר ממעסיק אחד, גורם המגדיל את הסיכוי להחזר`,
    );
  }

  // ── Multiple years ────────────────────────────────────────────────────────
  if (detectedYears.length > 1) {
    score += detectedYears.length * 5;
    indicators.push(`${detectedYears.length} שנות מס`);
  }

  // ── Questionnaire (user-provided data — safe to reference directly) ────────

  if (answers.selfEmployedOrForeignIncome === true) {
    manualReviewRecommended = true;
    indicators.push('הכנסות מעסק / עצמאי / חו"ל');
    reasoningBullets.push(
      'דיווחת על הכנסות מעסק, עצמאי, או ממקורות בחו"ל — מקרים אלה דורשים בדיקה ידנית מורחבת',
    );
    return buildResult({
      type: 'review', score, refundRange: 'up_to_2k', confidenceLevel: 'medium',
      indicators, reasoningBullets, warnings, manualReviewRecommended: true,
      detectedYears, sourceDocumentIds, parsedForms,
    });
  }

  if (answers.multipleEmployers === true) {
    score += 14;
    if (!indicators.includes('יותר ממעסיק אחד')) indicators.push('יותר ממעסיק אחד');
    reasoningBullets.push('דיווחת על יותר ממעסיק אחד — עובדה זו מגבירה משמעותית את הסיכוי להחזר מס');
  }

  if (
    answers.partialYear === true &&
    !parsedForms.some((f) => deriveSignals(f).partialYearEmploymentSignal)
  ) {
    score += 10;
    if (!indicators.includes('עבודה חלקית בשנה')) indicators.push('עבודה חלקית בשנה');
  }

  const periods = answers.specialPeriods ?? [];
  const periodMap: Record<string, { label: string; pts: number; bullet: string }> = {
    unemployment:   { label: 'תקופת אבטלה',  pts: 20, bullet: 'דיווחת על תקופת אבטלה — תקופה זו נכללת בבדיקת הזכאות' },
    unpaidLeave:    { label: 'חל"ת',          pts: 16, bullet: 'דיווחת על תקופת חל"ת — תקופה זו עשויה לתרום לזכאות' },
    reserveDuty:    { label: 'מילואים',        pts: 16, bullet: 'דיווחת על שירות מילואים — עובדה זו מהווה גורם תומך בבדיקה' },
    maternityLeave: { label: 'חופשת לידה',    pts: 16, bullet: 'דיווחת על חופשת לידה — תקופה זו נלקחת בחשבון בבדיקה' },
  };
  for (const [key, cfg] of Object.entries(periodMap)) {
    if (periods.includes(key as never)) {
      score += cfg.pts;
      indicators.push(cfg.label);
      reasoningBullets.push(cfg.bullet);
    }
  }

  if (answers.hasLifeInsurance === true) {
    const monthly = answers.lifeInsuranceMonthlyEstimate ?? 0;
    score += monthly >= 300 ? 12 : 8;
    if (!indicators.includes('ביטוח חיים פרטי')) {
      indicators.push('ביטוח חיים פרטי');
      reasoningBullets.push('דיווחת על ביטוח חיים פרטי — ייתכן שניכוי זה לא הופיע במלואו בטופס 106');
    }
  }

  if (answers.hasDonations === true) {
    const yearly = answers.donationsYearlyEstimate ?? 0;
    score += yearly >= 2000 ? 12 : 7;
    indicators.push('תרומות לעמותות מוכרות');
    reasoningBullets.push('דיווחת על תרומות לעמותות מוכרות — זיכוי על תרומות ניתן לדרוש בדו"ח שנתי');
  }

  // ── Confidence ────────────────────────────────────────────────────────────
  let confidenceLevel: ConfidenceLevel;
  if (!hasAnyValidForm) {
    confidenceLevel = 'low';
    warnings.push('לא בוצעה חילוץ נתונים מלא מהטופס — האומדן מבוסס בעיקר על הנתונים שהוזנו ידנית');
  } else if (
    worstConfidence >= 0.82 &&
    !hasPriorYearIssues &&
    !hasMissingCriticalFields &&
    detectedYears.length > 0
  ) {
    confidenceLevel = 'high';
  } else if (worstConfidence >= 0.68 && !hasMissingCriticalFields) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
    warnings.push('חלק מהנתונים בטופס אינם מלאים — האומדן הוא ראשוני ומחייב בדיקה אנושית');
  }

  if (hasPriorYearIssues && confidenceLevel === 'high') confidenceLevel = 'medium';

  // ── Result type ───────────────────────────────────────────────────────────
  const hasFormSignals =
    hasAnyValidForm &&
    (parsedForms.some((f) => deriveSignals(f).meaningfulTaxWithholdingSignal) ||
      parsedForms.some((f) => deriveSignals(f).partialYearEmploymentSignal));

  let type: EligibilityResultType;
  if (score >= 40) {
    type = 'positive';
  } else if (score >= 15 || hasFormSignals) {
    type = 'review';
  } else {
    type = 'insufficient';
  }

  if (type === 'positive' && hasPriorYearIssues && confidenceLevel !== 'high') {
    type = 'review';
  }

  // ── Refund range ──────────────────────────────────────────────────────────
  let refundRange: RefundRange | undefined;
  if (type !== 'insufficient') {
    let anchorPotential = hasAnyValidForm ? totalRefundPotential : null;

    if (anchorPotential !== null) {
      if (confidenceLevel === 'medium') anchorPotential = Math.round(anchorPotential * 0.75);
      if (confidenceLevel === 'low')    anchorPotential = Math.round(anchorPotential * 0.50);
    }

    if (anchorPotential !== null && anchorPotential > 0) {
      if (anchorPotential >= 6000)      refundRange = 'above_6k';
      else if (anchorPotential >= 2000) refundRange = '2k_to_6k';
      else                              refundRange = 'up_to_2k';
    } else if (score >= 40) {
      refundRange = score >= 70 ? '2k_to_6k' : 'up_to_2k';
    } else {
      refundRange = 'up_to_2k';
    }

    if (confidenceLevel === 'low' && refundRange === 'above_6k') {
      refundRange = '2k_to_6k';
      warnings.push('האומדן עוּגן ל-2,000–6,000 ₪ עקב ביטחון נמוך בנתונים — ייתכן שהסכום גבוה יותר לאחר בדיקה מעמיקה');
    }
  }

  // ── Conclusion bullet ─────────────────────────────────────────────────────
  if (type === 'positive') {
    reasoningBullets.push('בהתאם לנתונים הקיימים, נמצאה אינדיקציה ראשונית לאפשרות של החזר מס — מומלץ להשאיר פרטים לבדיקה מעמיקה');
  } else if (type === 'review') {
    reasoningBullets.push('הנתונים מצדיקים בדיקה מקצועית נוספת — ישנם גורמים שעשויים להצביע על זכאות, אך נדרש אימות');
  } else {
    reasoningBullets.push('לפי הנתונים הראשוניים לא זוהתה אינדיקציה מספקת, אך אם יש פרטים נוספים שלא הוזנו, כדאי לפנות לבדיקה ידנית');
  }

  return buildResult({
    type, score, refundRange, confidenceLevel,
    indicators, reasoningBullets, warnings, manualReviewRecommended,
    detectedYears, sourceDocumentIds, parsedForms,
  });
}

// ── Builder ───────────────────────────────────────────────────────────────────

function buildResult(r: EligibilityResult): EligibilityResult {
  const seen = new Set<string>();
  r.reasoningBullets = r.reasoningBullets.filter((b) => {
    if (seen.has(b)) return false;
    seen.add(b);
    return true;
  });
  r.reasoningBullets = r.reasoningBullets.slice(0, 5);
  return r;
}
