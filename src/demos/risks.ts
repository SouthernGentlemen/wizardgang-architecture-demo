import type { DemoDefinition } from '../types';
import { assuranceHtmlRoute } from '../assurance/routes';

const demo: DemoDefinition = {
  id: 'governance-risks',
  route: assuranceHtmlRoute('risks'),
  title: 'Risk Assurance',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/risks.ts',
  summary: 'Disclosure-safe security and AI risk assurance with stable identifiers, derived counts, evidence links, and control references.',
  notice: 'Public assurance omits private treatment actions, risk-owner detail, acceptance rationale, and sensitive infrastructure context. No certification or residual-risk acceptance is claimed.',
  proves: [
    'Approved governance risk identifiers remain stable across human and machine-readable assurance surfaces',
    'Public risk counts are derived from the canonical JSON dataset rather than stored independently',
    'Evidence and control references resolve to reviewable public sources without publishing private treatment detail',
    'Framework, status, and residual-rating filters preserve stable per-risk anchors',
  ],
  status: 'working',
  supportingSources: [
    { label: 'Public risk dataset', path: 'assurance/risks/risks.json' },
    { label: 'Risk JSON schema', path: 'contracts/assurance/risk.schema.json' },
    { label: 'Assurance validation', path: 'scripts/validate-assurance.mjs' },
  ],
};

export default demo;
