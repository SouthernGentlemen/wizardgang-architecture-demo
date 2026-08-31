import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'uptime',
  route: '/dashboard/uptime',
  title: 'Uptime',
  group: 'Operations',
  sourcePath: 'src/demos/uptime.ts',
  summary: 'Service availability history calculated from timestamped public health checks stored in demo-blob.',
  proves: [
    'Timestamped service checks',
    'Availability calculation over a defined window',
    'Operational history retained in D1'
  ],
  status: 'working',
  interfaces: [{ method: 'GET', path: '/dashboard/uptime', description: 'Calculate availability from the latest 100 stored public-demo observations.' }],
  supportingSources: [{ label: 'View uptime implementation', path: 'src/demos/operations-pages.ts' }, { label: 'View health persistence', path: 'src/api/operations.ts' }]
};

export default demo;
