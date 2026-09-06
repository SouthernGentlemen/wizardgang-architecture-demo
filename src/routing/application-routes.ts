import type { AdminIdentity } from '../lib/admin-auth';
import type { DemoDefinition, Env } from '../types';
import { demos } from '../demos/registry';
import {
  assuranceDeclarativeRouteRegistry,
  type AssuranceRouteContext,
} from './assurance-routes';
import {
  interfaceIdentityRouteRegistry,
} from './interface-identity-routes';
import type { InterfaceIdentityRouteContext } from '../interfaces/route-capability';
import {
  operationalRouteRegistry,
  type OperationalRouteContext,
} from './operational-routes';
import { platformLaboratoryRouteRegistry } from './platform-laboratory-routes';
import {
  createRouteRegistry,
  defineRouteModule,
  normalizeRoutePath,
  type RouteDeclaration,
  type RouteModule,
  type RouteRegistry,
} from './registry';
import {
  configureRegisteredRoutes,
  type RegisteredPageMetadata,
} from './navigation';

export type BrowserHtmlPolicy = 'page' | 'graphql' | 'never';

export interface ApplicationRouteContext {
  env: Env;
  adminIdentity?: AdminIdentity;
}

export interface ApplicationRouteDeclaration extends RouteDeclaration<ApplicationRouteContext> {
  browserHtml: BrowserHtmlPolicy;
  navigation?: RegisteredPageMetadata;
}

const demoMetadata = new Map<string, { demo: DemoDefinition; order: number }>(
  demos.map((demo, index) => [normalizeRoutePath(demo.route), { demo, order: index + 1 }]),
);

function browserHtmlFor<TContext>(route: RouteDeclaration<TContext>): BrowserHtmlPolicy {
  const explicit = (route as RouteDeclaration<TContext> & { browserHtml?: BrowserHtmlPolicy }).browserHtml;
  return explicit ?? (route.kind === 'page' ? 'page' : 'never');
}

function navigationFor<TContext>(route: RouteDeclaration<TContext>): RegisteredPageMetadata | undefined {
  if (route.id === 'interfaces.frontend.index') {
    return {
      group: 'Navigation',
      label: route.documentation.title,
      summary: route.documentation.description,
      order: 0,
      index: false,
      sitemap: true,
    };
  }
  const metadata = demoMetadata.get(normalizeRoutePath(route.pattern));
  if (!metadata) return undefined;
  return {
    group: metadata.demo.group,
    label: metadata.demo.title,
    summary: metadata.demo.summary,
    order: metadata.order,
    index: true,
    sitemap: true,
    demo: metadata.demo,
  };
}

function validateApplicationDeclaration(route: ApplicationRouteDeclaration): void {
  if (!route.documentation.title.trim() || !route.documentation.description.trim()) {
    throw new Error(`Route '${route.id}' is undocumented: title and description are required`);
  }
  if (route.documentation.docs.length === 0 || route.documentation.docs.some((doc) => !doc.trim())) {
    throw new Error(`Route '${route.id}' is undocumented: at least one documentation path is required`);
  }
  if (!route.source.module.trim()) {
    throw new Error(`Route '${route.id}' is undocumented: source.module is required`);
  }
  if (route.kind === 'page' && !route.methods.includes('GET')) {
    throw new Error(`Route '${route.id}' is unreachable as a page because it does not support GET`);
  }
  if (route.navigation) {
    if (route.visibility !== 'public' || !route.methods.includes('GET') || route.pattern.includes(':')) {
      throw new Error(`Route '${route.id}' has unreachable navigation metadata`);
    }
    if (!route.navigation.group.trim() || !route.navigation.label.trim() || !route.navigation.summary.trim()) {
      throw new Error(`Route '${route.id}' has incomplete navigation metadata`);
    }
    if (!Number.isFinite(route.navigation.order)) {
      throw new Error(`Route '${route.id}' has an invalid navigation order`);
    }
  }
  if (route.visibility === 'private' && route.crawler.indexing === 'allow') {
    throw new Error(`Route '${route.id}' is private but allows indexing`);
  }
  if (route.visibility === 'private' && route.cache.mode === 'public') {
    throw new Error(`Route '${route.id}' is private but declares public caching`);
  }
}

function adaptRoute<TContext>(
  route: RouteDeclaration<TContext>,
  handler: ApplicationRouteDeclaration['handler'],
): ApplicationRouteDeclaration {
  return {
    ...route,
    handler,
    browserHtml: browserHtmlFor(route),
    navigation: navigationFor(route),
  };
}

function operationalRoutes(): ApplicationRouteDeclaration[] {
  return operationalRouteRegistry.declarations.map((route) => adaptRoute(
    route,
    (request, context, params) => route.handler(
      request,
      { env: context.env, adminIdentity: context.adminIdentity } satisfies OperationalRouteContext,
      params,
    ),
  ));
}

function assuranceRoutes(): ApplicationRouteDeclaration[] {
  return assuranceDeclarativeRouteRegistry.declarations.map((route) => adaptRoute(
    route,
    (request, context, params) => route.handler(
      request,
      { env: context.env } satisfies AssuranceRouteContext,
      params,
    ),
  ));
}

function interfaceIdentityRoutes(): ApplicationRouteDeclaration[] {
  return interfaceIdentityRouteRegistry.declarations.map((route) => adaptRoute(
    route,
    (request, context, params) => route.handler(
      request,
      { env: context.env } satisfies InterfaceIdentityRouteContext,
      params,
    ),
  ));
}

function platformRoutes(): ApplicationRouteDeclaration[] {
  return platformLaboratoryRouteRegistry.declarations.map((route) => adaptRoute(
    route,
    (request, context, params) => route.handler(request, context.env, params),
  ));
}

const applicationModules: readonly RouteModule<ApplicationRouteContext>[] = [
  defineRouteModule('application.operations', operationalRoutes()),
  defineRouteModule('application.assurance', assuranceRoutes()),
  defineRouteModule('application.interfaces', interfaceIdentityRoutes()),
  defineRouteModule('application.platform', platformRoutes()),
];

function normalizeAdditionalModule(
  module: RouteModule<ApplicationRouteContext>,
): RouteModule<ApplicationRouteContext> {
  return defineRouteModule(
    module.id,
    module.routes.map((route) => adaptRoute(route, route.handler)),
  );
}

export function createApplicationRouteRegistry(
  additionalModules: readonly RouteModule<ApplicationRouteContext>[] = [],
): RouteRegistry<ApplicationRouteContext> {
  const registry = createRouteRegistry([
    ...applicationModules,
    ...additionalModules.map(normalizeAdditionalModule),
  ]);
  for (const route of registry.declarations as readonly ApplicationRouteDeclaration[]) {
    validateApplicationDeclaration(route);
  }
  return registry;
}

function interpolatePattern(pattern: string, params: Readonly<Record<string, string>>): string {
  const expected = new Set<string>();
  const route = normalizeRoutePath(pattern).split('/').map((segment) => {
    if (!segment.startsWith(':')) return segment;
    const name = segment.slice(1);
    expected.add(name);
    const value = params[name];
    if (value === undefined) throw new Error(`Missing route parameter '${name}' for ${pattern}`);
    return encodeURIComponent(value.normalize('NFC'));
  }).join('/');
  for (const name of Object.keys(params)) {
    if (!expected.has(name)) throw new Error(`Unexpected route parameter '${name}' for ${pattern}`);
  }
  return route || '/';
}

export function routeUrlFromRegistry(
  registry: RouteRegistry<ApplicationRouteContext>,
  routeId: string,
  params: Readonly<Record<string, string>> = {},
): string {
  const route = registry.declarations.find((candidate) => candidate.id === routeId);
  if (!route) throw new Error(`Unknown route ID '${routeId}'`);
  return interpolatePattern(route.pattern, params);
}

export const applicationRouteRegistry = createApplicationRouteRegistry();
configureRegisteredRoutes(applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[]);

export function routeUrl(
  routeId: string,
  params: Readonly<Record<string, string>> = {},
): string {
  return routeUrlFromRegistry(applicationRouteRegistry, routeId, params);
}
