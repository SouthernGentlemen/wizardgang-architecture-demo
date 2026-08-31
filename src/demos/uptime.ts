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
  status: 'scaffolded'
};

export default demo;
