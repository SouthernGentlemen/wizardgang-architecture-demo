import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'billing',
  route: '/dashboard/billing',
  title: 'Cloudflare Usage & Cost',
  group: 'Operations',
  sourcePath: 'src/demos/billing.ts',
  summary: 'Sanitized Cloudflare analytics and progressive billable-usage evidence above a separate controlled cost-guardrail simulator.',
  proves: [
    'Live Workers, D1, R2, and Durable Objects usage is normalized server-side and cached in D1',
    'Authoritative billable usage is preferred when accessible; published-rate estimates remain explicitly labeled',
    'Budget threshold visibility',
    'Graceful degradation policy can be demonstrated safely'
  ],
  status: 'working',
  interfaces: [
    { method: 'GET', path: '/__api/operations/cloudflare-usage', description: 'Read the latest sanitized Cloudflare usage snapshot.' },
    { method: 'POST', path: '/__api/operations/billing', description: 'Select normal, warning, or degraded controlled usage state.' },
  ],
  supportingSources: [{ label: 'View scenario API', path: 'src/api/billing.ts' }, { label: 'View operational page', path: 'src/demos/operations-pages.ts' }, { label: 'View degradation policy', path: 'src/lib/billing.ts' }]
};

export default demo;
