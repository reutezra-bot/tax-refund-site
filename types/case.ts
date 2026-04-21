import type { UploadedDocument } from './documents';

// ── Per-year questionnaire ────────────────────────────────────────────────────

export type SpecialPeriod = 'unemployment' | 'unpaidLeave' | 'reserveDuty' | 'maternityLeave';

export interface YearAnswers {
  year: number;
  multipleEmployers: boolean | null;
  partialYear: boolean | null;
  specialPeriods: SpecialPeriod[];
  hasLifeInsurance: boolean | null;
  lifeInsuranceMonthlyEstimate?: number;
  hasDonations: boolean | null;
  donationsYearlyEstimate?: number;
  selfEmployedOrForeignIncome: boolean | null;
}

// ── Per-year unit ─────────────────────────────────────────────────────────────

export interface TaxYearUnit {
  year: number;
  /** Form 106 documents belonging to this year only. */
  documents: UploadedDocument[];
  /** Year-specific questionnaire answers. Null until submitted. */
  answers: YearAnswers | null;
}

// ── Result types ──────────────────────────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type RefundRange = 'up_to_2k' | '2k_to_6k' | 'above_6k';

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

/** Result type for a single tax year. */
export type AnnualResultType = 'potential_refund' | 'needs_review' | 'no_clear_indication' | 'insufficient_data';

/** Dev-only proof of which data source drove the result. Populated only in development. */
export interface ResultSourceInfo {
  docScore: number;
  questionnaireScore: number;
  docDataPercentage: number;
  extractedFields: string[];
  positiveGateStatus:
    | 'passed'
    | 'blocked_no_form'
    | 'blocked_no_numeric_data'
    | 'blocked_low_confidence'
    | 'blocked_no_refund_potential';
  extractionConfidence: number;
}

export interface AnnualResult {
  year: number;
  type: AnnualResultType;
  confidenceLevel: ConfidenceLevel;
  /** Only set when confidence is medium or high and extraction succeeded. */
  refundRange?: RefundRange;
  /** Internal ILS estimate — used for cross-year aggregation, never shown directly to users. */
  estimatedRefundPotential?: number;
  reasons: string[];
  warnings: string[];
  manualReviewRecommended: boolean;
  priorYearDifferencesDetected: boolean;
  missingData: string[];
  /** Dev-only: proof of result source attribution. Not present in production. */
  _devInfo?: ResultSourceInfo;
}

// ── Case-level result ─────────────────────────────────────────────────────────

export type CaseResultType = 'potential_refund' | 'needs_review' | 'no_clear_indication';

export interface CaseResult {
  type: CaseResultType;
  confidenceLevel: ConfidenceLevel;
  /** Only set when overall confidence is medium or high. */
  refundRange?: RefundRange;
  yearlySummaries: AnnualResult[];
  crossYearWarnings: string[];
  overallReasons: string[];
  manualReviewRecommended: boolean;
  missingData: string[];
  /** All source document IDs — used for staleness detection. */
  sourceDocumentIds: string[];
}

// ── Case ──────────────────────────────────────────────────────────────────────

export interface CheckCase {
  caseId: string;
  years: TaxYearUnit[];
  result: CaseResult | null;
}
