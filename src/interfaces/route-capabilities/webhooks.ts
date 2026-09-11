import { githubWebhookResponse } from '../../api/webhooks';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const webhooksRouteCapability = defineInterfaceIdentityCapability('interfaces.webhooks', [

  interfaceIdentityRoute({
    id: 'interfaces.webhooks.github',
    pattern: '/webhooks/github',
    methods: ['POST'],
    kind: 'protocol',
    handler: (request, { env }) => githubWebhookResponse(request, env),
    title: 'GitHub webhook receiver',
    description: 'GitHub-compatible receiver enforcing exact-body HMAC, repository/event allowlists, and replay protection.',
    sourceModule: 'src/api/webhooks.ts',
    sourceExport: 'githubWebhookResponse',
    authorization: { mode: 'policy', policy: 'github-hmac + repository/event allowlists + replay protection' },
    tests: ['tests/webhooks.test.ts'],
  }),
]);
