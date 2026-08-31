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
  status: 'scaffolded'
};

export default demo;
