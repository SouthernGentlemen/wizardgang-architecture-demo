import { routeUrl } from '../routing/application-routes';

export interface SurfaceViewDefinition {
  id: string;
  label: string;
}

export const assuranceSurfaceViews = [
  { id: 'overview', label: 'Overview' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'governance', label: 'Governance' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'risks', label: 'Risks' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'concerns', label: 'Concerns' },
] as const satisfies readonly SurfaceViewDefinition[];

export const operationsSurfaceViews = [
  { id: 'overview', label: 'Overview' },
  { id: 'availability', label: 'Availability' },
  { id: 'logs', label: 'Logs' },
  { id: 'usage', label: 'Usage' },
  { id: 'reports', label: 'Reports' },
  { id: 'docs', label: 'Docs' },
] as const satisfies readonly SurfaceViewDefinition[];

const viewInventory = {
  'assurance.wizardgang-public-assurance.html': assuranceSurfaceViews,
  'operations.page': operationsSurfaceViews,
} as const;

type FrontendViewRouteId = keyof typeof viewInventory;

export function frontendViewUrl(
  routeId: FrontendViewRouteId,
  viewId: string,
  extraQuery: Readonly<Record<string, string | undefined>> = {},
): string {
  const views = viewInventory[routeId] as readonly SurfaceViewDefinition[];
  if (!views.some((view) => view.id === viewId)) {
    throw new Error(`Unknown view '${viewId}' for frontend route '${routeId}'`);
  }
  return routeUrl(routeId, {}, { view: viewId, ...extraQuery });
}
