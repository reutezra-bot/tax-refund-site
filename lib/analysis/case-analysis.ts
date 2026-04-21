import type {
  TaxYearUnit,
  AnnualResult,
  CaseResult,
  CaseResultType,
  ConfidenceLevel,
  RefundRange,
} from '@/types/case';
import { calculateAnnualResult } from './annual-analysis';

export function calculateCaseResult(years: TaxYearUnit[]): CaseResult {
  if (years.length === 0) {
    return {
      type: 'no_clear_indication',
      confidenceLevel: 'low',
      yearlySummaries: [],
      crossYearWarnings: [],
      overallReasons: ['לא נוספו שנות מס לתיק'],
      manualReviewRecommended: false,
      missingData: ['טופס 106'],
      sourceDocumentIds: [],
    };
  }

  const yearlySummaries: AnnualResult[] = years.map(calculateAnnualResult);

  const crossYearWarnings: string[] = [];
  const overallReasons: string[] = [];

  const sortedYears = [...years].sort((a, b) => a.year - b.year);
  void sortedYears;

  // Detect prior-year difference chains
  const yearsWithPriorDiffs = yearlySummaries
    .filter((r) => r.priorYearDifferencesDetected)
    .map((r) => r.year);

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

  const positiveYears = yearlySummaries.filter((r) => r.type === 'potential_refund');
  const reviewYears = yearlySummaries.filter((r) => r.type === 'needs_review');
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
      `נתוני טופס 106 לא חולצו בצורה מספקת לשנות: ${insufficientDataYears.map((r) => r.year).join(', ')}`,
    );
  }
  if (years.length > 1) {
    overallReasons.push(
      `הבדיקה מכסה ${years.length} שנות מס: ${years.map((u) => u.year).sort((a, b) => b - a).join(', ')}`,
    );
  }

  // ── Overall result type ───────────────────────────────────────────────────
  const manualReviewRecommended = yearlySummaries.some((r) => r.manualReviewRecommended);

  let type: CaseResultType;
  if (positiveYears.length > 0 && positiveYears.some((r) => r.confidenceLevel !== 'low')) {
    type = 'potential_refund';
  } else if (reviewYears.length > 0 || positiveYears.length > 0 || manualReviewRecommended) {
    type = 'needs_review';
  } else {
    type = 'no_clear_indication';
  }

  // ── Overall confidence ────────────────────────────────────────────────────
  const confOrder: Record<ConfidenceLevel, number> = { high: 3, medium: 2, low: 1 };

  let confidenceLevel: ConfidenceLevel;
  if (positiveYears.length > 0) {
    const best = positiveYears.reduce((a, b) =>
      confOrder[a.confidenceLevel] >= confOrder[b.confidenceLevel] ? a : b,
    );
    confidenceLevel = best.confidenceLevel;
  } else if (reviewYears.length > 0) {
    const worst = reviewYears.reduce((a, b) =>
      confOrder[a.confidenceLevel] <= confOrder[b.confidenceLevel] ? a : b,
    );
    confidenceLevel = worst.confidenceLevel;
  } else {
    confidenceLevel = 'low';
  }

  if (yearsWithPriorDiffs.length > 0 && confidenceLevel === 'high') {
    confidenceLevel = 'medium';
  }

  // ── Aggregate refund range ────────────────────────────────────────────────
  let refundRange: RefundRange | undefined;
  if (type === 'potential_refund' && confidenceLevel !== 'low') {
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
        if (totalPotential >= 6000)      refundRange = 'above_6k';
        else if (totalPotential >= 2000) refundRange = '2k_to_6k';
        else                             refundRange = 'up_to_2k';
      }

      if (yearsWithPriorDiffs.length > 0 && refundRange === 'above_6k') {
        refundRange = '2k_to_6k';
      }
    }
  }

  // ── Aggregate missingData across all years (deduplicated) ─────────────────
  const allMissing = yearlySummaries.flatMap((r) => r.missingData);
  const missingData = [...new Set(allMissing)];

  // ── Aggregate ILS estimate across all years ───────────────────────────────
  const allEstimates = yearlySummaries
    .map((r) => r.estimatedRefundPotential ?? 0)
    .filter((v) => v > 0);
  const estimatedRefundAmountILS = allEstimates.length > 0
    ? allEstimates.reduce((sum, v) => sum + v, 0)
    : undefined;

  const sourceDocumentIds = years.flatMap((u) => u.documents.map((d) => d.id));

  return {
    type,
    confidenceLevel,
    refundRange,
    estimatedRefundAmountILS,
    yearlySummaries,
    crossYearWarnings,
    overallReasons,
    manualReviewRecommended,
    missingData,
    sourceDocumentIds,
  };
}
