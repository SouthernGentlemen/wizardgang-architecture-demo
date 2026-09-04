import { finishIsoValidation, validateNormalizedIso } from './lib/validate-normalized-iso.mjs';

const expectedClauseRefs = [
  '4.1', '4.2', '4.3', '4.4', '5.1', '5.2', '5.3', '6.1', '6.1.1', '6.1.2', '6.1.3', '6.1.4', '6.2', '6.3',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.5.1', '7.5.2', '7.5.3', '8.1', '8.2', '8.3', '8.4', '9.1', '9.2', '9.2.1',
  '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3', '10.1', '10.2',
];
const expectedAnnexRefs = [
  'A.2.2', 'A.2.3', 'A.2.4', 'A.3.2', 'A.3.3', 'A.4.2', 'A.4.3', 'A.4.4', 'A.4.5', 'A.4.6',
  'A.5.2', 'A.5.3', 'A.5.4', 'A.5.5', 'A.6.1.2', 'A.6.1.3', 'A.6.2.2', 'A.6.2.3', 'A.6.2.4', 'A.6.2.5',
  'A.6.2.6', 'A.6.2.7', 'A.6.2.8', 'A.7.2', 'A.7.3', 'A.7.4', 'A.7.5', 'A.7.6', 'A.8.2', 'A.8.3', 'A.8.4', 'A.8.5',
  'A.9.2', 'A.9.3', 'A.9.4', 'A.10.2', 'A.10.3', 'A.10.4',
];

const result = validateNormalizedIso({
  standard: 'ISO/IEC 42001:2023', edition: '2023', framework: 'iso-42001', idPrefix: 'ISO42001', sourceSoaId: 'WG-SOA-002',
  expectedClauseRefs, expectedAnnexRefs,
  extraValidate: ({ compliance, errors }) => {
    const scope = compliance.scopeLimitations ?? {};
    if (!String(scope.capability ?? '').toLowerCase().includes('read-only') || !String(scope.capability ?? '').includes('MCP')) errors.push('ISO 42001 scope must retain the current public read-only MCP capability boundary');
    const modelBoundary = String(scope.modelBoundary ?? '').toLowerCase();
    for (const term of ['general-purpose ai model', 'provider reasoning', 'memory', 'prompt handling', 'internal controls']) if (!modelBoundary.includes(term)) errors.push(`ISO 42001 model boundary must retain limitation: ${term}`);
    if (JSON.stringify(scope.approvedAiMcpFamilies) !== JSON.stringify(['OpenAI Codex', 'Anthropic Claude'])) errors.push('ISO 42001 approved AI/MCP families must remain OpenAI Codex and Anthropic Claude only');
    if (scope.publicMcpDataBoundary?.allowedD1Source !== 'demo_records') errors.push('ISO 42001 demo_records must remain the only approved public MCP D1 source');
    for (const excluded of ['visitor/session data', 'identity data', 'logs', 'audit records', 'R2 objects', 'secrets']) if (!scope.publicMcpDataBoundary?.excluded?.includes(excluded)) errors.push(`ISO 42001 public MCP data boundary must exclude ${excluded}`);
  },
});
finishIsoValidation('ISO/IEC 42001', result);
