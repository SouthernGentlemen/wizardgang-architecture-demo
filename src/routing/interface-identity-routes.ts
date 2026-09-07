import type { Env } from '../types';
import { interfaceIdentityCapabilities } from '../interfaces/route-capabilities';
import type {
  InterfaceIdentityCapability,
  InterfaceIdentityRouteContext,
} from '../interfaces/route-capability';
import {
  createRouteRegistry,
  defineRouteModule,
  type RouteRegistry,
} from './registry';

function routeModules(capabilities: readonly InterfaceIdentityCapability[]) {
  return capabilities.map((capability) => defineRouteModule(capability.id, capability.routes));
}

export function createInterfaceIdentityRouteRegistry(
  capabilities: readonly InterfaceIdentityCapability[] = interfaceIdentityCapabilities,
): RouteRegistry<InterfaceIdentityRouteContext> {
  return createRouteRegistry(routeModules(capabilities));
}

export const interfaceIdentityRouteRegistry = createInterfaceIdentityRouteRegistry();
