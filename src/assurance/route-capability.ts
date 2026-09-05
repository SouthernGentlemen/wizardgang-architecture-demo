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

export type AssuranceRecordRouteResponseHandler = (
  request: Request,
  env: Env,
  rawRecordId: string,
) => Response | Promise<Response>;

export interface AssuranceHtmlRouteHandlerRegistration {
  handler: AssuranceRouteResponseHandler;
  source: AssuranceRouteSourceMetadata;
  offline?: 'available' | 'gated';
}

export interface AssuranceApiRouteHandlerRegistration {
  handler: AssuranceRouteResponseHandler;
  source: AssuranceRouteSourceMetadata;
}

export interface AssuranceRecordApiRouteHandlerRegistration {
  handler: AssuranceRecordRouteResponseHandler;
  source: AssuranceRouteSourceMetadata;
}

export interface AssuranceRouteCapability {
  ownerId: string;
  html?: AssuranceHtmlRouteHandlerRegistration;
  apiCollection?: AssuranceApiRouteHandlerRegistration;
  apiRecord?: AssuranceRecordApiRouteHandlerRegistration;
}

export function defineAssuranceRouteCapability<T extends AssuranceRouteCapability>(capability: T): T {
  return capability;
}
