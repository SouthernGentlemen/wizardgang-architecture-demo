import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveRuntimeFilterVocabularies } from '../scripts/generate-assurance-runtime-binding.mjs';

describe('assurance filter vocabulary generation', () => {
  it('derives shared-route filter values from route-owner members without changing canonical registry data', () => {
    const registry = JSON.parse(readFileSync('assurance/registry.json', 'utf8'));
    const incidents = registry.datasets.find((dataset) => dataset.kind === 'incidents');
    expect(incidents).toBeDefined();
    incidents.filters = {
      recordType: { path: 'recordType', label: 'Record type' },
    };

    const vocabularies = deriveRuntimeFilterVocabularies(registry, process.cwd());
    expect(vocabularies.incidents.recordType).toEqual(['incident', 'exercise']);

    const canonical = JSON.parse(readFileSync('assurance/registry.json', 'utf8'));
    expect(canonical.datasets.find((dataset) => dataset.kind === 'incidents')?.filters).toBeUndefined();
  });
});
