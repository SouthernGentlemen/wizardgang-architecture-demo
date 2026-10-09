import { acceptanceStages } from '../scripts/lib/acceptance-plan.ts';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generatedArtifactDefinitions } from '../scripts/validate-generated-artifacts.ts';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const scripts = JSON.parse(read('package.json')).scripts;

describe('DEMO-498 runtime binding execution ownership', () => {
  it('assigns generated freshness solely to the two-pass parity owner', () => {
    const parity = generatedArtifactDefinitions.find((entry) => entry.id === 'assurance-runtime-binding');
    expect(parity?.command).toEqual(['npm', ['run', 'generate:assurance-runtime-binding']]);
    expect(parity?.outputs).toEqual([
      'src/assurance/generated/registry-bindings.ts',
      'src/assurance/generated/lifecycle-baseline-membership.json',
    ]);
    expect(scripts['validate:generated-artifacts']).toBe('node scripts/validate-generated-artifacts.ts');
    expect(scripts['generate:assurance-runtime-binding']).toBe('node scripts/generate-assurance-runtime-binding.ts');
    expect(scripts).not.toHaveProperty('validate:assurance-runtime-binding');
    expect(scripts['validate:assurance']).not.toContain('validate:assurance-runtime-binding');
    expect(acceptanceStages.map(({ script }) => `npm run ${script}`).join(' && ').indexOf('validate:generated-artifacts')).toBeLessThan(acceptanceStages.map(({ script }) => `npm run ${script}`).join(' && ').indexOf('validate:assurance'));
    const runner = read('scripts/validate-generated-artifacts.ts');
    expect(runner).toContain('const first = runGenerator(definition, cwd)');
    expect(runner).toContain('const second = runGenerator(definition, cwd)');
    expect(runner).toContain('firstChanged.length || secondChanged.length');
    expect(runner).toContain('record.unexpectedChangedFiles.length');
  });

  it('retains registry completeness, route validation and frozen lifecycle invariants', () => {
    const registry = read('scripts/validate-assurance-registry.ts');
    expect(registry).not.toContain('renderRuntimeBinding');
    expect(registry).not.toContain('RUNTIME_BINDING_PATH');
    expect(registry).toContain('validateAssuranceRouteContract(registry, registeredApplicationRouteIds)');
    expect(registry).toContain('validateRegisteredAssuranceResource');
    expect(registry).toContain('missing required primary dataset family');

    const generator = read('scripts/generate-assurance-runtime-binding.ts');
    expect(generator).not.toContain("process.argv.includes('--check')");
    expect(generator).toContain('verifyLifecycleBaselineMembership(registry, root)');
    expect(generator).toContain('fs.writeFileSync(bindingAbsolute, renderedBinding)');

    const lifecycle = read('scripts/validate-assurance-lifecycle.ts');
    const publication = read('scripts/validate-assurance-publication.ts');
    expect(lifecycle).toContain('verifyLifecycleBaselineMembership');
    expect(publication).toContain('verifyLifecycleBaselineMembership');
  });
});
