import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'webhooks',
  route: '/interfaces?view=webhooks',
  title: 'Signed Webhooks',
  group: 'Interfaces',
  sourcePath: 'src/demos/webhooks.ts',
  summary: 'Verify GitHub-compatible deliveries through signature, repository, event, payload, and replay controls, then inspect the sanitized evidence.',
  proves: [
    'HMAC-SHA256 verifies the exact request body before JSON is trusted',
    'Repository and event allowlists constrain accepted GitHub deliveries',
    'Unique delivery IDs reject replay and payload digests preserve integrity evidence',
    'Only sanitized delivery summaries reach shared D1 history and the public viewer',
  ],
  status: 'working',
  supportingSources: [
    { label: 'View webhook implementation', path: 'src/api/webhooks.ts' },
    { label: 'View event contract', path: 'contracts/webhooks/events.json' },
    { label: 'View replay and signature tests', path: 'tests/webhooks.test.ts' },
  ],
};

export default demo;
