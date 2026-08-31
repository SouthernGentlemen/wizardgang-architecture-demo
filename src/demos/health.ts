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
  status: 'scaffolded'
};

export default demo;
