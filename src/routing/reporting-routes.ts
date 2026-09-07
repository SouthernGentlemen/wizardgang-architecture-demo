import type { Env } from '../types';
import {
  reportingCollectionResponse,
  reportingIndexResponse,
  reportingRecordResponse,
} from '../api/reporting';
import {
  createRouteRegistry,
  defineRouteModule,
  type RouteDeclaration,
} from './registry';

export interface ReportingRouteContext {
  env: Env;
}

const REPORTING_DOCS = ['docs/REPORTING.md', 'docs/ASSURANCE-API.md', 'docs/ROUTES.md'] as const;
const REPORTING_TESTS = ['tests/reporting-api.test.ts', 'tests/retired-api-routes.test.ts', 'tests/router.test.ts'] as const;

function route(
  declaration: Pick<RouteDeclaration<ReportingRouteContext>, 'id' | 'pattern' | 'methods' | 'handler'> & {
    title: string;
    description: string;
  },
): RouteDeclaration<ReportingRouteContext> {
  return {
    id: declaration.id,
    pattern: declaration.pattern,
    methods: declaration.methods,
    kind: 'api',
    handler: declaration.handler,
    authentication: { mode: 'anonymous' },
    authorization: {
      mode: 'policy',
      policy: 'GET demo:read; private disclosure requires reporting:private; PATCH requires reporting:write',
    },
    visibility: 'public',
    sameOrigin: { mode: 'not-required' },
    offline: { mode: 'gated' },
    cache: { mode: 'response' },
    crawler: { crawling: 'controlled', indexing: 'deny' },
    documentation: {
      title: declaration.title,
      description: declaration.description,
      docs: REPORTING_DOCS,
    },
    source: {
      module: 'src/api/reporting.ts',
      exportName: declaration.id === 'reporting.index'
        ? 'reportingIndexResponse'
        : declaration.id === 'reporting.collection'
          ? 'reportingCollectionResponse'
          : 'reportingRecordResponse',
      tests: REPORTING_TESTS,
    },
  };
}

const reportingRoutes = [
  route({
    id: 'reporting.index',
    pattern: '/api/reporting',
    methods: ['GET', 'OPTIONS'],
    handler: (request, { env }) => reportingIndexResponse(request, env),
    title: 'Reporting collection index',
    description: 'Discovers disclosure-safe canonical reporting collections and their supported filters.',
  }),
  route({
    id: 'reporting.collection',
    pattern: '/api/reporting/:collection',
    methods: ['GET', 'OPTIONS'],
    handler: (request, { env }, params) => reportingCollectionResponse(request, env, params.collection),
    title: 'Reporting collection API',
    description: 'Queries one canonical structured or provider-backed reporting collection with signed cursor pagination and export support.',
  }),
  route({
    id: 'reporting.record',
    pattern: '/api/reporting/:collection/:recordId',
    methods: ['GET', 'PATCH', 'OPTIONS'],
    handler: (request, { env }, params) => reportingRecordResponse(request, env, params.collection, params.recordId),
    title: 'Reporting record API',
    description: 'Reads one canonical reporting record or performs an authorized revision-checked update when the source supports mutation.',
  }),
] as const;

export const reportingRouteModule = defineRouteModule('reporting', reportingRoutes);
export const reportingRouteRegistry = createRouteRegistry([reportingRouteModule]);
