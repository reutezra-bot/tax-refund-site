/**
 * Per-year eligibility analysis.
 *
 * DOCUMENT-FIRST RULE:
 *   - 'positive' result requires real Form 106 numeric data (income + withheld tax)
 *     with sufficient extraction confidence showing actual overpayment.
 *   - Questionnaire answers are supplementary only: they can add context and
 *     push borderline cases toward 'review', but they CANNOT produce a 'positive'
 *     result on their own.
 *   - If extraction failed or confidence is low: max result is 'review'.
 *   - If no document uploaded: max result is 'review' (or 'insufficient_data').
 */

import type {
  TaxYearUnit,
  AnnualResult,
  AnnualResultType,
  ConfidenceLevel,
  RefundRange,
  ResultSourceInfo,
} from '@/types/case';
import { deriveSignals } from '@/lib/form106-parser';
import { getTaxConfig, applyBrackets } from '@/lib/tax-config/index';

const IS_DEV = process.env.NODE_ENV === 'development';

// Minimum refund potential (ILS) before we treat the form as showing overpayment.
// Below this threshold the difference is within noise / rounding.
const MIN_REFUND_POTENTIAL_ILS = 300;

// ── Internal helpers ──────────────────────────────────────────────────────────

function estimateTaxDue(
  annualTaxableIncome: number,
  annualTaxCreditPoints: number | null,
  year: number,
): number {
  const config = getTaxConfig(year);
  const grossTax = applyBrackets(annualTaxableIncome, config);
  const points = annualTaxCreditPoints ?? 2.25; // conservative if unknown
  const credits = points * config.creditPointValueAnnual;
  return Math.max(0, Math.round(grossTax - credits));
}

// ── Main function ─────────────────────────────────────────────────────────────

export function calculateAnnualResult(unit: TaxYearUnit): AnnualResult {
  const { year, documents, answers } = unit;

  const reasons: string[] = [];
  const warnings: string[] = [];

  // docScore: points from extracted Form 106 data only.
  // questionnaireScore: points from user-supplied questionnaire answers only.
  // They are tracked separately so the final attribution is transparent.
  let docScore = 0;
  let questionnaireScore = 0;

  let manualReviewRecommended = false;
  let priorYearDifferencesDetected = false;
  const extractedFields: string[] = [];

  // ── Collect valid extracted forms ─────────────────────────────────────────
  const forms = documents
    .filter((d) => !d.extracting && d.form106Data != null)
    .map((d) => d.form106Data!);

  const allDocsUploaded = documents.filter((d) => !d.extracting).length;
  const hasAnyForm = forms.length > 0;

  // ── Self-employed / foreign income → always manual review ────────────────
  if (answers?.selfEmployedOrForeignIncome === true) {
    manualReviewRecommended = true;
    reasons.push('דיווחת על הכנסות מעסק, עצמאי, או ממקורות בחו"ל — נדרשת בדיקה ידנית מורחבת');
    return {
      year, type: 'review', confidenceLevel: 'low',
      reasons, warnings, manualReviewRecommended,
      priorYearDifferencesDetected: false,
    };
  }

  // ── Aggregate financial data across all forms for this year ──────────────
  let totalWithheld = 0;
  let totalEstimatedDue = 0;
  let totalRefundPotential = 0;
  let hasValidNumericData = false;
  let worstConfidence = 1.0;
  let hasPriorYearDiffs = false;
  let hasMissingCriticalFields = false;

  for (const form of forms) {
    const signals = deriveSignals(form);

    for (const w of form.extractionWarnings) {
      if (!warnings.includes(w)) warnings.push(w);
    }

    if (form.priorYearDifferencesIncluded === true) {
      hasPriorYearDiffs = true;
      priorYearDifferencesDetected = true;
    }

    worstConfidence = Math.min(worstConfidence, form.extractionConfidence);

    if (signals.lowConfidenceSignal) hasMissingCriticalFields = true;

    // Track which critical fields were extracted
    if (form.annualTaxableIncome !== null) extractedFields.push('annualTaxableIncome (שדה 158)');
    if (form.actualTaxWithheld !== null) extractedFields.push('actualTaxWithheld (שדה 42)');
    if (form.annualTaxCreditPoints !== null) extractedFields.push('annualTaxCreditPoints (נקודות זיכוי)');
    if (form.workDays !== null) extractedFields.push('workDays (ימי עבודה)');
    if (form.taxYear !== null) extractedFields.push('taxYear (שנת מס)');
    if (form.pensionContributionsEmployee !== null) extractedFields.push('pensionContributionsEmployee');
    if (form.lifeInsuranceDeduction !== null) extractedFields.push('lifeInsuranceDeduction');
    if (form.section45ACredit !== null) extractedFields.push('section45ACredit');
    if (form.priorYearDifferencesIncluded !== null) extractedFields.push('priorYearDifferencesIncluded');

    // Skip numeric calculation if critical fields missing
    if (form.annualTaxableIncome === null || form.actualTaxWithheld === null) continue;

    hasValidNumericData = true;

    const estimatedDue = estimateTaxDue(
      form.annualTaxableIncome,
      form.annualTaxCreditPoints,
      year,
    );

    totalWithheld += form.actualTaxWithheld;
    totalEstimatedDue += estimatedDue;
    const formPotential = form.actualTaxWithheld - estimatedDue;
    totalRefundPotential += formPotential;

    // ── Document-based scoring (docScore only) ──────────────────────────
    if (signals.meaningfulTaxWithholdingSignal) {
      docScore += 25;
      reasons.push('נמצא מס שנוכה בפועל בטופס 106 — נבדק האם שולם מס ביתר ביחס להכנסה החייבת');
    }
    if (signals.partialYearEmploymentSignal) {
      docScore += 18;
      reasons.push('הטופס מצביע על עבודה בחלק מהשנה בלבד — מצב שמגדיל לעיתים את אפשרות ההחזר');
    }
    if (form.annualTaxCreditPoints !== null) {
      docScore += 8;
      reasons.push('נקודות זיכוי שנתיות זוהו בטופס ונלקחו בחשבון באומדן');
    }
    if (signals.priorYearComplexitySignal) {
      reasons.push('זוהו הפרשים לשנים קודמות בטופס — הנתונים כוללים גם הכנסות מהשנה הקודמת');
    }
    if (signals.deductionSupportSignal) {
      docScore += 10;
      const parts: string[] = [];
      if (form.section45ACredit) parts.push('זיכוי סעיף 45א');
      if (form.lifeInsuranceDeduction) parts.push('ניכוי ביטוח חיים');
      if (form.pensionContributionsEmployee) parts.push('הפקדות פנסיה');
      if (parts.length > 0) {
        reasons.push(`ניכויים/זיכויים נוספים זוהו בטופס: ${parts.join(', ')}`);
      }
    }
    if (formPotential > 0) {
      docScore += formPotential > 6000 ? 35 : formPotential > 2000 ? 22 : 12;
    }
  }

  // Multiple docs for same year (doc-driven signal)
  if (documents.length > 1) {
    docScore += 15;
    reasons.push(`הועלו ${documents.length} טפסי 106 לשנת ${year} — מעיד על יותר ממעסיק אחד, מה שמגדיל את הסיכוי להחזר`);
  }

  // ── Questionnaire answers — supplementary signals only ───────────────────
  if (answers) {
    if (answers.multipleEmployers === true) {
      questionnaireScore += 14;
      reasons.push('דיווחת על יותר ממעסיק אחד — עובדה זו מגבירה את הסיכוי להחזר מס');
    }
    if (answers.partialYear === true && !forms.some((f) => deriveSignals(f).partialYearEmploymentSignal)) {
      questionnaireScore += 10;
      reasons.push('דיווחת על עבודה בחלק מהשנה בלבד');
    }

    const periodMap: Record<string, { pts: number; bullet: string }> = {
      unemployment:   { pts: 20, bullet: `דיווחת על תקופת אבטלה בשנת ${year}` },
      unpaidLeave:    { pts: 16, bullet: `דיווחת על תקופת חל"ת בשנת ${year}` },
      reserveDuty:    { pts: 16, bullet: `דיווחת על שירות מילואים בשנת ${year}` },
      maternityLeave: { pts: 16, bullet: `דיווחת על חופשת לידה בשנת ${year}` },
    };
    for (const [key, cfg] of Object.entries(periodMap)) {
      if (answers.specialPeriods.includes(key as never)) {
        questionnaireScore += cfg.pts;
        reasons.push(cfg.bullet);
      }
    }

    if (answers.hasLifeInsurance === true) {
      const monthly = answers.lifeInsuranceMonthlyEstimate ?? 0;
      questionnaireScore += monthly >= 300 ? 12 : 8;
      reasons.push(`דיווחת על ביטוח חיים פרטי בשנת ${year} — ייתכן שניכוי זה לא הופיע במלואו בטופס 106`);
    }
    if (answers.hasDonations === true) {
      const yearly = answers.donationsYearlyEstimate ?? 0;
      questionnaireScore += yearly >= 2000 ? 12 : 7;
      reasons.push(`דיווחת על תרומות לעמותות מוכרות בשנת ${year}`);
    }
  }

  // ── No documents at all ───────────────────────────────────────────────────
  if (allDocsUploaded === 0) {
    warnings.push('לא הועלה טופס 106 לשנה זו — לא ניתן לאשר תוצאה ללא מסמכים');
  }

  // ── Confidence level (based on document quality only) ────────────────────
  let confidenceLevel: ConfidenceLevel;
  if (!hasAnyForm || !hasValidNumericData) {
    confidenceLevel = 'low';
    if (hasAnyForm && !hasValidNumericData) {
      warnings.push('לא הצלחנו לחלץ את שדות המפתח מהטופס ברמת ודאות מספקת — האומדן מוגבל');
    }
  } else if (
    worstConfidence >= 0.80 &&
    !hasMissingCriticalFields
  ) {
    confidenceLevel = 'high';
  } else if (worstConfidence >= 0.55 && !hasMissingCriticalFields) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
    warnings.push('חלק מהנתונים בטופס אינם מלאים — האומדן הוא ראשוני ומחייב בדיקה מקצועית');
  }

  if (hasPriorYearDiffs) {
    // Prior-year diffs reduce confidence one step but do NOT block the result.
    // Cross-year availability is checked in case-analysis.ts.
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
  }

  // ── HARD GATE: positive requires real document-derived overpayment ────────
  //
  // All three conditions must hold simultaneously. Questionnaire answers alone
  // can NEVER satisfy this gate — they can only contribute to 'review'.
  //
  //   1. hasValidNumericData  — form income + withheld tax successfully extracted
  //   2. totalRefundPotential >= MIN_REFUND_POTENTIAL_ILS — form math shows real overpayment
  //   3. confidenceLevel !== 'low'  — extraction quality is sufficient to trust the numbers
  //
  const positiveGateStatus: ResultSourceInfo['positiveGateStatus'] =
    !hasAnyForm
      ? 'blocked_no_form'
      : !hasValidNumericData
      ? 'blocked_no_numeric_data'
      : confidenceLevel === 'low'
      ? 'blocked_low_confidence'
      : totalRefundPotential < MIN_REFUND_POTENTIAL_ILS
      ? 'blocked_no_refund_potential'
      : 'passed';

  const canBePositive = positiveGateStatus === 'passed';

  // ── Combined score for review/insufficient triage ─────────────────────────
  // Questionnaire contributes at half-weight to avoid over-indexing on self-report.
  const combinedScore = docScore + Math.round(questionnaireScore * 0.5);

  // ── Form signal check for review triage ──────────────────────────────────
  const hasFormSignals =
    hasValidNumericData &&
    forms.some((f) => {
      const s = deriveSignals(f);
      return s.meaningfulTaxWithholdingSignal || s.partialYearEmploymentSignal;
    });

  // ── Result type ───────────────────────────────────────────────────────────
  let type: AnnualResultType;

  if (canBePositive) {
    // Form data proves overpayment with sufficient confidence
    type = 'positive';
  } else if (!hasAnyForm && allDocsUploaded === 0 && combinedScore < 15) {
    // No document at all and questionnaire gives no meaningful signals
    type = 'insufficient_data';
  } else if (combinedScore >= 15 || hasFormSignals) {
    // Either some form signals or questionnaire hints → needs expert review
    type = 'review';
  } else {
    type = 'insufficient';
  }

  // ── Refund range — only when form data is the source ─────────────────────
  let refundRange: RefundRange | undefined;
  let estimatedRefundPotential: number | undefined;

  if (canBePositive && type !== 'insufficient' && type !== 'insufficient_data') {
    // Use actual form-derived potential — never infer from questionnaire score
    estimatedRefundPotential = totalRefundPotential;

    if (confidenceLevel !== 'low') {
      let anchorPotential = totalRefundPotential;
      if (confidenceLevel === 'medium') anchorPotential = Math.round(anchorPotential * 0.75);

      if (anchorPotential >= 6000)      refundRange = 'above_6k';
      else if (anchorPotential >= 2000) refundRange = '2k_to_6k';
      else                              refundRange = 'up_to_2k';

      if (hasPriorYearDiffs && refundRange === 'above_6k') {
        refundRange = '2k_to_6k';
        warnings.push('האומדן עוּגן עקב הפרשים לשנים קודמות — הסכום האמיתי עשוי להיות שונה');
      }
    }
    // If confidence is low: no range shown — not trustworthy enough
  }
  // If gate did not pass: no refundRange, no estimatedRefundPotential.
  // Questionnaire answers alone never produce a range.

  // ── Deduplicate reasons ───────────────────────────────────────────────────
  const seen = new Set<string>();
  const uniqueReasons = reasons.filter((r) => {
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  }).slice(0, 6);

  // ── Dev-only attribution info ─────────────────────────────────────────────
  const totalScore = docScore + questionnaireScore;
  const _devInfo: ResultSourceInfo | undefined = IS_DEV
    ? {
        docScore,
        questionnaireScore,
        docDataPercentage: totalScore > 0 ? Math.round((docScore / totalScore) * 100) : 0,
        extractedFields: [...new Set(extractedFields)],
        positiveGateStatus,
        extractionConfidence: hasAnyForm ? worstConfidence : 0,
      }
    : undefined;

  return {
    year,
    type,
    confidenceLevel,
    refundRange,
    estimatedRefundPotential,
    reasons: uniqueReasons,
    warnings,
    manualReviewRecommended,
    priorYearDifferencesDetected,
    _devInfo,
  };
}
