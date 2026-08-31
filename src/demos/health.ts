import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'health',
  route: '/dashboard/health',
  title: 'Health',
  group: 'Operations',
  sourcePath: 'src/demos/health.ts',
  summary: 'Current application health for the Worker and configured demo dependencies, reported without exposing credentials or sensitive configuration.',
  proves: [
    'Current Worker health',
    'Dependency readiness checks',
    'Safe public status response'
  ],
  status: 'working',
  interfaces: [{ method: 'GET', path: '/health', description: 'Return machine-readable runtime, D1, R2, Durable Object, and intentional demo state.' }],
  supportingSources: [{ label: 'View health implementation', path: 'src/api/operations.ts' }, { label: 'View human health page', path: 'src/demos/operations-pages.ts' }]
};

export default demo;
