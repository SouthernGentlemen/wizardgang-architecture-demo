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
      id: 'platform.accessibility.lab',
      pattern: '/__api/accessibility/lab',
      methods: ['GET'],
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
        title: 'Accessibility teaching frame',
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
