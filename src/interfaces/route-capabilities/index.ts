import { frontendRouteCapability } from './frontend';
import { interfacesRouteCapability } from './interfaces';
import { restRouteCapability } from './rest';
import { graphqlRouteCapability } from './graphql';
import { webhooksRouteCapability } from './webhooks';
import { identityRouteCapability } from './identity';
import { mcpRouteCapability } from './mcp';
import { i18nRouteCapability } from './i18n';

export const interfaceIdentityCapabilities = [
  frontendRouteCapability,
  interfacesRouteCapability,
  restRouteCapability,
  graphqlRouteCapability,
  webhooksRouteCapability,
  identityRouteCapability,
  mcpRouteCapability,
  i18nRouteCapability,
] as const;
