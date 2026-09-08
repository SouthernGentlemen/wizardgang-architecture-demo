import type { PageMetadata } from '../routing/application-routes';
import type { Env } from '../types';

export interface AssuranceRouteSourceMetadata {
  module: string;
  exportName: string;
  tests?: readonly string[];
}

export type AssuranceRouteResponseHandler = (
  request: Request,
  env: Env,
) => Response | Promise<Response>;

export interface AssuranceHtmlRouteHandlerRegistration {
  handler: AssuranceRouteResponseHandler;
  source: AssuranceRouteSourceMetadata;
  offline?: 'available' | 'gated';
  page?: PageMetadata;
}

export interface AssuranceRouteCapability {
  ownerId: string;
  html?: AssuranceHtmlRouteHandlerRegistration;
}

export function defineAssuranceRouteCapability<T extends AssuranceRouteCapability>(capability: T): T {
  return capability;
}
