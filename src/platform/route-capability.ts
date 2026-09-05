import type { DemoDefinition, Env } from '../types';
import { demos } from '../demos/registry';
import { renderDemo } from '../ui/page';
import type { RouteDeclaration } from '../routing/registry';

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

export interface LaboratoryRouteDeclaration extends RouteDeclaration<Env> {
  requestLimits: LaboratoryRequestLimits;
  storage: LaboratoryStorageBoundary;
}

export interface PlatformLaboratoryCapability {
  id: string;
  routes: readonly LaboratoryRouteDeclaration[];
}

export function definePlatformLaboratoryCapability<T extends PlatformLaboratoryCapability>(capability: T): T {
  return capability;
}

export function noRequestBody(note = 'Request body is not consumed.'): LaboratoryRequestLimits {
  return { maxBodyBytes: null, notes: [note] };
}

export function renderRegisteredDemo(env: Env, demo: DemoDefinition): Response {
  return renderDemo(env, demo, demos);
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
