import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'concerns',
  route: '/governance/concerns',
  title: 'Report a Concern',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/concerns.ts',
  summary: 'Public intake for bugs, feature requests, accessibility, AI/MCP, and other non-sensitive concerns, with security disclosures routed privately.',
  notice: 'Public GitHub issues are visible to everyone. Remove credentials, personal data, and sensitive infrastructure details before submitting.',
  proves: [
    'Non-sensitive reports enter the public controlled-work system through structured issue forms',
    'Security disclosures are separated from public product and governance concerns',
    'Accessibility and AI/MCP concerns retain explicit classifications',
    'Native demo submission can be added later without placing a GitHub write token in the public form path',
  ],
  status: 'working',
  supportingSources: [
    { label: 'Issue form configuration', path: '.github/ISSUE_TEMPLATE/config.yml' },
    { label: 'Communication and concern governance', path: 'docs/governance/COMPETENCE-AWARENESS-COMMUNICATION.md' },
    { label: 'Security policy', path: 'SECURITY.md' },
  ],
};

export default demo;
