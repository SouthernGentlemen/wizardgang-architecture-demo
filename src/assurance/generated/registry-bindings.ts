// GENERATED FILE: scripts/generate-assurance-runtime-binding.mjs; DO NOT EDIT BY HAND.
import registryData from '../../../assurance/registry.json';
import dataset0 from '../../../assurance/advisories/advisories.json';
import schema0 from '../../../contracts/assurance/advisory.schema.json';
import dataset1 from '../../../assurance/claims/claims.json';
import schema1 from '../../../contracts/assurance/claim.schema.json';
import dataset2 from '../../../assurance/compliance/iso-27001-2022.json';
import schema2 from '../../../contracts/assurance/iso-27001-compliance.schema.json';
import dataset3 from '../../../assurance/compliance/iso-42001-2023.json';
import schema3 from '../../../contracts/assurance/iso-42001-compliance.schema.json';
import dataset4 from '../../../assurance/compliance/wcag-2.2.json';
import schema4 from '../../../contracts/assurance/wcag-2.2-registry.schema.json';
import dataset5 from '../../../assurance/compliance/wcag-2.2/operable.json';
import schema5 from '../../../contracts/assurance/wcag-2.2-criteria.schema.json';
import dataset6 from '../../../assurance/compliance/wcag-2.2/perceivable.json';
import schema6 from '../../../contracts/assurance/wcag-2.2-criteria.schema.json';
import dataset7 from '../../../assurance/compliance/wcag-2.2/robust.json';
import schema7 from '../../../contracts/assurance/wcag-2.2-criteria.schema.json';
import dataset8 from '../../../assurance/compliance/wcag-2.2/understandable.json';
import schema8 from '../../../contracts/assurance/wcag-2.2-criteria.schema.json';
import dataset9 from '../../../assurance/evidence/evidence.json';
import schema9 from '../../../contracts/assurance/evidence.schema.json';
import dataset10 from '../../../assurance/incidents/exercises.json';
import schema10 from '../../../contracts/assurance/exercise.schema.json';
import dataset11 from '../../../assurance/incidents/incidents.json';
import schema11 from '../../../contracts/assurance/incident.schema.json';
import dataset12 from '../../../assurance/objectives/objectives.json';
import schema12 from '../../../contracts/assurance/objective.schema.json';
import dataset13 from '../../../assurance/risks/risks.json';
import schema13 from '../../../contracts/assurance/risk.schema.json';

export const assuranceRegistryData = registryData;

export const assuranceRuntimeDatasets: Record<string, unknown> = {
  "advisories": dataset0,
  "claims": dataset1,
  "compliance.iso-27001": dataset2,
  "compliance.iso-42001": dataset3,
  "compliance.wcag-2.2": dataset4,
  "compliance.wcag-2.2.operable": dataset5,
  "compliance.wcag-2.2.perceivable": dataset6,
  "compliance.wcag-2.2.robust": dataset7,
  "compliance.wcag-2.2.understandable": dataset8,
  "evidence": dataset9,
  "exercises": dataset10,
  "incidents": dataset11,
  "objectives": dataset12,
  "risks": dataset13,
};

export const assuranceRuntimeSchemas: Record<string, unknown> = {
  "advisories": schema0,
  "claims": schema1,
  "compliance.iso-27001": schema2,
  "compliance.iso-42001": schema3,
  "compliance.wcag-2.2": schema4,
  "compliance.wcag-2.2.operable": schema5,
  "compliance.wcag-2.2.perceivable": schema6,
  "compliance.wcag-2.2.robust": schema7,
  "compliance.wcag-2.2.understandable": schema8,
  "evidence": schema9,
  "exercises": schema10,
  "incidents": schema11,
  "objectives": schema12,
  "risks": schema13,
};
