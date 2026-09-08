import type { Env } from '../types';
import type { PageMetadata } from '../routing/application-routes';
import type { RouteDeclaration, RouteMethod } from '../routing/registry';

export interface LaboratoryRequestLimits {
  maxBodyBytes: number | null;
  maxItems?: number;
  maxObjectBytes?: number;
  maxValueBytes?: number;
  maxObjectsPerSession?: number;
  maxTotalBytesPerSession?: number;
  maxIdentifierCharacters?: number;
  notes: readonly string[];
}

export type LaboratoryStorageBoundary =
  | { kind: 'none'; description: string }
  | { kind: 'stateless-compute'; description: string }
  | { kind: 'd1'; binding: 'DEMO_DB'; description: string }
  | { kind: 'r2'; binding: 'DEMO_R2'; metadataBinding?: 'DEMO_DB'; description: string }
  | { kind: 'durable-object'; binding: 'DEMO_COORDINATOR'; description: string };

export type LaboratoryRequestSchemas = Readonly<Partial<Record<RouteMethod, string>>>;

export interface LaboratoryRouteDeclaration extends RouteDeclaration<Env> {
  /** Stable public laboratory identifier used to derive the canonical route. */
  labId?: string;
  /** Method-specific schema/validation contract implemented by the registered handler. */
  requestSchemas?: LaboratoryRequestSchemas;
  requestLimits: LaboratoryRequestLimits;
  storage: LaboratoryStorageBoundary;
  page?: PageMetadata;
}

export interface PlatformLaboratoryCapability {
  id: string;
  routes: readonly LaboratoryRouteDeclaration[];
}

const LAB_ID = /^[a-z0-9][a-z0-9-]*$/;
const SCHEMA_ID = /^[a-z0-9][a-z0-9._-]*$/;

function validateLaboratoryApiRoute(route: LaboratoryRouteDeclaration): void {
  if (route.kind !== 'api') return;
  if (!route.labId || !LAB_ID.test(route.labId)) {
    throw new Error(`Laboratory API route '${route.id}' must declare a stable lowercase labId`);
  }

  const collectionPattern = `/api/labs/${route.labId}`;
  const itemPattern = `${collectionPattern}/:id`;
  if (route.pattern !== collectionPattern && route.pattern !== itemPattern) {
    throw new Error(`Laboratory API route '${route.id}' must use ${collectionPattern} or ${itemPattern}`);
  }

  if (!route.requestSchemas) {
    throw new Error(`Laboratory API route '${route.id}' must declare method request schemas`);
  }
  for (const method of route.methods) {
    const schemaId = route.requestSchemas[method];
    if (!schemaId || !SCHEMA_ID.test(schemaId)) {
      throw new Error(`Laboratory API route '${route.id}' must declare a stable request schema for ${method}`);
    }
  }
}

export function definePlatformLaboratoryCapability<T extends PlatformLaboratoryCapability>(capability: T): T {
  for (const route of capability.routes) validateLaboratoryApiRoute(route);
  return capability;
}

export function noRequestBody(note = 'Request body is not consumed.'): LaboratoryRequestLimits {
  return { maxBodyBytes: null, notes: [note] };
}

export const NO_STORAGE: LaboratoryStorageBoundary = {
  kind: 'none',
  description: 'This route does not own persistent application state.',
};

export const STATELESS_COMPUTE_STORAGE: LaboratoryStorageBoundary = {
  kind: 'stateless-compute',
  description: 'Worker computation is stateless; D1 is used only for audit and log evidence, not computation state.',
};

export const D1_RELATIONAL_STORAGE: LaboratoryStorageBoundary = {
  kind: 'd1',
  binding: 'DEMO_DB',
  description: 'D1 owns the laboratory relational state.',
};

export const R2_OBJECT_STORAGE: LaboratoryStorageBoundary = {
  kind: 'r2',
  binding: 'DEMO_R2',
  metadataBinding: 'DEMO_DB',
  description: 'R2 owns object bytes; D1 stores relational metadata and audit references only.',
};

export const DURABLE_OBJECT_STORAGE: LaboratoryStorageBoundary = {
  kind: 'durable-object',
  binding: 'DEMO_COORDINATOR',
  description: 'The Durable Object owns coordinated counter state; D1 receives audit evidence only.',
};
