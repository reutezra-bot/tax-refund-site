// ── Extraction model ──────────────────────────────────────────────────────────

/** All fields extractable from a Form 106 (טופס 106). */
export interface Form106ExtractedData {
  // MANDATORY
  taxYear: number | null;
  annualTaxableIncome: number | null;         // הכנסה חייבת שנתית (שדה 158)
  actualTaxWithheld: number | null;            // מס הכנסה שנוכה (שדה 42)
  annualTaxCreditPoints: number | null;        // נקודות זיכוי שנתיות
  workDays: number | null;                     // ימי עבודה (שדה 9)
  employeeId: string | null;                   // ת.ז.
  employerName: string | null;                 // שם המעסיק
  priorYearDifferencesIncluded: boolean | null; // האם יש הפרשים משנים קודמות
  priorYearDifferencesAmount: number | null;   // סכום ההפרשים (אם קיים)
  priorYearDifferencesYear: number | null;     // שנת ההפרשים (אם קיים)
  extractionConfidence: number;                // 0–1

  // HIGH-VALUE SUPPORTING
  section45ACredit: number | null;             // זיכוי סעיף 45א
  lifeInsuranceDeduction: number | null;       // ניכוי ביטוח חיים (שדה 100)
  pensionContributionsEmployee: number | null; // חלק עובד — פנסיה/קצבה
  providentFundContributionsEmployee: number | null;
  trainingFundEmployee: number | null;         // קרן השתלמות — עובד
  trainingFundEmployer: number | null;         // קרן השתלמות — מעסיק
  pensionableSalary: number | null;
  nationalInsuranceIncome: number | null;      // שכר חייב ב.ל.
  nationalInsuranceDeduction: number | null;   // ניכוי ביטוח לאומי
  healthInsuranceDeduction: number | null;     // ניכוי ביטוח בריאות
  memberFees: number | null;                   // דמי חבר

  // OPTIONAL ENRICHMENT
  overtimeIncome: number | null;               // שעות נוספות
  vehicleUsageValue: number | null;            // שווי שימוש ברכב
  taxFileNumber: string | null;                // תיק ניכויים
  rawTextSummary: string | null;               // תמצית טקסט / לצורכי ביקורת
  extractionWarnings: string[];

  // DEV-ONLY: per-field match evidence (undefined in production)
  _devMatchEvidence?: Record<string, FieldMatchEvidence>;
}

/** Evidence for a single extracted field — dev mode only. */
export interface FieldMatchEvidence {
  value: string | number | boolean | null;
  matchedSnippet: string | null;
  ruleDescription: string;
}

// ── Derived professional signals ──────────────────────────────────────────────

export interface Form106Signals {
  /** Work days < 210 → likely partial-year employment */
  partialYearEmploymentSignal: boolean;
  /** Tax withheld is material (> 7% of taxable income) */
  meaningfulTaxWithholdingSignal: boolean;
  /** Form contains prior-year retroactive differences */
  priorYearComplexitySignal: boolean;
  /** Deductions / credits visible in the form (45A, life insurance, pension) */
  deductionSupportSignal: boolean;
  /** Extraction quality is low or critical fields are missing */
  lowConfidenceSignal: boolean;
}

/** Derive professional analysis signals from extracted Form 106 data. */
export function deriveSignals(data: Form106ExtractedData): Form106Signals {
  return {
    partialYearEmploymentSignal: data.workDays !== null && data.workDays < 210,
    meaningfulTaxWithholdingSignal:
      data.actualTaxWithheld !== null &&
      data.annualTaxableIncome !== null &&
      data.annualTaxableIncome > 0 &&
      data.actualTaxWithheld / data.annualTaxableIncome > 0.06,
    priorYearComplexitySignal: data.priorYearDifferencesIncluded === true,
    deductionSupportSignal:
      data.section45ACredit !== null ||
      data.lifeInsuranceDeduction !== null ||
      (data.pensionContributionsEmployee !== null &&
        data.pensionContributionsEmployee > 0),
    lowConfidenceSignal:
      data.extractionConfidence < 0.70 ||
      data.annualTaxableIncome === null ||
      data.actualTaxWithheld === null,
  };
}
