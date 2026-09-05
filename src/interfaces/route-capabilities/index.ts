import { frontendRouteCapability } from './frontend';
import { restRouteCapability } from './rest';
import { graphqlRouteCapability } from './graphql';
import { webhooksRouteCapability } from './webhooks';
import { identityRouteCapability } from './identity';
import { mcpRouteCapability } from './mcp';
import { gitRouteCapability } from './git';
import { governanceRouteCapability } from './governance';
import { i18nRouteCapability } from './i18n';

export const interfaceIdentityCapabilities = [
  frontendRouteCapability,
  restRouteCapability,
  graphqlRouteCapability,
  webhooksRouteCapability,
  identityRouteCapability,
  mcpRouteCapability,
  gitRouteCapability,
  governanceRouteCapability,
  i18nRouteCapability,
] as const;
