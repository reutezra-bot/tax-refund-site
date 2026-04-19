/**
 * Rule-based Form 106 field extractor.
 *
 * Each field is tried against an ordered list of named patterns. The first
 * match wins. In development mode every field also records the matched text
 * snippet and the rule name that fired, surfaced in ResultSourceDebug.
 *
 * Pattern naming convention:
 *   field_NUMBER_ltr  — field number before value  (standard digital PDF)
 *   field_NUMBER_rtl  — value before field number   (RTL extraction artifact)
 *   label_HEB_ltr     — Hebrew label before value
 *   label_HEB_rtl     — value before Hebrew label
 */

import type { Form106ExtractedData, FieldMatchEvidence } from '@/lib/form106-parser';
import type { ExtractedTextResult } from './extract-text';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface ExtractionSuccess {
  ok: true;
  data: Form106ExtractedData;
}
export interface ExtractionFailure {
  ok: false;
  reason: string;
}
export type ExtractionOutcome = ExtractionSuccess | ExtractionFailure;

// ── Named pattern type ────────────────────────────────────────────────────────

interface NamedPattern {
  re: RegExp;
  desc: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a Hebrew-formatted number string: "156,480" → 156480, "13.95" → 13.95 */
function parseAmount(raw: string): number | null {
  if (!raw) return null;

  const cleaned = raw.replace(/,/g, '').trim();

  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;

  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Extract surrounding context snippet (up to 30 chars each side). */
function snippet(text: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - 30);
  const end = Math.min(text.length, matchIndex + matchLength + 30);
  return text.substring(start, end).replace(/\s+/g, ' ').trim();
}

/**
 * Try named patterns against `text`. Returns value + evidence on first match.
 * Each pattern must have one capture group: the raw number string.
 */
function findAmount(
  text: string,
  patterns: NamedPattern[],
): { value: number | null; evidence: FieldMatchEvidence | null } {
  for (const { re, desc } of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const n = parseAmount(m[1]);
      if (n !== null) {
        return {
          value: n,
          evidence: IS_DEV
            ? { value: n, matchedSnippet: snippet(text, m.index ?? 0, m[0].length), ruleDescription: desc }
            : null,
        };
      }
    }
  }
  return { value: null, evidence: null };
}

/** Same as findAmount but for string captures (IDs, names). */
function findString(
  text: string,
  patterns: NamedPattern[],
): { value: string | null; evidence: FieldMatchEvidence | null } {
  for (const { re, desc } of patterns) {
    const m = text.match(re);
    if (m?.[1]?.trim()) {
      const v = m[1].trim();
      return {
        value: v,
        evidence: IS_DEV
          ? { value: v, matchedSnippet: snippet(text, m.index ?? 0, m[0].length), ruleDescription: desc }
          : null,
      };
    }
  }
  return { value: null, evidence: null };
}


/** Range-check a numeric value; returns null if out of range. */
function plausibleAmount(n: number | null, min = 100, max = 10_000_000): number | null {
  return n !== null && n >= min && n <= max ? n : null;
}

/** Produce a fully-null Form 106 result for scanned / unreadable files. */
function unreadableResult(warnings: string[], confidence: number): Form106ExtractedData {
  return {
    taxYear: null,
    annualTaxableIncome: null,
    actualTaxWithheld: null,
    annualTaxCreditPoints: null,
    workDays: null,
    employeeId: null,
    employerName: null,
    priorYearDifferencesIncluded: null,
    priorYearDifferencesAmount: null,
    priorYearDifferencesYear: null,
    extractionConfidence: confidence,
    section45ACredit: null,
    lifeInsuranceDeduction: null,
    pensionContributionsEmployee: null,
    providentFundContributionsEmployee: null,
    trainingFundEmployee: null,
    trainingFundEmployer: null,
    pensionableSalary: null,
    nationalInsuranceIncome: null,
    nationalInsuranceDeduction: null,
    healthInsuranceDeduction: null,
    memberFees: null,
    overtimeIncome: null,
    vehicleUsageValue: null,
    taxFileNumber: null,
    rawTextSummary: null,
    extractionWarnings: warnings,
  };
}

// ── Named pattern sets ────────────────────────────────────────────────────────
//
// Notation: AMT = capture group for an ILS amount (digits + optional comma).
// The [^\d]{0,N} gap is intentionally permissive to survive Hebrew whitespace
// variations and occasional newlines within cells.

const AMT = '(\\d[\\d,]*)';
const AMT_DECIMAL = '(\\d+\\.\\d+|\\d[\\d,]*)'; // also handles "13.95"

// ── Tax year ──────────────────────────────────────────────────────────────────
const TAX_YEAR_PATTERNS: NamedPattern[] = [
  { re: /טופס\s+106\s+לשנת\s+ה?מס\s*(20[12]\d)/, desc: 'header_טופס_106' },
  { re: /טופס\s+106[^\d]{0,40}(20[12]\d)/, desc: 'header_טופס_106_near_year' },
  { re: /שנת\s+ה?מס[^\d]{0,20}(20[12]\d)/, desc: 'label_שנת_מס_ltr' },
  { re: /\b(20[12]\d)\b(?=[^\n]{0,40}$)/m, desc: 'line_end_year_fallback' },
];

// ── Annual taxable income — field 158 ─────────────────────────────────────────
// "משכורת חייבת במס" is the Hebrew label for field 172/158 in salary-based Form 106.
// It must be first: "(172/158)" in the page-1 list contains digits that break [^\d],
// so the regex skips that occurrence and finds the value on page 2.
const TAXABLE_INCOME_PATTERNS: NamedPattern[] = [

{
  re: /משכורת\s+ותשלומים\s+החייבים\s+בשיעורי\s+מס\s+רגילים\s*([\d,]+?)\s*158\b/,
  desc: 'label_משכורת_ותשלומים_רגילים_rtl',
},
{
  re: /משכורת\s+ותשלומים.*?([\d,]+?)\s*158\b/,
  desc: 'fallback_משכורת_158',
},
{
  re: /([\d,]+?)\s*158\b/,
  desc: 'bare_amount_before_158',
},
  { re: new RegExp(`משכורת\\s+חייבת\\s+במס[^\\d]{0,60}${AMT}`), desc: 'label_משכורת_חייבת_במס_ltr' },
  { re: new RegExp(`\\b172\\/158\\b[^\\d]{0,80}${AMT}`), desc: 'field_172_158_ltr' },
  { re: new RegExp(`\\b158\\b[^\\d]{0,80}${AMT}`), desc: 'field_158_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,80}\\b158\\b`), desc: 'field_158_rtl' },
  { re: new RegExp(`הכנסה\\s+חייבת[^\\d]{0,80}${AMT}`), desc: 'label_הכנסה_חייבת_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,80}הכנסה\\s+חייבת`), desc: 'label_הכנסה_חייבת_rtl' },
  { re: new RegExp(`סה"כ\\s+הכנסה\\s+חייבת[^\\d]{0,80}${AMT}`), desc: 'label_סהכ_הכנסה_חייבת_ltr' },
  {
  re: new RegExp(`משכורת\\s+ותשלומים\\s+החייבים\\s+בשיעורי\\s+מס\\s+רגילים\\s+${AMT}\\s+158\\b`),
  desc: 'label_משכורת_ותשלומים_רגילים_rtl',
},
];

// ── Tax withheld — field 42 ───────────────────────────────────────────────────
// Use multiline mode; \s boundary prevents matching 142, 420, 242, etc.
const TAX_WITHHELD_PATTERNS: NamedPattern[] = [
  // Exact match: field number 42 surrounded by non-digit context (space, parens, or markdown pipe)
  {
  re: /מס\s+הכנסה\s*([\d,]+?)\s*0?42\b/,
  desc: 'label_מס_הכנסה_rtl',
},
{
  re: /מס\s+הכנסה.*?([\d,]+?)\s*0?42\b/,
  desc: 'fallback_מס_הכנסה_042',
},
  {
  re: /מס\s+הכנסה\s+([\d,]+)\s+0?42\b/,
  desc: 'label_מס_הכנסה_rtl',
},
  { re: new RegExp(`(?:^|\\s|\\(|\\|)42(?:$|\\s|\\)|\\|)[^\\d]{0,80}${AMT}`, 'm'), desc: 'field_42_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,80}(?:^|\\s|\\(|\\|)42(?:$|\\s|\\)|\\|)`, 'm'), desc: 'field_42_rtl' },
  // Hebrew labels — "ניכוי למס הכנסה" (with ל) is the common label in salary-based forms
  { re: new RegExp(`ניכוי\\s+למס\\s+הכנסה[^\\d]{0,60}${AMT}`), desc: 'label_ניכוי_למס_הכנסה_ltr' },
  { re: new RegExp(`מס\\s+הכנסה\\s+שנוכ[^\\d]{0,80}${AMT}`), desc: 'label_מס_הכנסה_שנוכה_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,80}מס\\s+הכנסה\\s+שנוכ`), desc: 'label_מס_הכנסה_שנוכה_rtl' },
  { re: new RegExp(`מס\\s+הכנסה[^\\d]{0,40}בפועל[^\\d]{0,40}${AMT}`), desc: 'label_מס_בפועל_ltr' },
  { re: new RegExp(`ניכוי\\s+מס\\s+הכנסה[^\\d]{0,60}${AMT}`), desc: 'label_ניכוי_מס_ltr' },
  {
  re: new RegExp(`מס\\s+הכנסה\\s+${AMT}\\s+0?42\\b`),
  desc: 'label_מס_הכנסה_rtl',
},
];

// ── Work days — field 9 ───────────────────────────────────────────────────────
// Field 9 in Form 106. Value is 1–366 (3 digits max).
// We deliberately keep the field-9 patterns but also add label-only patterns
// because in some PDFs field 9 doesn't appear as a standalone number.
const WORK_DAYS_PATTERNS: NamedPattern[] = [
  // Hebrew label is the most reliable signal
  { re: /ימי\s+עבודה[^\d]{0,80}(\d{1,3})(?!\d)/, desc: 'label_ימי_עבודה_ltr' },
  { re: /(\d{1,3})(?!\d)[^\d]{0,80}ימי\s+עבודה/, desc: 'label_ימי_עבודה_rtl' },
  { re: /מספר\s+ימי\s+עבודה[^\d]{0,80}(\d{1,3})(?!\d)/, desc: 'label_מספר_ימי_עבודה_ltr' },
  { re: /(\d{1,3})(?!\d)[^\d]{0,80}מספר\s+ימי\s+עבודה/, desc: 'label_מספר_ימי_עבודה_rtl' },
  // Field number 9 as a standalone code — use tight boundary
  { re: /(?:^|\n|\s)9(?:\s|:|\.|$)[^\d]{0,60}(\d{1,3})(?!\d)/m, desc: 'field_9_ltr' },
  { re: /(\d{1,3})(?!\d)[^\d]{0,60}(?:^|\n|\s)9(?:\s|:|\.|$)/m, desc: 'field_9_rtl' },
];

// ── Credit points — can be decimal like 13.95 ────────────────────────────────
const CREDIT_POINTS_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`נקודות\\s+זיכוי[^\\d.]{0,60}${AMT_DECIMAL}`), desc: 'label_נקודות_זיכוי_ltr' },
  { re: new RegExp(`${AMT_DECIMAL}[^\\d.]{0,60}נקודות\\s+זיכוי`), desc: 'label_נקודות_זיכוי_rtl' },
  { re: new RegExp(`זיכוי\\s+נקודות[^\\d.]{0,60}${AMT_DECIMAL}`), desc: 'label_זיכוי_נקודות_ltr' },
  // Field 48 in some form versions holds credit points
  { re: new RegExp(`\\b48\\b[^\\d]{0,60}${AMT_DECIMAL}`), desc: 'field_48_ltr' },
];

// ── Employer name ─────────────────────────────────────────────────────────────
// Government forms (e.g. Finance Ministry) use "שם המשרד" or "מעביד" instead of "שם המעסיק".
const EMPLOYER_NAME_PATTERNS: NamedPattern[] = [
  {
    re: /חברה\s*:?\s*(?:\d+\s+)?([A-Za-zא-ת"'׳״\-\.\s]{2,80}?)(?=\s+לעובד\s+מס'?|\s+דף\s+מספר|\n|$)/,
    desc: 'label_חברה',
  },
  { re: /שם\s+המעסיק\s*:?\s*(.{2,50}?)(?:\n|ת\.ז|מספר|$)/, desc: 'label_שם_המעסיק' },
  { re: /שם\s+המשרד\s*:?\s*(.{2,50}?)(?:\n|ת\.ז|מספר|$)/, desc: 'label_שם_המשרד' },
  { re: /מעביד\s*:?\s*(.{2,50}?)(?:\n|ת\.ז|מספר|$)/, desc: 'label_מעביד' },
];

// ── Employee ID ───────────────────────────────────────────────────────────────
const EMPLOYEE_ID_PATTERNS: NamedPattern[] = [
  { re: /ת\.ז\.?\s*:?\s*(\d{7,9})/, desc: 'label_תז' },
  { re: /זהות\s*:?\s*(\d{7,9})/, desc: 'label_זהות' },
  { re: /תעודת\s+זהות\s*:?\s*(\d{7,9})/, desc: 'label_תעודת_זהות' },
];

// ── Tax file number ───────────────────────────────────────────────────────────
const TAX_FILE_PATTERNS: NamedPattern[] = [
  { re: /מספר\s+תיק\s*:?\s*(\d{5,15})/, desc: 'label_מספר_תיק' },
  { re: /תיק\s+ניכויים\s*:?\s*(\d{5,15})/, desc: 'label_תיק_ניכויים' },
];

// ── Section 45A credit ────────────────────────────────────────────────────────
// שדה 045א — tax credit for pension/life insurance contributions under section 45A.
// Real forms often say "זיכוי מס סעיף 45א" with "מס" between "זיכוי" and "סעיף".
const SECTION_45A_PATTERNS: NamedPattern[] = [
  // "זיכוי מס סעיף 45א" — has "מס" between זיכוי and סעיף
  { re: new RegExp(`זיכוי\\s+מס\\s+סעיף\\s+45[^\\d]{0,60}${AMT}`), desc: 'label_זיכוי_מס_סעיף_45_ltr' },
  { re: new RegExp(`זיכוי\\s+(?:לפי\\s+)?סעיף\\s+45[^\\d]{0,60}${AMT}`), desc: 'label_זיכוי_סעיף_45_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}זיכוי\\s+(?:לפי\\s+)?סעיף\\s+45`), desc: 'label_זיכוי_סעיף_45_rtl' },
  { re: new RegExp(`45א[^\\d]{0,60}${AMT}`), desc: 'label_45א_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}45א`), desc: 'label_45א_rtl' },
  // Field code 045א / 45a
  { re: new RegExp(`\\b045א\\b[^\\d]{0,60}${AMT}`), desc: 'field_045א_ltr' },
  { re: new RegExp(`\\b45\\b[^\\d]{0,40}זיכו[^\\d]{0,40}${AMT}`), desc: 'field_45_credit_ltr' },
];

// ── Life insurance deduction — field 100 ─────────────────────────────────────
// Real salary forms use "חסכון לביטוחי חיים" (with ל and י suffix).
// This label must come before field_100_ltr because the value (e.g. ₪100) and the
// field code (100) are the same number — field_100_ltr would otherwise grab the
// next field's code (e.g. 42) as the value.
const LIFE_INS_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`חסכון\\s+לביטוחי?\\s+חיים[^\\d]{0,60}${AMT}`), desc: 'label_חסכון_לביטוחי_חיים_ltr' },
  { re: new RegExp(`ניכוי\\s+ביטוח\\s+חיים[^\\d]{0,60}${AMT}`), desc: 'label_ניכוי_ביטוח_חיים_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}ניכוי\\s+ביטוח\\s+חיים`), desc: 'label_ניכוי_ביטוח_חיים_rtl' },
  // "ביטוחי חיים" matches within "לביטוחי חיים" — use as fallback before field code
  { re: new RegExp(`ביטוחי?\\s+חיים[^\\d]{0,60}${AMT}`), desc: 'label_ביטוחי_חיים_ltr' },
  // Field number 100 is the official code — only after label patterns have failed
  { re: new RegExp(`\\b100\\b[^\\d]{0,80}${AMT}`), desc: 'field_100_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,80}\\b100\\b(?!\\d)`), desc: 'field_100_rtl' },
];

// ── Pension contributions (employee) ─────────────────────────────────────────
const PENSION_EMPLOYEE_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`ניכוי\\s+קצבה[^\\d]{0,60}${AMT}`), desc: 'label_ניכוי_קצבה_ltr' },
  { re: new RegExp(`ניכוי\\s+פנסיה[^\\d]{0,60}${AMT}`), desc: 'label_ניכוי_פנסיה_ltr' },
  { re: new RegExp(`קצבה\\s+עובד[^\\d]{0,60}${AMT}`), desc: 'label_קצבה_עובד_ltr' },
  { re: new RegExp(`הפרשות\\s+לפנסיה[^\\d]{0,60}${AMT}`), desc: 'label_הפרשות_פנסיה_ltr' },
];

// ── National insurance ────────────────────────────────────────────────────────
const NATIONAL_INS_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`ניכוי\\s+ביטוח\\s+לאומי[^\\d]{0,60}${AMT}`), desc: 'label_ניכוי_בל_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}ניכוי\\s+ביטוח\\s+לאומי`), desc: 'label_ניכוי_בל_rtl' },
  { re: new RegExp(`ביטוח\\s+לאומי[^\\d]{0,60}${AMT}`), desc: 'label_ביטוח_לאומי_ltr' },
];

// ── Health insurance ──────────────────────────────────────────────────────────
const HEALTH_INS_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`ניכוי\\s+ביטוח\\s+בריאות[^\\d]{0,60}${AMT}`), desc: 'label_ניכוי_בריאות_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}ניכוי\\s+ביטוח\\s+בריאות`), desc: 'label_ניכוי_בריאות_rtl' },
  { re: new RegExp(`ביטוח\\s+בריאות[^\\d]{0,60}${AMT}`), desc: 'label_ביטוח_בריאות_ltr' },
];

// ── Training fund ─────────────────────────────────────────────────────────────
const TRAINING_FUND_EMP_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`קרן\\s+השתלמות\\s+עובד[^\\d]{0,60}${AMT}`), desc: 'label_קה_עובד_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}קרן\\s+השתלמות\\s+עובד`), desc: 'label_קה_עובד_rtl' },
];
const TRAINING_FUND_EMPR_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`קרן\\s+השתלמות\\s+מעסיק[^\\d]{0,60}${AMT}`), desc: 'label_קה_מעסיק_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}קרן\\s+השתלמות\\s+מעסיק`), desc: 'label_קה_מעסיק_rtl' },
];

// ── Overtime ──────────────────────────────────────────────────────────────────
const OVERTIME_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`שעות\\s+נוספות[^\\d]{0,60}${AMT}`), desc: 'label_שעות_נוספות_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}שעות\\s+נוספות`), desc: 'label_שעות_נוספות_rtl' },
];

// ── Vehicle usage ─────────────────────────────────────────────────────────────
const VEHICLE_PATTERNS: NamedPattern[] = [
  { re: new RegExp(`שווי\\s+שימוש\\s+ברכב[^\\d]{0,60}${AMT}`), desc: 'label_שווי_רכב_ltr' },
  { re: new RegExp(`${AMT}[^\\d]{0,60}שווי\\s+שימוש\\s+ברכב`), desc: 'label_שווי_רכב_rtl' },
];

// ── Prior-year differences ────────────────────────────────────────────────────
const PRIOR_YEAR_PRESENCE = /הפרשים?\s+(?:משנ[ות]\s+)?קודמ|הפרשי\s+שכר|שנים\s+קודמות|תיקון\s+שנת/i;

const PRIOR_YEAR_YEAR_PATTERNS: NamedPattern[] = [
  { re: /(?:הפרש(?:ים)?|תיקון)\s*(?:משנת?|לשנת?|שנת?)\s*(20[12]\d)/, desc: 'label_הפרש_שנת_ltr' },
  { re: /(?:שנת?)\s*(20[12]\d)\s*(?:הפרש|תיקון)/, desc: 'label_שנת_הפרש_rtl' },
  // "הפרשים 2022" — year immediately follows keyword
  { re: /הפרשים?\s+(20[12]\d)/, desc: 'label_הפרשים_שנה_bare' },
  // "לשנת 2022" preceded by prior-year context within 100 chars
  { re: /(?:הפרש|קודמ)[^\d]{0,100}(20[12]\d)/, desc: 'label_context_year' },
];

function normalizeEmployerName(value: string | null): string | null {
  if (!value) return null;

  const v = value.replace(/\s+/g, ' ').trim();

  if (/^[\d,\-\s]+$/.test(v)) return null;
  if (!/[A-Za-zא-ת]/.test(v)) return null;
  if (v.length < 2) return null;

  return v;
}
// ── Main extractor ────────────────────────────────────────────────────────────

export function extractForm106FromText(
  extracted: ExtractedTextResult,
  fileName: string,
  expectedYear?: number,
): ExtractionOutcome {
  const warnings: string[] = [];

  // ── Unreadable file types ─────────────────────────────────────────────────
  if (extracted.isImageFile) {
    warnings.push('הקובץ הוא תמונה סרוקה — לא ניתן לחלץ נתונים ללא OCR; נדרשת בדיקה ידנית');
    return { ok: true, data: unreadableResult(warnings, 0.05) };
  }
  if (extracted.isLikelyScanned) {
    warnings.push('הטופס נראה כ-PDF סרוק — הטקסט שחולץ קצר מדי לניתוח; נדרשת בדיקה ידנית');
    return { ok: true, data: unreadableResult(warnings, 0.1) };
  }

  const raw = extracted.text;
  const ev: Record<string, FieldMatchEvidence> = {};

  // ── Tax year ──────────────────────────────────────────────────────────────
let taxYear: number | null = null;

for (const { re, desc } of TAX_YEAR_PATTERNS) {
  const m = raw.match(re);
  if (m) {
    const y = parseInt(m[1], 10);
    if (y >= 2015 && y <= new Date().getFullYear()) {
      taxYear = y;
      if (IS_DEV) {
        ev.taxYear = {
          value: y,
          matchedSnippet: snippet(raw, m.index ?? 0, m[0].length),
          ruleDescription: desc,
        };
      }
      break;
    }
  }
}

if (!taxYear && expectedYear && raw.includes(String(expectedYear))) {
  taxYear = expectedYear;
  if (IS_DEV) {
    ev.taxYear = {
      value: expectedYear,
      matchedSnippet: `year ${expectedYear} found in raw text`,
      ruleDescription: 'expected_year_found_in_raw',
    };
  }
}

if (!taxYear && expectedYear) {
  taxYear = expectedYear;
  if (IS_DEV) {
    ev.taxYear = {
      value: expectedYear,
      matchedSnippet: 'fallback from selected case year',
      ruleDescription: 'expected_year_fallback',
    };
  }
}

if (!taxYear) {
  warnings.push('שנת המס לא זוהתה בטופס — אנא ודא את פרטי הטופס');
}

if (expectedYear && taxYear && taxYear !== expectedYear) {
  warnings.push(`שנת המס שחולצה (${taxYear}) שונה משנת הקייס (${expectedYear})`);
}
  // ── Annual taxable income ─────────────────────────────────────────────────
  const { value: rawIncome, evidence: incomeEv } = findAmount(raw, TAXABLE_INCOME_PATTERNS);
  const annualTaxableIncome = plausibleAmount(rawIncome, 10_000, 10_000_000);
  if (IS_DEV && incomeEv) ev.annualTaxableIncome = { ...incomeEv, value: annualTaxableIncome };
  if (annualTaxableIncome === null && rawIncome !== null)
    warnings.push(`הכנסה חייבת שנתית שזוהתה (${rawIncome}) מחוץ לטווח הסביר — מתעלמים`);
  if (annualTaxableIncome === null)
    warnings.push('שדה הכנסה חייבת שנתית (שורה 158) לא זוהה בטופס');

  // ── Tax withheld ──────────────────────────────────────────────────────────
  const { value: rawTax, evidence: taxEv } = findAmount(raw, TAX_WITHHELD_PATTERNS);
  const actualTaxWithheld = plausibleAmount(rawTax, 0, 5_000_000);
  if (IS_DEV && taxEv) ev.actualTaxWithheld = { ...taxEv, value: actualTaxWithheld };
  if (actualTaxWithheld === null)
    warnings.push('שדה מס הכנסה שנוכה (שורה 42) לא זוהה בטופס');

  // ── Work days ─────────────────────────────────────────────────────────────
  const { value: rawDays, evidence: daysEv } = findAmount(raw, WORK_DAYS_PATTERNS);
  let workDays: number | null = rawDays !== null && rawDays >= 1 && rawDays <= 366 ? rawDays : null;
  if (IS_DEV && daysEv) ev.workDays = { ...daysEv, value: workDays };

  // ── Credit points ─────────────────────────────────────────────────────────
  const { value: cpRaw, evidence: cpEv } = findAmount(raw, CREDIT_POINTS_PATTERNS);
  const annualTaxCreditPoints = cpRaw !== null && cpRaw >= 0.5 && cpRaw <= 20 ? cpRaw : null;
  if (IS_DEV && cpEv) ev.annualTaxCreditPoints = { ...cpEv, value: annualTaxCreditPoints };

  // ── Identifiers ───────────────────────────────────────────────────────────
const { value: rawEmployerName, evidence: empNameEv } = findString(raw, EMPLOYER_NAME_PATTERNS);
const employerName = normalizeEmployerName(rawEmployerName);
if (IS_DEV && empNameEv) ev.employerName = { ...empNameEv, value: employerName };
  const { value: employeeId, evidence: empIdEv } = findString(raw, EMPLOYEE_ID_PATTERNS);
  if (IS_DEV && empIdEv) ev.employeeId = empIdEv;
  const { value: taxFileNumber, evidence: fileEv } = findString(raw, TAX_FILE_PATTERNS);
  if (IS_DEV && fileEv) ev.taxFileNumber = fileEv;

  // ── Prior-year differences ────────────────────────────────────────────────
  const priorYearDifferencesIncluded = PRIOR_YEAR_PRESENCE.test(raw);
  let priorYearDifferencesYear: number | null = null;
  if (priorYearDifferencesIncluded) {
    warnings.push('בטופס זוהו הפרשים לשנים קודמות — נדרשת זהירות בפרשנות הנתונים');
    for (const { re, desc } of PRIOR_YEAR_YEAR_PATTERNS) {
      const m = raw.match(re);
      if (m) {
        const y = parseInt(m[1], 10);
        if (y >= 2015 && y < (taxYear ?? new Date().getFullYear())) {
          priorYearDifferencesYear = y;
          if (IS_DEV) ev.priorYearDifferencesYear = { value: y, matchedSnippet: snippet(raw, m.index ?? 0, m[0].length), ruleDescription: desc };
          break;
        }
      }
    }
    if (IS_DEV) ev.priorYearDifferencesIncluded = { value: true, matchedSnippet: null, ruleDescription: 'PRIOR_YEAR_PRESENCE regex' };
  }

  // ── Supporting deduction fields ───────────────────────────────────────────
  const { value: rawSection45A, evidence: s45Ev } = findAmount(raw, SECTION_45A_PATTERNS);
  const section45ACredit = plausibleAmount(rawSection45A, 0, 100_000);
  if (IS_DEV && s45Ev) ev.section45ACredit = { ...s45Ev, value: section45ACredit };

  const { value: rawLifeIns, evidence: lifeEv } = findAmount(raw, LIFE_INS_PATTERNS);
  const lifeInsuranceDeduction = plausibleAmount(rawLifeIns, 1, 200_000);
  if (IS_DEV && lifeEv) ev.lifeInsuranceDeduction = { ...lifeEv, value: lifeInsuranceDeduction };

  const { value: rawPension, evidence: pensionEv } = findAmount(raw, PENSION_EMPLOYEE_PATTERNS);
  const pensionContributionsEmployee = plausibleAmount(rawPension, 100, 500_000);
  if (IS_DEV && pensionEv) ev.pensionContributionsEmployee = { ...pensionEv, value: pensionContributionsEmployee };

  const { value: rawNatIns, evidence: natEv } = findAmount(raw, NATIONAL_INS_PATTERNS);
  const nationalInsuranceDeduction = plausibleAmount(rawNatIns, 100, 500_000);
  if (IS_DEV && natEv) ev.nationalInsuranceDeduction = { ...natEv, value: nationalInsuranceDeduction };

  const { value: rawHealthIns, evidence: healthEv } = findAmount(raw, HEALTH_INS_PATTERNS);
  const healthInsuranceDeduction = plausibleAmount(rawHealthIns, 100, 200_000);
  if (IS_DEV && healthEv) ev.healthInsuranceDeduction = { ...healthEv, value: healthInsuranceDeduction };

  const { value: rawTrainEmp, evidence: trainEmpEv } = findAmount(raw, TRAINING_FUND_EMP_PATTERNS);
  const trainingFundEmployee = plausibleAmount(rawTrainEmp, 100, 500_000);
  if (IS_DEV && trainEmpEv) ev.trainingFundEmployee = { ...trainEmpEv, value: trainingFundEmployee };

  const { value: rawTrainEmpr, evidence: trainEmprEv } = findAmount(raw, TRAINING_FUND_EMPR_PATTERNS);
  const trainingFundEmployer = plausibleAmount(rawTrainEmpr, 100, 500_000);
  if (IS_DEV && trainEmprEv) ev.trainingFundEmployer = { ...trainEmprEv, value: trainingFundEmployer };

  const { value: rawOT, evidence: otEv } = findAmount(raw, OVERTIME_PATTERNS);
  const overtimeIncome = plausibleAmount(rawOT, 100, 2_000_000);
  if (IS_DEV && otEv) ev.overtimeIncome = { ...otEv, value: overtimeIncome };

  const { value: rawVeh, evidence: vehEv } = findAmount(raw, VEHICLE_PATTERNS);
  const vehicleUsageValue = plausibleAmount(rawVeh, 100, 500_000);
  if (IS_DEV && vehEv) ev.vehicleUsageValue = { ...vehEv, value: vehicleUsageValue };

  // ── Extraction confidence ─────────────────────────────────────────────────
  const criticalCount = [taxYear, annualTaxableIncome, actualTaxWithheld].filter(
    (v) => v !== null,
  ).length;
  const extractionConfidence =
    criticalCount === 3 ? 0.88 :
    criticalCount === 2 ? 0.60 :
    criticalCount === 1 ? 0.30 : 0.10;

  if (criticalCount < 2) {
    warnings.push('שדות מפתח לא חולצו — ייתכן שהטופס בפורמט שאינו נתמך; נדרשת בדיקה ידנית');
  }

  // Raw text summary: full text in dev, summary in production
  const rawTextSummary = IS_DEV
    ? raw.substring(0, 4000)
    : `Extracted from ${fileName} (${raw.length} chars, ${extracted.pageCount} pages)`;

  return {
    ok: true,
    data: {
      taxYear,
      annualTaxableIncome,
      actualTaxWithheld,
      annualTaxCreditPoints,
      workDays,
      employeeId,
      employerName,
      priorYearDifferencesIncluded,
      priorYearDifferencesAmount: null,
      priorYearDifferencesYear,
      extractionConfidence,
      section45ACredit,
      lifeInsuranceDeduction,
      pensionContributionsEmployee,
      providentFundContributionsEmployee: null,
      trainingFundEmployee,
      trainingFundEmployer,
      pensionableSalary: null,
      nationalInsuranceIncome: null,
      nationalInsuranceDeduction,
      healthInsuranceDeduction,
      memberFees: null,
      overtimeIncome,
      vehicleUsageValue,
      taxFileNumber,
      rawTextSummary,
      extractionWarnings: warnings,
      ...(IS_DEV && Object.keys(ev).length > 0 ? { _devMatchEvidence: ev } : {}),
    },
  };
}
