import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'docs',
  route: '/dashboard/docs',
  title: 'Documentation',
  group: 'Operations',
  sourcePath: 'src/demos/docs.ts',
  summary: 'Public documentation index connecting live routes, source files, API contracts, architecture notes, releases, and operational references.',
  proves: [
    'Live route-to-source documentation',
    'Machine-readable route manifest',
    'Documentation stays versioned with the implementation'
  ],
  status: 'scaffolded'
};

export default demo;
