// TODO: verify exact bracket thresholds from ITA circular for 2025
import type { YearTaxConfig } from './types';

const config: YearTaxConfig = {
  year: 2025,
  creditPointValueMonthly: 246,
  creditPointValueAnnual: 2952,
  brackets: [
    { upTo: 84120,  rate: 0.10 },
    { upTo: 120720, rate: 0.14 },
    { upTo: 193800, rate: 0.20 },
    { upTo: 269280, rate: 0.31 },
    { upTo: 560280, rate: 0.35 },
    { upTo: Infinity, rate: 0.47 },
  ],
};

export default config;
