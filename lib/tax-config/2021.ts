// TODO: verify exact bracket thresholds from ITA circular for 2021
import type { YearTaxConfig } from './types';

const config: YearTaxConfig = {
  year: 2021,
  creditPointValueMonthly: 223,
  creditPointValueAnnual: 2676,
  brackets: [
    { upTo: 75480,  rate: 0.10 },
    { upTo: 108120, rate: 0.14 },
    { upTo: 173880, rate: 0.20 },
    { upTo: 241680, rate: 0.31 },
    { upTo: 501960, rate: 0.35 },
    { upTo: Infinity, rate: 0.47 },
  ],
};

export default config;
