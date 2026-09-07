import { gitEvidenceResponse } from '../../api/git-evidence';
import { gitDemoReleaseResponse, gitDemoStartResponse, gitDemoStatusResponse } from '../../api/git-demo';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const gitRouteCapability = defineInterfaceIdentityCapability('interfaces.git', [
  interfaceIdentityRoute({
    id: 'interfaces.git.reporting',
    pattern: '/__api/git/evidence',
    methods: ['GET', 'POST'],
    kind: 'api',
    handler: (request, { env }) => gitEvidenceResponse(request, env),
    title: 'GitHub assurance reporting',
    description: 'GitHub reporting boundary preserving disclosure-aware public reads and protected imports.',
    sourceModule: 'src/api/git-evidence.ts',
    sourceExport: 'gitEvidenceResponse',
    authorization: { mode: 'policy', policy: 'GET demo:read; POST reporting:write; disclosure follows principal and source visibility' },
    tests: ['tests/git-evidence.test.ts', 'tests/reporting-disclosure.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.git.demo',
    pattern: '/__api/git/demo',
    methods: ['GET', 'POST'],
    kind: 'api',
    handler: (request, { env }) => request.method === 'GET'
      ? gitDemoStatusResponse(request, env)
      : gitDemoStartResponse(request, env),
    title: 'Git delivery demonstration',
    description: 'Public status and same-origin administrator-controlled Git delivery demonstration start.',
    sourceModule: 'src/api/git-demo.ts',
    sourceExport: 'gitDemoStartResponse',
    authorization: { mode: 'policy', policy: 'GET public status; POST admin authorization + GitHub preflight/release controls' },
    sameOrigin: { mode: 'required', methods: ['POST'] },
    tests: ['tests/git-demo.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.git.demo-release',
    pattern: '/__api/git/demo/release',
    methods: ['POST'],
    kind: 'api',
    handler: (request, { env }) => gitDemoReleaseResponse(request, env),
    title: 'Git demo release action',
    description: 'Same-origin administrator-only release action gated by exact run/PR state and successful validation.',
    sourceModule: 'src/api/git-demo.ts',
    sourceExport: 'gitDemoReleaseResponse',
    authentication: { mode: 'required', provider: 'admin-basic' },
    authorization: { mode: 'policy', policy: 'admin + release-ready controls' },
    visibility: 'private',
    sameOrigin: { mode: 'required', methods: ['POST'] },
    tests: ['tests/git-demo.test.ts'],
  }),
]);
