import type { Env } from '../types';
import { platformLaboratoryCapabilities } from '../platform/route-capabilities';
import type { PlatformLaboratoryCapability } from '../platform/route-capability';
import {
  createRouteRegistry,
  defineRouteModule,
  type RouteRegistry,
} from './registry';

export function createPlatformLaboratoryRouteRegistry(
  capabilities: readonly PlatformLaboratoryCapability[] = platformLaboratoryCapabilities,
): RouteRegistry<Env> {
  return createRouteRegistry(
    capabilities.map((capability) => defineRouteModule<Env>(capability.id, capability.routes)),
  );
}

export const platformLaboratoryRouteRegistry = createPlatformLaboratoryRouteRegistry();
