import { githubWebhookResponse, webhookReceiptResponse } from '../../api/webhooks';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const webhooksRouteCapability = defineInterfaceIdentityCapability('interfaces.webhooks', [
  interfaceIdentityRoute({
    id: 'interfaces.webhooks.demo-receipt',
    pattern: '/v1/webhooks/demo',
    methods: ['POST'],
    kind: 'protocol',
    handler: (request, { env }) => webhookReceiptResponse(request, env),
    title: 'Signed demo webhook receiver',
    description: 'HMAC-validated bounded webhook receiver with delivery replay protection.',
    sourceModule: 'src/api/webhooks.ts',
    sourceExport: 'webhookReceiptResponse',
    authorization: { mode: 'policy', policy: 'valid webhook HMAC and unique delivery ID' },
    tests: ['tests/webhooks.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.webhooks.github',
    pattern: '/v1/webhooks/github',
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
