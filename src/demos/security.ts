import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'security',
  route: '/security',
  title: 'Security',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/security.ts',
  summary: 'Private vulnerability reporting, coordinated disclosure, and disclosure-safe published security advisory assurance.',
  notice: 'Suspected vulnerabilities and security incidents must use the private reporting path, never a public issue.',
  proves: [
    'Private vulnerability reporting is enabled for the public repository',
    'The reporting route remains reachable while ordinary demonstrations are intentionally offline',
    'Private report and draft advisory data remain outside the public assurance registry',
    'Published advisories are distinct from operational incidents and may link only to established INC-* records',
    'No GHSA or CVE is invented to populate the demonstration',
  ],
  status: 'working',
  supportingSources: [
    { label: 'Security policy', path: 'SECURITY.md' },
    { label: 'Published advisory dataset', path: 'assurance/advisories/advisories.json' },
    { label: 'Published advisory schema', path: 'contracts/assurance/advisory.schema.json' },
    { label: 'Vulnerability management', path: 'docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md' },
    { label: 'Incident management', path: 'docs/governance/INCIDENT-MANAGEMENT.md' },
  ],
};

export default demo;
