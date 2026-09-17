import type { PageMetadata } from '../routing/application-routes';
import type { CachePolicy } from '../routing/registry';
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

export type AssuranceParameterizedRouteResponseHandler = (
  request: Request,
  env: Env,
  params: Readonly<Record<string, string>>,
) => Response | Promise<Response>;

export interface AssuranceHtmlRouteHandlerRegistration {
  handler: AssuranceRouteResponseHandler;
  source: AssuranceRouteSourceMetadata;
  offline?: 'available' | 'gated';
  page?: PageMetadata;
}

export interface AssuranceApiRouteHandlerRegistration {
  routeId: string;
  pattern: string;
  handler: AssuranceParameterizedRouteResponseHandler;
  source: AssuranceRouteSourceMetadata;
  cache?: CachePolicy;
  offline?: 'available' | 'gated';
  title: string;
  description: string;
}

export interface AssuranceRouteCapability {
  routeId: string;
  pattern: string;
  html?: AssuranceHtmlRouteHandlerRegistration;
  api?: readonly AssuranceApiRouteHandlerRegistration[];
}

export function defineAssuranceRouteCapability<T extends AssuranceRouteCapability>(capability: T): T {
  return capability;
}
