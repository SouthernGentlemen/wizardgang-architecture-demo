import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'incidents',
  route: '/governance/incidents',
  title: 'Incidents & Exercises',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/incidents.ts',
  summary: 'Disclosure-safe public incident and response-exercise records with permanent INC-* and EX-* identifiers and explicit record-type boundaries.',
  notice: 'No placeholder incidents or exercise completions are created. Vulnerabilities and advisories remain separate disclosure records.',
  proves: [
    'Actual incidents and simulated exercises use distinct permanent identifier families',
    'The public incident dataset can truthfully represent zero established incident records',
    'Planned exercises remain planned until completion evidence exists',
    'Vulnerabilities and published advisories remain outside the incident/exercise register',
  ],
  status: 'working',
  supportingSources: [
    { label: 'Incident and exercise register', path: 'docs/governance/registers/INCIDENT-REGISTER.md' },
    { label: 'Canonical incident JSON', path: 'assurance/incidents/incidents.json' },
    { label: 'Canonical exercise JSON', path: 'assurance/incidents/exercises.json' },
  ],
};

export default demo;
