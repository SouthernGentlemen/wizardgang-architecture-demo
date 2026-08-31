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
  status: 'working',
  interfaces: [{ method: 'GET', path: '/dashboard/docs', description: 'Index architecture, operations, contracts, source, workflows, releases, and live operational APIs.' }],
  supportingSources: [{ label: 'View documentation index implementation', path: 'src/demos/operations-pages.ts' }, { label: 'View machine route manifest', path: 'docs/route-manifest.json' }]
};

export default demo;
