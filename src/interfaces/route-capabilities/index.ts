import { frontendRouteCapability } from './frontend';
import { interfacesRouteCapability } from './interfaces';
import { restRouteCapability } from './rest';
import { graphqlRouteCapability } from './graphql';
import { webhooksRouteCapability } from './webhooks';
import { identityRouteCapability } from './identity';
import { mcpRouteCapability } from './mcp';
import { gitRouteCapability } from './git';
import { governanceRouteCapability } from './governance';

export const interfaceIdentityCapabilities = [
  frontendRouteCapability,
  interfacesRouteCapability,
  restRouteCapability,
  graphqlRouteCapability,
  webhooksRouteCapability,
  identityRouteCapability,
  mcpRouteCapability,
  gitRouteCapability,
  governanceRouteCapability,
] as const;
