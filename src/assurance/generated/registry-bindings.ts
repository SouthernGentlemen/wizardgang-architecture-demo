// GENERATED FILE: scripts/generate-assurance-runtime-binding.mjs; DO NOT EDIT BY HAND.
import registryData from '../../../assurance/registry.json';
import dataset0 from '../../../assurance/advisories/advisories.json';
import dataset1 from '../../../assurance/claims/claims.json';
import dataset2 from '../../../assurance/compliance/iso-27001-2022.json';
import dataset3 from '../../../assurance/compliance/iso-42001-2023.json';
import dataset4 from '../../../assurance/compliance/wcag-2.2.json';
import dataset5 from '../../../assurance/compliance/wcag-2.2/operable.json';
import dataset6 from '../../../assurance/compliance/wcag-2.2/perceivable.json';
import dataset7 from '../../../assurance/compliance/wcag-2.2/robust.json';
import dataset8 from '../../../assurance/compliance/wcag-2.2/understandable.json';
import dataset9 from '../../../assurance/evidence/evidence.json';
import dataset10 from '../../../assurance/incidents/exercises.json';
import dataset11 from '../../../assurance/incidents/incidents.json';
import dataset12 from '../../../assurance/risks/risks.json';

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
  "risks": dataset12,
};
