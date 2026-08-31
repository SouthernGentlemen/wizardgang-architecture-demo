import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'billing',
  route: '/dashboard/billing',
  title: 'Billing & Usage',
  group: 'Operations',
  sourcePath: 'src/demos/billing.ts',
  summary: 'Synthetic usage and cost demonstration showing metering, budget thresholds, and graceful degradation behavior without exposing a real Cloudflare account.',
  proves: [
    'Usage metering and cost projection',
    'Budget threshold visibility',
    'Graceful degradation policy can be demonstrated safely'
  ],
  status: 'working',
  interfaces: [{ method: 'POST', path: '/__api/operations/billing', description: 'Select normal, warning, or degraded controlled usage state.' }],
  supportingSources: [{ label: 'View scenario API', path: 'src/api/billing.ts' }, { label: 'View operational page', path: 'src/demos/operations-pages.ts' }, { label: 'View degradation policy', path: 'src/lib/billing.ts' }]
};

export default demo;
