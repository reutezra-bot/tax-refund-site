// TODO: verify exact bracket thresholds from ITA circular for 2024
import type { YearTaxConfig } from './types';

const config: YearTaxConfig = {
  year: 2024,
  creditPointValueMonthly: 242,
  creditPointValueAnnual: 2904,
  brackets: [
    { upTo: 81480,  rate: 0.10 },
    { upTo: 116760, rate: 0.14 },
    { upTo: 187440, rate: 0.20 },
    { upTo: 260520, rate: 0.31 },
    { upTo: 542160, rate: 0.35 },
    { upTo: Infinity, rate: 0.47 },
  ],
};

export default config;
