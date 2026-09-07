import { gitDemoReleaseResponse, gitDemoStartResponse, gitDemoStatusResponse } from '../../api/git-demo';
import { NO_STORAGE, definePlatformLaboratoryCapability, noRequestBody } from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/git-demo.test.ts', 'tests/router.test.ts'] as const;
const docs = ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] as const;

export const gitLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.git',
  routes: [
    {
      id: 'platform.git.delivery',
      labId: 'git-delivery',
      pattern: '/api/labs/git-delivery',
      methods: ['GET', 'POST'],
      requestSchemas: { GET: 'git-delivery-status-query-v1', POST: 'git-delivery-start-v1' },
      kind: 'api',
      handler: (request, env) => request.method === 'GET'
        ? gitDemoStatusResponse(request, env)
        : gitDemoStartResponse(request, env),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'policy', policy: 'GET public status; POST admin authorization + GitHub preflight/release controls' },
      visibility: 'public',
      sameOrigin: { mode: 'required', methods: ['POST'] },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Git delivery laboratory API',
        description: 'Public status and same-origin administrator-controlled Git delivery demonstration start.',
        docs,
      },
      source: { module: 'src/platform/route-capabilities/git.ts', exportName: 'gitLaboratoryCapability', tests },
      requestLimits: {
        maxBodyBytes: 2_048,
        notes: ['GET consumes no body; POST accepts the bounded version-bump JSON request validated by the Git demo handler.'],
      },
      storage: NO_STORAGE,
    },
    {
      id: 'platform.git.release',
      labId: 'git-release',
      pattern: '/api/labs/git-release',
      methods: ['POST'],
      requestSchemas: { POST: 'git-delivery-release-v1' },
      kind: 'api',
      handler: (request, env) => gitDemoReleaseResponse(request, env),
      authentication: { mode: 'required', provider: 'admin-basic' },
      authorization: { mode: 'policy', policy: 'admin + release-ready controls' },
      visibility: 'private',
      sameOrigin: { mode: 'required', methods: ['POST'] },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Git release laboratory action',
        description: 'Same-origin administrator-only release action gated by exact run/PR state and successful validation.',
        docs,
      },
      source: { module: 'src/platform/route-capabilities/git.ts', exportName: 'gitLaboratoryCapability', tests },
      requestLimits: {
        maxBodyBytes: 2_048,
        notes: ['POST accepts the bounded pull-request/request-id JSON request validated by the Git demo handler.'],
      },
      storage: NO_STORAGE,
    },
  ],
});
