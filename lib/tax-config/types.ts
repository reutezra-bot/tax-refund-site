export interface TaxBracket {
  /** Upper bound of this bracket in annual ILS (use Infinity for the top bracket) */
  upTo: number;
  /** Marginal rate, 0–1 */
  rate: number;
}

export interface YearTaxConfig {
  year: number;
  /** Annual tax brackets in ascending order */
  brackets: TaxBracket[];
  /** Value of one tax credit point per month (₪) — TODO: verify each year with ITA publications */
  creditPointValueMonthly: number;
  /** creditPointValueMonthly * 12 */
  creditPointValueAnnual: number;
}
