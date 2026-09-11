import { frontendRouteCapability } from './frontend';
import { demosRouteCapability } from './demos';
import { restRouteCapability } from './rest';
import { graphqlRouteCapability } from './graphql';
import { webhooksRouteCapability } from './webhooks';
import { identityRouteCapability } from './identity';
import { mcpRouteCapability } from './mcp';

export const interfaceIdentityCapabilities = [
  frontendRouteCapability,
  demosRouteCapability,
  restRouteCapability,
  graphqlRouteCapability,
  webhooksRouteCapability,
  identityRouteCapability,
  mcpRouteCapability,
] as const;
