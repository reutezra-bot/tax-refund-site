// TODO: verify exact bracket thresholds from ITA circular for 2023
import type { YearTaxConfig } from './types';

const config: YearTaxConfig = {
  year: 2023,
  creditPointValueMonthly: 235,
  creditPointValueAnnual: 2820,
  brackets: [
    { upTo: 77400,  rate: 0.10 },
    { upTo: 110880, rate: 0.14 },
    { upTo: 178080, rate: 0.20 },
    { upTo: 247440, rate: 0.31 },
    { upTo: 514920, rate: 0.35 },
    { upTo: Infinity, rate: 0.47 },
  ],
};

export default config;
