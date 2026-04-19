import type { Form106ExtractedData } from '@/lib/form106-parser';

export interface ValidationResult {
  isUsable: boolean;
  criticalErrors: string[];
  warnings: string[];
}

const CURRENT_YEAR = new Date().getFullYear();

export function validateForm106(data: Form106ExtractedData): ValidationResult {
  const criticalErrors: string[] = [];
  const warnings: string[] = [];

  if (data.taxYear === null) {
    criticalErrors.push('שנת המס חסרה — לא ניתן לחשב את חבות המס');
  } else if (data.taxYear < 2015 || data.taxYear > CURRENT_YEAR) {
    criticalErrors.push(`שנת מס ${data.taxYear} מחוץ לטווח הנתמך`);
  }

  if (data.annualTaxableIncome === null) {
    criticalErrors.push('הכנסה חייבת שנתית (שדה 158) חסרה');
  } else if (data.annualTaxableIncome < 0) {
    criticalErrors.push('הכנסה חייבת שנתית שלילית — ייתכן שגיאה בחילוץ');
  } else if (data.annualTaxableIncome > 5_000_000) {
    warnings.push('הכנסה חייבת שנתית גבוהה מאוד — אנא ודא את הנתון');
  }

  if (data.actualTaxWithheld === null) {
    criticalErrors.push('מס הכנסה שנוכה (שדה 42) חסר');
  } else if (data.actualTaxWithheld < 0) {
    criticalErrors.push('מס שנוכה שלילי — ייתכן שגיאה בחילוץ');
  }

  if (
    data.annualTaxableIncome !== null &&
    data.actualTaxWithheld !== null &&
    data.annualTaxableIncome > 0
  ) {
    const effectiveRate = data.actualTaxWithheld / data.annualTaxableIncome;
    if (effectiveRate > 0.60) {
      warnings.push('שיעור המס האפקטיבי גבוה מ-60% — אנא ודא את נכונות הנתונים');
    }
  }

  if (data.workDays !== null && (data.workDays < 1 || data.workDays > 366)) {
    warnings.push(`מספר ימי העבודה (${data.workDays}) חריג — ייתכן שגיאה בחילוץ`);
  }

  return {
    isUsable: criticalErrors.length === 0,
    criticalErrors,
    warnings,
  };
}
