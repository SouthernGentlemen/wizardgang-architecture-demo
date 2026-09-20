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
  "claims": "f5efd00c1e6a348d09ed8a122e3a45426ec0cdcd",
  "compliance.iso-27001": "a99134584aa2db3d983d19480ade62417fb4cb2f",
  "compliance.iso-42001": "29c342a2b5579aa8316567cd4571a29daeddafc0",
  "compliance.wcag-2.2": "76d9680a523cb6b98fb98b8065244ce3774cb80e",
  "compliance.wcag-2.2.operable": "dff5c53acb1e24bc5e3f1d2e2fd4b2f8d35c885f",
  "compliance.wcag-2.2.perceivable": "e430184a457dfd57b2834d8575bef0eb1ca1dc4a",
  "compliance.wcag-2.2.robust": "442ab0664ae48ac17c5d47d569cab5cc953f75ea",
  "compliance.wcag-2.2.understandable": "3bce33bd01a98d1a2c6523ae4b41d78be2bd7473",
  "evidence": "ed9254e3cc25f50e35111efd020309c710b24dad",
  "exercises": "daf5ba7110043471f7c335ed2a799a3e50dd83f5",
  "incidents": "88c0ef5e10e9ad3f95f9cdf231b77f6e54674e9a",
  "lifecycle.records": "fe58a2278ec1415cbb76f1693d94e9b8feba2320",
  "objectives": "dc764db858b8b7d5fdf85206d376f0115decf647",
  "risks": "7e4400d5e77959fb95e746ef9f04e38d5565f235"
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
      "pass",
      "partial",
      "gap",
      "not-applicable"
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
  "contracts/assurance/relationships.schema.json": "7976be6d0a93bf185d904fc8a449db2838769faab9cae9eae84e7bbf1702acf0",
  "contracts/assurance/risk-vocabulary.schema.json": "603a4d5e058f6fbab154f70ba12169ba66d0fd1c8a0a5085cda85d2be304181a"
};
