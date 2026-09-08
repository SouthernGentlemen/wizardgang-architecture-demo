import { accessibilityLabResponse } from '../../ui/accessibility-lab';
import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/interface.test.ts', 'tests/router.test.ts'] as const;
const docs = ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] as const;

export const accessibilityLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.accessibility',
  routes: [

{
  id: 'interfaces.accessibility',
  pattern: '/interfaces/accessibility',
  methods: ['GET'],
  kind: 'page',
  handler: async (request, env) => {
    const [{ accessibilityContent }, { renderPage }] = await Promise.all([import('../../demos/accessibility-page'), import('../../ui/page')]);
    return renderPage(env, { ...accessibilityContent(request, env), routeId: 'interfaces.accessibility' });
  },
  authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, visibility: 'public',
  sameOrigin: { mode: 'not-required' }, offline: { mode: 'gated' }, cache: { mode: 'no-store' },
  crawler: { crawling: 'controlled', indexing: 'allow' },
  documentation: { title: 'WCAG 2.2 accessibility laboratory', description: 'Isolated accessible and intentionally broken teaching states with partial automated evidence.', docs },
  source: { module: 'src/demos/accessibility-page.ts', exportName: 'accessibilityContent', tests },
  requestLimits: noRequestBody('GET renders the accessibility laboratory and consumes no request body.'), storage: NO_STORAGE,
  page: { parent: 'interfaces.index', label: 'Accessibility', summary: 'Isolated WCAG 2.2 behavior comparisons with accessible and opt-in broken teaching states.', order: 6, navigation: 'secondary', architectureMap: true },
},
    {
      id: 'platform.accessibility.lab',
      labId: 'accessibility',
      pattern: '/api/labs/accessibility',
      methods: ['GET'],
      requestSchemas: { GET: 'accessibility-mode-query-v1' },
      kind: 'api',
      handler: (request) => accessibilityLabResponse(request),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Accessibility teaching laboratory API',
        description: 'Renders the bounded accessible or intentionally broken teaching frame used by the accessibility interface view.',
        docs,
      },
      source: {
        module: 'src/platform/route-capabilities/accessibility.ts',
        exportName: 'accessibilityLaboratoryCapability',
        tests,
      },
      requestLimits: noRequestBody('GET selects the teaching mode from the query string and consumes no request body.'),
      storage: NO_STORAGE,
    },
  ],
});
