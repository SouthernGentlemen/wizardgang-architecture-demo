import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'compliance',
  route: '/compliance',
  title: 'Compliance & Assurance',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/compliance.ts',
  summary: 'Filterable canonical ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 public assurance records with stable anchors, derived counts, and evidence links.',
  notice: 'Framework statuses describe public engineering evidence and approved mapping posture; certification and formal conformance are not claimed.',
  proves: [
    'The rendered registry is derived from the canonical compliance datasets rather than duplicate hardcoded cards',
    'Framework, status, and WCAG level filters consume canonical records while the released v1 shape is serialized only at the HTTP boundary',
    'Every record has a stable page anchor, exact JSON lookup, canonical dataset source, and evidence links',
    'Counts are derived at presentation time rather than stored in canonical JSON',
  ],
  status: 'working',
  supportingSources: [
    { label: 'View rendered compliance registry', path: 'src/demos/compliance-page.ts' },
    { label: 'View canonical assurance model', path: 'src/assurance/model.ts' },
    { label: 'View v1 HTTP serializer', path: 'src/api/assurance-v1.ts' },
    { label: 'View compliance contract tests', path: 'tests/assurance-compliance-api.test.ts' },
  ],
};

export default demo;
