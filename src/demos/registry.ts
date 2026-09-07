export type FrontendSurfaceRouteId =
  | 'interfaces.frontend.index'
  | 'platform.page'
  | 'interfaces.page'
  | 'assurance.wizardgang-public-assurance.html'
  | 'assurance.advisories.html'
  | 'operations.page'
  | 'operations.admin'
  | 'operations.offline';

export interface SurfaceViewDefinition {
  id: string;
  label: string;
}

export interface FrontendSurfaceDefinition {
  routeId: FrontendSurfaceRouteId;
  route: string;
  title: string;
  group: string;
  summary: string;
  order: number;
  navigation: boolean;
  index: boolean;
  sitemap: boolean;
  views: readonly SurfaceViewDefinition[];
}

export const surfaces: readonly FrontendSurfaceDefinition[] = [
  {
    routeId: 'interfaces.frontend.index', route: '/', title: 'Architecture demo index', group: 'Navigation',
    summary: 'Primary public frontend entry point assembled from registered page metadata.', order: 0,
    navigation: true, index: false, sitemap: true, views: [],
  },
  {
    routeId: 'platform.page', route: '/platform', title: 'Cloudflare Platform', group: 'Platform',
    summary: 'One server-rendered surface for edge inspection, Worker compute, Durable Objects, D1, and R2 demonstrations.', order: 1,
    navigation: true, index: true, sitemap: true,
    views: [
      { id: 'edge', label: 'Edge' },
      { id: 'workers', label: 'Workers' },
      { id: 'durable-objects', label: 'Durable Objects' },
      { id: 'd1', label: 'D1' },
      { id: 'r2', label: 'R2' },
    ],
  },
  {
    routeId: 'interfaces.page', route: '/interfaces', title: 'Interfaces', group: 'Interfaces',
    summary: 'One server-rendered surface for REST, GraphQL, webhooks, identity, MCP, internationalization, and accessibility.', order: 2,
    navigation: true, index: true, sitemap: true,
    views: [
      { id: 'rest', label: 'REST' },
      { id: 'graphql', label: 'GraphQL' },
      { id: 'webhooks', label: 'Webhooks' },
      { id: 'identity', label: 'Identity' },
      { id: 'mcp', label: 'MCP' },
      { id: 'i18n', label: 'I18n' },
      { id: 'accessibility', label: 'Accessibility' },
    ],
  },
  {
    routeId: 'assurance.wizardgang-public-assurance.html', route: '/assurance', title: 'Assurance', group: 'Delivery & Governance',
    summary: 'One public assurance surface for delivery evidence, governance, compliance, risks, incidents, concerns, and evidence records.', order: 3,
    navigation: true, index: true, sitemap: true,
    views: [
      { id: 'overview', label: 'Overview' },
      { id: 'delivery', label: 'Delivery' },
      { id: 'governance', label: 'Governance' },
      { id: 'evidence', label: 'Evidence' },
      { id: 'compliance', label: 'Compliance' },
      { id: 'risks', label: 'Risks' },
      { id: 'incidents', label: 'Incidents' },
      { id: 'concerns', label: 'Concerns' },
    ],
  },
  {
    routeId: 'assurance.advisories.html', route: '/security', title: 'Security', group: 'Delivery & Governance',
    summary: 'Private vulnerability reporting, coordinated disclosure, and disclosure-safe published security advisory assurance.', order: 4,
    navigation: true, index: true, sitemap: true, views: [],
  },
  {
    routeId: 'operations.page', route: '/operations', title: 'Operations', group: 'Operations',
    summary: 'One server-rendered operations surface for health, availability, public-safe logs, usage and cost, shared reporting, deployment evidence, and documentation.', order: 5,
    navigation: true, index: true, sitemap: true,
    views: [
      { id: 'overview', label: 'Overview' },
      { id: 'availability', label: 'Availability' },
      { id: 'logs', label: 'Logs' },
      { id: 'usage', label: 'Usage' },
      { id: 'reports', label: 'Reports' },
      { id: 'docs', label: 'Docs' },
    ],
  },
  {
    routeId: 'operations.admin', route: '/admin', title: 'Demo administration', group: 'Operations',
    summary: 'Protected control surface for demo availability and ChatGPT fetch policy.', order: 6,
    navigation: false, index: false, sitemap: false, views: [],
  },
  {
    routeId: 'operations.offline', route: '/offline', title: 'Offline recovery page', group: 'Operations',
    summary: 'Public maintenance page shown when ordinary demo routes are intentionally offline.', order: 7,
    navigation: false, index: false, sitemap: false, views: [],
  },
] as const;

const surfaceByRouteId = new Map<FrontendSurfaceRouteId, FrontendSurfaceDefinition>(
  surfaces.map((surface) => [surface.routeId, surface]),
);

export const htmlPagePathnames = surfaces.map((surface) => surface.route);

/** Transitional consumer view: these are surface declarations, not legacy page definitions. */
export const demos = surfaces.filter((surface) => surface.index);

export function frontendSurface(routeId: FrontendSurfaceRouteId): FrontendSurfaceDefinition {
  const surface = surfaceByRouteId.get(routeId);
  if (!surface) throw new Error(`Unknown frontend surface route ID '${routeId}'`);
  return surface;
}

export function frontendUrl(routeId: FrontendSurfaceRouteId): string {
  return frontendSurface(routeId).route;
}

export function frontendViewUrl(
  routeId: FrontendSurfaceRouteId,
  viewId: string,
  extraQuery: Readonly<Record<string, string | undefined>> = {},
): string {
  const surface = frontendSurface(routeId);
  if (!surface.views.some((view) => view.id === viewId)) {
    throw new Error(`Unknown view '${viewId}' for frontend surface '${routeId}'`);
  }
  const query = new URLSearchParams({ view: viewId });
  for (const [name, value] of Object.entries(extraQuery)) {
    if (value !== undefined) query.set(name, value);
  }
  return `${surface.route}?${query.toString()}`;
}
