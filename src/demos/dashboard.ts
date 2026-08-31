import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'dashboard',
  route: '/dashboard',
  title: 'Operations Dashboard',
  group: 'Operations',
  sourcePath: 'src/demos/dashboard.ts',
  summary: 'Public operational surface that brings uptime, health, documentation, public-safe logs, and demo billing together without exposing account secrets.',
  proves: [
    'Single operational entry point',
    'Links operational state back to public implementation code',
    'Separates public telemetry from private account configuration',
    'Provides bounded public-safe application log visibility alongside health and uptime'
  ],
  status: 'working',
  interfaces: [{ method: 'GET', path: '/dashboard', description: 'Compose live control, health, budget, version, log, documentation, and evidence state.' }],
  supportingSources: [{ label: 'View dashboard implementation', path: 'src/demos/operations-pages.ts' }, { label: 'View operations tests', path: 'tests/operations.test.ts' }]
};

export default demo;
