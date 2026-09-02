import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'security',
  route: '/security',
  title: 'Security',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/security.ts',
  summary: 'Vulnerability disclosure policy, private reporting path, response expectations, and the boundary between vulnerabilities, incidents, and public concerns.',
  notice: 'Suspected vulnerabilities and security incidents must use the private reporting path, never a public issue.',
  proves: [
    'Private vulnerability reporting is enabled for the public repository',
    'The reporting route remains reachable while ordinary demonstrations are intentionally offline',
    'Published advisories are distinct from private reports and operational incidents',
    'The policy makes no promise that every report becomes a GHSA or CVE',
  ],
  status: 'working',
  supportingSources: [
    { label: 'Security policy', path: 'SECURITY.md' },
    { label: 'Vulnerability management', path: 'docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md' },
    { label: 'Incident management', path: 'docs/governance/INCIDENT-MANAGEMENT.md' },
  ],
};

export default demo;
