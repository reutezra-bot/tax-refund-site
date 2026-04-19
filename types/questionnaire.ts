export type SpecialPeriod =
  | 'unemployment'
  | 'unpaidLeave'
  | 'reserveDuty'
  | 'maternityLeave'
  | 'none';

export interface QuestionnaireAnswers {
  selectedYears: number[];
  multipleEmployers: boolean | null;
  partialYear: boolean | null;
  specialPeriods: SpecialPeriod[];
  hasLifeInsurance: boolean | null;
  lifeInsuranceMonthlyEstimate?: number;
  hasDonations: boolean | null;
  donationsYearlyEstimate?: number;
  selfEmployedOrForeignIncome: boolean | null;
}
