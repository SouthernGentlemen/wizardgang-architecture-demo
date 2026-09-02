import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'dashboard',
  route: '/dashboard',
  title: 'System Operations',
  group: 'Operations',
  sourcePath: 'src/demos/dashboard.ts',
  summary: 'Read-only operational center for live health, scheduled availability, deployment evidence, public-safe activity, Cloudflare usage, and cost guardrails.',
  proves: [
    'Single read-only operational entry point',
    'Links operational state back to public implementation code',
    'Separates public telemetry from private account configuration',
    'Provides bounded public-safe application log visibility alongside scheduled health, uptime, and sanitized Cloudflare telemetry'
  ],
  status: 'working',
  interfaces: [{ method: 'GET', path: '/dashboard', description: 'Compose live control, health, budget, version, log, documentation, and evidence state.' }],
  supportingSources: [{ label: 'View dashboard implementation', path: 'src/demos/operations-pages.ts' }, { label: 'View operations tests', path: 'tests/operations.test.ts' }]
};

export default demo;
