import { finishIsoValidation, validateNormalizedIso } from './lib/validate-normalized-iso.mjs';

const expectedClauseRefs = [
  '4.1', '4.2', '4.3', '4.4', '5.1', '5.2', '5.3', '6.1', '6.1.1', '6.1.2', '6.1.3', '6.2', '6.3',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.5.1', '7.5.2', '7.5.3', '8.1', '8.2', '8.3', '9.1', '9.2', '9.2.1',
  '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3', '10.1', '10.2',
];
const expectedAnnexRefs = [
  ...Array.from({ length: 37 }, (_, index) => `A.5.${index + 1}`),
  ...Array.from({ length: 8 }, (_, index) => `A.6.${index + 1}`),
  ...Array.from({ length: 14 }, (_, index) => `A.7.${index + 1}`),
  ...Array.from({ length: 34 }, (_, index) => `A.8.${index + 1}`),
];

const result = validateNormalizedIso({
  standard: 'ISO/IEC 27001:2022', edition: '2022', framework: 'iso-27001', idPrefix: 'ISO27001', sourceSoaId: 'WG-SOA-001',
  expectedClauseRefs, expectedAnnexRefs,
});
finishIsoValidation('ISO/IEC 27001', result);
