// GENERATED FILE: scripts/generate-assurance-runtime-binding.mjs; DO NOT EDIT BY HAND.
import registryData from '../../../assurance/registry.json';
import lifecycleBaselineMembership from './lifecycle-baseline-membership.json';
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
import dataset12 from '../../../assurance/lifecycle/records.json';
import schema12 from '../../../contracts/assurance/lifecycle.schema.json';
import dataset13 from '../../../assurance/objectives/objectives.json';
import schema13 from '../../../contracts/assurance/objective.schema.json';
import dataset14 from '../../../assurance/risks/risks.json';
import schema14 from '../../../contracts/assurance/risk.schema.json';

export const assuranceRegistryData = registryData;
export const assuranceLifecycleBaselineMembership = lifecycleBaselineMembership;

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
  "lifecycle.records": dataset12,
  "objectives": dataset13,
  "risks": dataset14,
};

export const assuranceRuntimeSourceRevisions: Readonly<Record<string, string>> =
{
  "advisories": "88a0999d1ceae96e02cbc7861de3ab35779f5495",
  "claims": "02437024489cbeb3d9bb34ac056c21e6c98d42f9",
  "compliance.iso-27001": "da20503410039977988c41282901c26ee5e016bf",
  "compliance.iso-42001": "ecb55b9ca8c746b97dcec6c2133b4df25896fdf8",
  "compliance.wcag-2.2": "84a173a127f175783d61ddf2f71952a6351b8405",
  "compliance.wcag-2.2.operable": "b74451ffe863fb83e1a0f01274806260172e47cc",
  "compliance.wcag-2.2.perceivable": "b0925cf7b71c20dd2547451c371366988d4288fb",
  "compliance.wcag-2.2.robust": "c6675be44aab01eb6dd8fdc36f045e95d12e1db1",
  "compliance.wcag-2.2.understandable": "2815ed1a9bfb0e5048871fa386a9629db2c18e05",
  "evidence": "c56635f6fdc93c1efd0100e8e1bf252935cc6912",
  "exercises": "293517054656f966e860df3fa8d34beabce43644",
  "incidents": "1ff3b01fe53498e0bfd4b0af369bc8f1cfb8614e",
  "lifecycle.records": "bf1ce017ea3ff00cb37a33ca68f4bc211b937ee8",
  "objectives": "bbd7ffc46259c27a2bc104b626391b689693a9f9",
  "risks": "6900031bbd1e974cfb1d80ce43bf937419591ea9"
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
  "lifecycle.records": schema12,
  "objectives": schema13,
  "risks": schema14,
};

export const assuranceRuntimeFilterVocabularies: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> =
{
  "compliance": {
    "framework": [
      "iso-27001",
      "iso-42001",
      "wcag-2.2"
    ],
    "status": [
      "met",
      "partial",
      "gap",
      "not-applicable",
      "demonstrated",
      "not-observed"
    ],
    "level": [
      "A",
      "AA",
      "AAA"
    ]
  },
  "risks": {
    "framework": [
      "security",
      "ai"
    ],
    "status": [
      "open",
      "treating"
    ],
    "residual": [
      "low",
      "moderate",
      "high",
      "critical"
    ]
  }
};

export const assuranceRuntimeSchemaDependencyDigests: Readonly<Record<string, string>> =
{
  "contracts/assurance/relationships.schema.json": "ca54cd2288262998b7bfc88547a7db9c69a926ed23df0fa739a9532c3e9b6617",
  "contracts/assurance/risk-vocabulary.schema.json": "603a4d5e058f6fbab154f70ba12169ba66d0fd1c8a0a5085cda85d2be304181a"
};
