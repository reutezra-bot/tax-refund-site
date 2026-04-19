import type { YearTaxConfig } from './types';
import config2019 from './2019';
import config2020 from './2020';
import config2021 from './2021';
import config2022 from './2022';
import config2023 from './2023';
import config2024 from './2024';
import config2025 from './2025';

export type { YearTaxConfig };

const CONFIGS: Record<number, YearTaxConfig> = {
  2019: config2019,
  2020: config2020,
  2021: config2021,
  2022: config2022,
  2023: config2023,
  2024: config2024,
  2025: config2025,
};

export const SUPPORTED_YEARS = Object.keys(CONFIGS).map(Number).sort((a, b) => b - a);

/**
 * Returns the tax config for the given year.
 * Falls back to the closest supported year if the exact year is not available.
 */
export function getTaxConfig(year: number): YearTaxConfig {
  if (CONFIGS[year]) return CONFIGS[year];
  // Clamp to the nearest supported year
  const sorted = SUPPORTED_YEARS;
  if (year < sorted[sorted.length - 1]) return CONFIGS[sorted[sorted.length - 1]];
  if (year > sorted[0]) return CONFIGS[sorted[0]];
  const closest = sorted.reduce((a, b) =>
    Math.abs(b - year) < Math.abs(a - year) ? b : a,
  );
  return CONFIGS[closest];
}

/**
 * Apply progressive tax brackets to an annual income amount.
 * Returns gross tax before any credits.
 */
export function applyBrackets(annualIncome: number, config: YearTaxConfig): number {
  let tax = 0;
  let prev = 0;
  for (const bracket of config.brackets) {
    if (annualIncome <= prev) break;
    const slice = Math.min(annualIncome, bracket.upTo) - prev;
    tax += slice * bracket.rate;
    prev = bracket.upTo;
    if (bracket.upTo === Infinity) break;
  }
  return Math.round(tax);
}
