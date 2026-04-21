/**
 * Per-year eligibility analysis.
 *
 * COMBINED-SOURCE RULE:
 *   - 'potential_refund' requires real Form 106 numeric data proving overpayment.
 *   - 'needs_review' can be triggered by questionnaire answers alone — any tax-relevant
 *     answer (donations, life insurance, special periods, multiple employers) is a real
 *     signal and is never silently ignored.
 *   - missingData[] lists what is needed to improve the result.
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

const MIN_REFUND_POTENTIAL_ILS = 300;

function estimateTaxDue(
  annualTaxableIncome: number,
  annualTaxCreditPoints: number | null,
  year: number,
): number {
  const config = getTaxConfig(year);
  const grossTax = applyBrackets(annualTaxableIncome, config);
  const points = annualTaxCreditPoints ?? 2.25;
  const credits = points * config.creditPointValueAnnual;
  return Math.max(0, Math.round(grossTax - credits));
}

export function calculateAnnualResult(unit: TaxYearUnit): AnnualResult {
  const { year, documents, answers } = unit;

  const reasons: string[] = [];
  const warnings: string[] = [];
  const missingData: string[] = [];

  let docScore = 0;
  let questionnaireScore = 0;
  let manualReviewRecommended = false;
  let priorYearDifferencesDetected = false;
  const extractedFields: string[] = [];

  // ── Self-employed / foreign income → always needs_review ─────────────────
  if (answers?.selfEmployedOrForeignIncome === true) {
    manualReviewRecommended = true;
    reasons.push('דיווחת על הכנסות מעסק, עצמאי, או ממקורות בחו"ל — נדרשת בדיקה ידנית מורחבת');
    return {
      year, type: 'needs_review', confidenceLevel: 'low',
      reasons, warnings, missingData, manualReviewRecommended,
      priorYearDifferencesDetected: false,
    };
  }

  // ── Questionnaire signals ─────────────────────────────────────────────────
  // Every tax-relevant answer is a real signal. Collect them all before
  // deciding the result type so nothing is silently ignored.

  let hasPositiveQuestionnaireSignal = false;

  if (answers) {
    if (answers.multipleEmployers === true) {
      hasPositiveQuestionnaireSignal = true;
      questionnaireScore += 14;
      reasons.push('דיווחת על יותר ממעסיק אחד — עובדה זו מגבירה את הסיכוי להחזר מס');
    }

    if (answers.partialYear === true) {
      hasPositiveQuestionnaireSignal = true;
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
        hasPositiveQuestionnaireSignal = true;
        questionnaireScore += cfg.pts;
        reasons.push(cfg.bullet);
      }
    }

    if (answers.specialPeriods.includes('unpaidLeave')) {
      if (!answers.unpaidLeaveMonths) {
        missingData.push(`מספר חודשי חל"ת בשנת ${year}`);
      }
    }
    if (answers.specialPeriods.includes('reserveDuty')) {
      if (!answers.reserveDutyDays) {
        missingData.push(`מספר ימי מילואים בשנת ${year}`);
      }
    }
    if (answers.specialPeriods.includes('maternityLeave')) {
      if (!answers.maternityLeaveMonths) {
        missingData.push(`מספר חודשי חופשת לידה בשנת ${year}`);
      }
    }

    if (answers.hasLifeInsurance === true) {
      hasPositiveQuestionnaireSignal = true;
      const monthly = answers.lifeInsuranceMonthlyEstimate ?? 0;
      if (monthly > 0) {
        questionnaireScore += monthly >= 300 ? 12 : 8;
        reasons.push(`דיווחת על ביטוח חיים פרטי בשנת ${year} (כ-${monthly.toLocaleString('he-IL')} ₪ לחודש)`);
      } else {
        reasons.push(`דיווחת על ביטוח חיים פרטי בשנת ${year} — הסכום לא הוזן`);
        missingData.push('סכום ביטוח חיים חודשי (לחישוב גובה הניכוי)');
      }
    }

    if (answers.hasDonations === true) {
      hasPositiveQuestionnaireSignal = true;
      const yearly = answers.donationsYearlyEstimate ?? 0;
      if (yearly > 0) {
        questionnaireScore += yearly >= 2000 ? 12 : 7;
        reasons.push(`דיווחת על תרומות לעמותות מוכרות בשנת ${year} (כ-${yearly.toLocaleString('he-IL')} ₪)`);
      } else {
        reasons.push(`דיווחת על תרומות לעמותות מוכרות בשנת ${year} — הסכום לא הוזן`);
        missingData.push('סכום תרומות שנתי (לחישוב גובה הזיכוי)');
      }
    }
  }

  // ── Collect valid extracted forms ─────────────────────────────────────────
  const forms = documents
    .filter((d) => !d.extracting && d.form106Data != null)
    .map((d) => d.form106Data!);

  const allDocsUploaded = documents.filter((d) => !d.extracting).length;
  const hasAnyForm = forms.length > 0;

  if (allDocsUploaded === 0) {
    missingData.push('טופס 106');
  }

  // ── Aggregate financial data ──────────────────────────────────────────────
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

    if (form.annualTaxableIncome !== null) extractedFields.push('annualTaxableIncome (שדה 158)');
    if (form.actualTaxWithheld !== null) extractedFields.push('actualTaxWithheld (שדה 42)');
    if (form.annualTaxCreditPoints !== null) extractedFields.push('annualTaxCreditPoints (נקודות זיכוי)');
    if (form.workDays !== null) extractedFields.push('workDays (ימי עבודה)');
    if (form.taxYear !== null) extractedFields.push('taxYear (שנת מס)');
    if (form.pensionContributionsEmployee !== null) extractedFields.push('pensionContributionsEmployee');
    if (form.lifeInsuranceDeduction !== null) extractedFields.push('lifeInsuranceDeduction');
    if (form.section45ACredit !== null) extractedFields.push('section45ACredit');
    if (form.priorYearDifferencesIncluded !== null) extractedFields.push('priorYearDifferencesIncluded');

    if (form.annualTaxableIncome === null || form.actualTaxWithheld === null) {
      hasMissingCriticalFields = true;
      continue;
    }

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

    if (signals.meaningfulTaxWithholdingSignal) {
      docScore += 25;
      reasons.push('נמצא מס שנוכה בפועל בטופס 106 — נבדק האם שולם מס ביתר ביחס להכנסה החייבת');
    }
    if (signals.partialYearEmploymentSignal) {
      docScore += 18;
      if (!answers?.partialYear) {
        reasons.push('הטופס מצביע על עבודה בחלק מהשנה בלבד — מצב שמגדיל לעיתים את אפשרות ההחזר');
      }
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
      if (parts.length > 0) reasons.push(`ניכויים/זיכויים נוספים זוהו בטופס: ${parts.join(', ')}`);
    }
    if (formPotential > 0) {
      docScore += formPotential > 6000 ? 35 : formPotential > 2000 ? 22 : 12;
    }
  }

  if (documents.length > 1) {
    docScore += 15;
    reasons.push(`הועלו ${documents.length} טפסי 106 לשנת ${year} — מעיד על יותר ממעסיק אחד`);
  }

  if (hasAnyForm && !hasValidNumericData) {
    missingData.push('נתוני טופס 106 מלאים (הכנסה חייבת ומס שנוכה לא חולצו בהצלחה)');
    warnings.push('לא הצלחנו לחלץ את שדות המפתח מהטופס ברמת ודאות מספקת — האומדן מוגבל');
  }

  // ── Confidence level ──────────────────────────────────────────────────────
  let confidenceLevel: ConfidenceLevel;
  if (!hasAnyForm || !hasValidNumericData) {
    confidenceLevel = 'low';
  } else if (worstConfidence >= 0.80 && !hasMissingCriticalFields) {
    confidenceLevel = 'high';
  } else if (worstConfidence >= 0.55 && !hasMissingCriticalFields) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
    warnings.push('חלק מהנתונים בטופס אינם מלאים — האומדן הוא ראשוני ומחייב בדיקה מקצועית');
  }

  if (hasPriorYearDiffs && confidenceLevel === 'high') {
    confidenceLevel = 'medium';
  }

  // ── Positive gate: requires form math proving overpayment ─────────────────
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

  const combinedScore = docScore + Math.round(questionnaireScore * 0.5);

  const hasFormSignals =
    hasValidNumericData &&
    forms.some((f) => {
      const s = deriveSignals(f);
      return s.meaningfulTaxWithholdingSignal || s.partialYearEmploymentSignal;
    });

  // ── Result type ───────────────────────────────────────────────────────────
  // potential_refund: form math proves overpayment with sufficient confidence.
  // needs_review: any tax-relevant questionnaire answer OR form signals without
  //               clear overpayment — never silently ignored.
  // no_clear_indication: no signals from either source.
  // insufficient_data: no documents AND no questionnaire answers at all.

  let type: AnnualResultType;

  if (canBePositive) {
    type = 'potential_refund';
  } else if (allDocsUploaded === 0 && !answers && !hasPositiveQuestionnaireSignal) {
    type = 'insufficient_data';
  } else if (
    hasPositiveQuestionnaireSignal ||
    missingData.length > 0 ||
    hasFormSignals ||
    combinedScore >= 10
  ) {
    type = 'needs_review';
  } else {
    type = 'no_clear_indication';
  }

  // ── Questionnaire-based ILS credit estimate ───────────────────────────────
  // Donations only: section 46 of the Income Tax Ordinance grants a 35% credit
  // on donations ≥ ₪180 to a recognised public institution (מוסד ציבורי מאושר).
  //
  // Life insurance is intentionally excluded: section 32(13) prohibits deduction
  // of premiums for personal life insurance. Section 47 applies only to premiums
  // embedded inside pension products, which would already appear on Form 106.
  // A standalone "ביטוח חיים פרטי" answer is a qualitative review signal only.
  let questionnaireEstimateILS = 0;

  if (answers) {
    const donationYearly = answers.donationsYearlyEstimate ?? 0;
    if (answers.hasDonations === true && donationYearly >= 180) {
      questionnaireEstimateILS += Math.round(donationYearly * 0.35);
    }
  }

  // ── Refund range ──────────────────────────────────────────────────────────
  let refundRange: RefundRange | undefined;
  let estimatedRefundPotential: number | undefined;

  if (canBePositive && type === 'potential_refund') {
    estimatedRefundPotential = totalRefundPotential + questionnaireEstimateILS;

    if (confidenceLevel !== 'low') {
      let anchorPotential = totalRefundPotential + questionnaireEstimateILS;
      if (confidenceLevel === 'medium') anchorPotential = Math.round(anchorPotential * 0.75);

      if (anchorPotential >= 6000)      refundRange = 'above_6k';
      else if (anchorPotential >= 2000) refundRange = '2k_to_6k';
      else                              refundRange = 'up_to_2k';

      if (hasPriorYearDiffs && refundRange === 'above_6k') {
        refundRange = '2k_to_6k';
        warnings.push('האומדן עוּגן עקב הפרשים לשנים קודמות — הסכום האמיתי עשוי להיות שונה');
      }
    }
  } else if (questionnaireEstimateILS > 0) {
    // No form math, but we have questionnaire-based credit estimates
    estimatedRefundPotential = questionnaireEstimateILS;
  }

  // ── Deduplicate reasons ───────────────────────────────────────────────────
  const seen = new Set<string>();
  const uniqueReasons = reasons.filter((r) => {
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  }).slice(0, 8);

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
    missingData,
    manualReviewRecommended,
    priorYearDifferencesDetected,
    _devInfo,
  };
}
