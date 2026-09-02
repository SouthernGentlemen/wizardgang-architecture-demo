import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'uptime',
  route: '/dashboard/uptime',
  title: 'Availability',
  group: 'Operations',
  sourcePath: 'src/demos/uptime.ts',
  summary: 'Service availability calculated from five-minute scheduled health checks with planned maintenance separated from unexpected failure.',
  proves: [
    'Cloudflare Cron generates timestamped service checks without depending on visitor traffic',
    'Availability calculation over a defined window',
    'Operational history retained in D1'
  ],
  status: 'working',
  interfaces: [{ method: 'GET', path: '/dashboard/uptime', description: 'Calculate availability from the latest 100 stored public-demo observations.' }],
  supportingSources: [{ label: 'View uptime implementation', path: 'src/demos/operations-pages.ts' }, { label: 'View health persistence', path: 'src/api/operations.ts' }]
};

export default demo;
