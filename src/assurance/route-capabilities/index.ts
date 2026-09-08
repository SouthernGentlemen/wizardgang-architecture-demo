import { advisoriesRouteCapability } from './advisories';
import { complianceRouteCapability } from './compliance';
import { concernsRouteCapability } from './concerns';
import { deliveryRouteCapability } from './delivery';
import { evidenceRouteCapability } from './evidence';
import { governanceRouteCapability } from './governance';
import { incidentsRouteCapability } from './incidents';
import { assuranceRegistryRouteCapability } from './registry';
import { risksRouteCapability } from './risks';

export const assuranceRouteCapabilities = [
  assuranceRegistryRouteCapability,
  deliveryRouteCapability,
  governanceRouteCapability,
  evidenceRouteCapability,
  complianceRouteCapability,
  risksRouteCapability,
  incidentsRouteCapability,
  concernsRouteCapability,
  advisoriesRouteCapability,
] as const;
