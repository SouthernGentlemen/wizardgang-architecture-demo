import { advisoriesRouteCapability } from './advisories';
import { assuranceRegistryRouteCapability } from './registry';

export const assuranceRouteCapabilities = [
  assuranceRegistryRouteCapability,
  advisoriesRouteCapability,
] as const;
