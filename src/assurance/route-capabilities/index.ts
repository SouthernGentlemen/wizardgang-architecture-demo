import { advisoriesRouteCapability } from './advisories';
import { complianceRouteCapability } from './compliance';
import { evidenceRouteCapability } from './evidence';
import { incidentsRouteCapability } from './incidents';
import { assuranceRegistryRouteCapability } from './registry';
import { risksRouteCapability } from './risks';

export const assuranceRouteCapabilities = [
  assuranceRegistryRouteCapability,
  evidenceRouteCapability,
  complianceRouteCapability,
  risksRouteCapability,
  incidentsRouteCapability,
  advisoriesRouteCapability,
] as const;
