import { frontendRouteCapability } from './frontend';
import { interfacesRouteCapability } from './interfaces';
import { restRouteCapability } from './rest';
import { graphqlRouteCapability } from './graphql';
import { webhooksRouteCapability } from './webhooks';
import { identityRouteCapability } from './identity';
import { mcpRouteCapability } from './mcp';

export const interfaceIdentityCapabilities = [
  frontendRouteCapability,
  interfacesRouteCapability,
  restRouteCapability,
  graphqlRouteCapability,
  webhooksRouteCapability,
  identityRouteCapability,
  mcpRouteCapability,
] as const;
