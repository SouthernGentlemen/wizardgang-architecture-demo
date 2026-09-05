import { accessibilityLaboratoryCapability } from './accessibility';
import { d1LaboratoryCapability } from './d1';
import { durableObjectsLaboratoryCapability } from './durable-objects';
import { edgeLaboratoryCapability } from './edge';
import { r2LaboratoryCapability } from './r2';
import { workersLaboratoryCapability } from './workers';

export const platformLaboratoryCapabilities = [
  edgeLaboratoryCapability,
  workersLaboratoryCapability,
  durableObjectsLaboratoryCapability,
  d1LaboratoryCapability,
  r2LaboratoryCapability,
  accessibilityLaboratoryCapability,
] as const;
