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
  "claims": "4725b49f1da878c345921f60b64afbb04ebabe33",
  "compliance.iso-27001": "705a4ac4e80a24ae63d6ae344b620ab9dd1c5a6f",
  "compliance.iso-42001": "a46b3387ff2ed48962db9fc6d38cd5b74c8b72f8",
  "compliance.wcag-2.2": "437326a0ce5fb3d5132df35d71fbd80181064256",
  "compliance.wcag-2.2.operable": "4d33a4fd6915abc2a2545443359922ded0b0b4bd",
  "compliance.wcag-2.2.perceivable": "164da8b3a1b7f4633b9e15fcddcf7c69b4465e54",
  "compliance.wcag-2.2.robust": "0ee0623d42fcd08489630fff421dca7ca45444a0",
  "compliance.wcag-2.2.understandable": "f369390e8795f4c42fa0bd97e5f81fc6da9eeca9",
  "evidence": "18466792168382223d1ae119c476cf3d21678a90",
  "exercises": "6c6e8f646a696ce66599f45c8e7c15776f01ad6b",
  "incidents": "1ff3b01fe53498e0bfd4b0af369bc8f1cfb8614e",
  "lifecycle.records": "4de67751c3102ae9bc1bf6ac86b7b1e78b2d912e",
  "objectives": "e0b741ec1d793f1711669b30e615b7b492898cdc",
  "risks": "df96a37d913c5452e875ac3d2adbceaa5c674650"
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
  "contracts/assurance/relationships.schema.json": "600fd5c3d0d21b5d67b006425237dc4098ff37127f1b0f08ad3f55a7aa63c0c0",
  "contracts/assurance/risk-vocabulary.schema.json": "603a4d5e058f6fbab154f70ba12169ba66d0fd1c8a0a5085cda85d2be304181a"
};
