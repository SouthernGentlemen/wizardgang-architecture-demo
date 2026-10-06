import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveRuntimeFilterVocabularies } from '../scripts/generate-assurance-runtime-binding.ts';

type RegistryDataset = { kind: string; filters?: Record<string, { path: string; label: string }> };
type AssuranceRegistry = { datasets: RegistryDataset[] };

describe('assurance filter vocabulary generation', () => {
  it('derives shared-route filter values from route-owner members without changing canonical registry data', () => {
    const registry = JSON.parse(readFileSync('assurance/registry.json', 'utf8')) as AssuranceRegistry;
    const incidents = registry.datasets.find((dataset: RegistryDataset) => dataset.kind === 'incidents');
    expect(incidents).toBeDefined();
    incidents!.filters = {
      recordType: { path: 'recordType', label: 'Record type' },
    };

    const vocabularies: Record<string, Record<string, string[]>> = deriveRuntimeFilterVocabularies(registry, process.cwd());
    expect(vocabularies.incidents.recordType).toEqual(['incident', 'exercise']);

    const canonical = JSON.parse(readFileSync('assurance/registry.json', 'utf8')) as AssuranceRegistry;
    expect(canonical.datasets.find((dataset: RegistryDataset) => dataset.kind === 'incidents')?.filters).toBeUndefined();
  });
});
