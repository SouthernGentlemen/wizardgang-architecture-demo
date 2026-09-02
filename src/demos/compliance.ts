import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'compliance',
  route: '/compliance',
  title: 'Compliance & Assurance',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/compliance.ts',
  summary: 'Assurance index connecting WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 alignment statements to the working evidence elsewhere in the demo.',
  notice: 'All standards references describe alignment and support, not third-party certification.',
  proves: [
    'Compliance posture is stated without compliant or certified badges',
    'Each assurance area links to the canonical working demonstration or operational evidence',
    'The route consolidates evidence without duplicating accessibility, governance, Git, MCP, documentation, or operations content',
  ],
  status: 'working',
  supportingSources: [
    { label: 'View rendered assurance index', path: 'src/demos/compliance-page.ts' },
    { label: 'View route contract tests', path: 'tests/route-contract.test.ts' },
  ],
};

export default demo;
