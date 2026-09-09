import { githubWebhookResponse } from '../../api/webhooks';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const webhooksRouteCapability = defineInterfaceIdentityCapability('interfaces.webhooks', [

interfaceIdentityRoute({
  id: 'interfaces.webhooks.console', pattern: '/interfaces/webhooks', methods: ['GET'], kind: 'page',
  handler: async (_request, { env }) => { const [{ webhooksContent }, { renderPage }] = await Promise.all([import('../../demos/webhook-console'), import('../../ui/page')]); return renderPage(env, { ...webhooksContent(env), routeId: 'interfaces.webhooks.console' }); },
  title: 'Signed webhooks console', description: 'Pull a release notification, verify it like a GitHub delivery, and inspect sanitized evidence.',
  sourceModule: 'src/demos/webhook-console.ts', sourceExport: 'webhooksContent', tests: ['tests/interface-consolidation.test.ts', 'tests/webhooks.test.ts'],
  page: { parent: 'interfaces.index', label: 'Webhooks', summary: 'Pull a release notification and inspect its verified delivery evidence.', order: 2, navigation: 'secondary', architectureMap: true },
}),
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
