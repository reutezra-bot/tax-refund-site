/**
 * Cross-year case analysis.
 *
 * Combines per-year AnnualResults into a single CaseResult.
 * Applies cross-year logic:
 *  - Prior-year difference chains (one year's retroactive diff affects another)
 *  - Whether multiple positive years strengthen the conclusion
 *  - Whether any year forces manual review
 *  - Aggregate refund potential calculation
 */

import type {
  TaxYearUnit,
  AnnualResult,
  CaseResult,
  CaseResultType,
  ConfidenceLevel,
  RefundRange,
} from '@/types/case';
import { calculateAnnualResult } from './annual-analysis';

// ── Main function ─────────────────────────────────────────────────────────────

export function calculateCaseResult(years: TaxYearUnit[]): CaseResult {
  if (years.length === 0) {
    return {
      type: 'insufficient',
      confidenceLevel: 'low',
      yearlySummaries: [],
      crossYearWarnings: [],
      overallReasons: ['לא נוספו שנות מס לתיק'],
      manualReviewRecommended: false,
      sourceDocumentIds: [],
    };
  }

  // ── Compute per-year results ──────────────────────────────────────────────
  const yearlySummaries: AnnualResult[] = years.map(calculateAnnualResult);

  // ── Cross-year analysis ───────────────────────────────────────────────────
  const crossYearWarnings: string[] = [];
  const overallReasons: string[] = [];

  const sortedYears = [...years].sort((a, b) => a.year - b.year); // ascending for timeline analysis

  // Detect prior-year difference chains
  const yearsWithPriorDiffs = yearlySummaries
    .filter((r) => r.priorYearDifferencesDetected)
    .map((r) => r.year);

  // For each year with prior-year diffs: check whether the referenced prior year
  // also has a Form 106 uploaded. If yes — both are in the calculation (informational note).
  // If no — flag as a data gap that may affect accuracy.
  for (const yearWithDiff of yearsWithPriorDiffs) {
    const priorYear = yearWithDiff - 1;
    const priorUnit = years.find((u) => u.year === priorYear);
    const priorHasForm = priorUnit?.documents.some((d) => d.form106Data != null) ?? false;

    if (priorHasForm) {
      crossYearWarnings.push(
        `טופס ${yearWithDiff} כולל הפרשים לשנת ${priorYear} — שתי השנות כלולות בחישוב`,
      );
    } else {
      crossYearWarnings.push(
        `טופס ${yearWithDiff} כולל הפרשים לשנת ${priorYear}, אך טופס 106 לשנת ${priorYear} לא הועלה — ייתכן שהחישוב אינו מלא`,
      );
    }
  }

  // Multiple years strengthen the case
  const positiveYears = yearlySummaries.filter((r) => r.type === 'positive');
  const reviewYears = yearlySummaries.filter((r) => r.type === 'review');
  const insufficientDataYears = yearlySummaries.filter((r) => r.type === 'insufficient_data');

  if (positiveYears.length > 1) {
    overallReasons.push(
      `נמצאו אינדיקציות חיוביות ב-${positiveYears.length} שנות מס — מה שמחזק את הממצאים הכוללים`,
    );
  }
  if (positiveYears.length >= 1) {
    overallReasons.push(
      positiveYears.length === 1
        ? `נמצאה אינדיקציה חיובית לשנת ${positiveYears[0].year}`
        : `שנות מס עם אינדיקציה חיובית: ${positiveYears.map((r) => r.year).join(', ')}`,
    );
  }
  if (reviewYears.length > 0 && positiveYears.length === 0) {
    overallReasons.push(
      `נמצאו נתונים הדורשים בדיקה נוספת בשנות: ${reviewYears.map((r) => r.year).join(', ')}`,
    );
  }
  if (insufficientDataYears.length > 0) {
    crossYearWarnings.push(
      `נתוני טופס 106 לא חולצו בצורה מספקת לשנות: ${insufficientDataYears.map((r) => r.year).join(', ')} — שנות אלה לא נכללות בחישוב הכמותי`,
    );
  }
  if (years.length > 1) {
    overallReasons.push(`הבדיקה מכסה ${years.length} שנות מס: ${years.map((u) => u.year).sort((a, b) => b - a).join(', ')}`);
  }

  // ── Overall result type ───────────────────────────────────────────────────
  const manualReviewRecommended = yearlySummaries.some((r) => r.manualReviewRecommended);

  let type: CaseResultType;
  if (positiveYears.length > 0 && positiveYears.some((r) => r.confidenceLevel !== 'low')) {
    type = 'positive';
  } else if (
    reviewYears.length > 0 ||
    positiveYears.length > 0 ||
    manualReviewRecommended
  ) {
    type = 'review';
  } else {
    type = 'insufficient';
  }

  // ── Overall confidence ────────────────────────────────────────────────────
  const confOrder: Record<ConfidenceLevel, number> = { high: 3, medium: 2, low: 1 };

  // Use the confidence of the best positive year, or lowest if no positive years
  let confidenceLevel: ConfidenceLevel;
  if (positiveYears.length > 0) {
    // Best confidence among positive years
    const best = positiveYears.reduce((a, b) =>
      confOrder[a.confidenceLevel] >= confOrder[b.confidenceLevel] ? a : b,
    );
    confidenceLevel = best.confidenceLevel;
  } else if (reviewYears.length > 0) {
    // Lowest confidence among review years (conservative)
    const worst = reviewYears.reduce((a, b) =>
      confOrder[a.confidenceLevel] <= confOrder[b.confidenceLevel] ? a : b,
    );
    confidenceLevel = worst.confidenceLevel;
  } else {
    confidenceLevel = 'low';
  }

  // Cross-year complexity always prevents 'high' confidence
  if (yearsWithPriorDiffs.length > 0 && confidenceLevel === 'high') {
    confidenceLevel = 'medium';
  }

  // ── Aggregate refund range ────────────────────────────────────────────────
  let refundRange: RefundRange | undefined;
  if (type !== 'insufficient' && confidenceLevel !== 'low') {
    // Sum estimated potentials from years where we have valid numeric data
    const yearsWithPotential = yearlySummaries.filter(
      (r) => r.estimatedRefundPotential !== undefined && r.type !== 'insufficient_data',
    );

    if (yearsWithPotential.length > 0) {
      let totalPotential = yearsWithPotential.reduce(
        (sum, r) => sum + (r.estimatedRefundPotential ?? 0),
        0,
      );
      if (confidenceLevel === 'medium') totalPotential = Math.round(totalPotential * 0.75);

      if (totalPotential > 0) {
        if (totalPotential >= 6000)       refundRange = 'above_6k';
        else if (totalPotential >= 2000)  refundRange = '2k_to_6k';
        else                              refundRange = 'up_to_2k';
      }
      // If totalPotential <= 0 despite numeric data: no range — form says no overpayment
    }
    // No numeric data from any year: no range.
    // Questionnaire signals alone never produce a refund range estimate.

    // Cap: cross-year prior diffs + medium confidence → cap at 2k_to_6k
    if (yearsWithPriorDiffs.length > 0 && refundRange === 'above_6k') {
      refundRange = '2k_to_6k';
    }
  }

  // ── Source document IDs ───────────────────────────────────────────────────
  const sourceDocumentIds = years.flatMap((u) => u.documents.map((d) => d.id));

  return {
    type,
    confidenceLevel,
    refundRange,
    yearlySummaries,
    crossYearWarnings,
    overallReasons,
    manualReviewRecommended,
    sourceDocumentIds,
  };
}
