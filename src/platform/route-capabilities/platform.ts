import { renderPlatform } from '../../demos/platform';
import { frontendSurface } from '../../demos/registry';
import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const platformSurface = frontendSurface('platform.page');
const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/router.test.ts', 'tests/interface.test.ts'] as const;
const docs = ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] as const;

export const platformPageCapability = definePlatformLaboratoryCapability({
  id: 'platform.surface',
  routes: [
    {
      id: 'platform.page',
      pattern: platformSurface.route,
      methods: ['GET'],
      kind: 'page',
      handler: (request, env) => renderPlatform(request, env),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'allow' },
      documentation: {
        title: platformSurface.title,
        description: platformSurface.summary,
        docs,
      },
      source: {
        module: 'src/demos/platform.ts',
        exportName: 'renderPlatform',
        tests,
      },
      requestLimits: noRequestBody('The platform page selects a server-rendered view from the query string and consumes no request body.'),
      storage: NO_STORAGE,
    },
  ],
});
