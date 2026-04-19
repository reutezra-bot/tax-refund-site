// TODO: verify exact bracket thresholds from ITA circular for 2022
import type { YearTaxConfig } from './types';

const config: YearTaxConfig = {
  year: 2022,
  creditPointValueMonthly: 228,
  creditPointValueAnnual: 2736,
  brackets: [
    { upTo: 75720,  rate: 0.10 },
    { upTo: 108600, rate: 0.14 },
    { upTo: 174360, rate: 0.20 },
    { upTo: 242400, rate: 0.31 },
    { upTo: 502920, rate: 0.35 },
    { upTo: Infinity, rate: 0.47 },
  ],
};

export default config;
