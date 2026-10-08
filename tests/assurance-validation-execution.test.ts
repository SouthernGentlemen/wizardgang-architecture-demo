import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createAssuranceValidationContext, currentAssuranceValidationContext, withAssuranceValidationContext } from '../scripts/lib/assurance-validation-context.ts';
import { loadAssuranceRecordInventory, loadAssuranceRegistry, readJsonFile } from '../scripts/lib/assurance-registry.ts';

describe('shared assurance validation execution', () => {
  it('loads registry, documents and inventory just once within the explicit root and clock', async () => {
    const reads = new Map<string, number>();
    const now = '2026-09-03T03:59:00.000Z';
    const context = createAssuranceValidationContext({
      root: process.cwd(),
      now,
      readBytes: (relative: string) => {
        reads.set(relative, (reads.get(relative) ?? 0) + 1);
        return readFileSync(relative);
      },
    });
    await withAssuranceValidationContext(context, async () => {
      const registry = loadAssuranceRegistry(context.root);
      expect(registry).toBe(readJsonFile(context.root, 'assurance/registry.json'));
      const first = loadAssuranceRecordInventory(context.root, registry);
      expect(loadAssuranceRecordInventory(context.root, registry)).toBe(first);
      expect(context.now).toBe(now);
      expect(currentAssuranceValidationContext(context.root)).toBe(context);
      expect(context.readJson('docs/governance/REFERENCE-REGISTRY.json'))
        .toBe(context.readJson('docs/governance/REFERENCE-REGISTRY.json'));
    });
    expect(reads.get('assurance/registry.json')).toBe(1);
    expect(reads.get('docs/governance/REFERENCE-REGISTRY.json')).toBe(1);
    expect([...reads.values()].every((count) => count === 1)).toBe(true);
    expect(currentAssuranceValidationContext(context.root)).toBeNull();
  });

  it('does not share file or clock state across executions', async () => {
    const a = createAssuranceValidationContext({ now: '2026-09-03T03:59:00.000Z' });
    const b = createAssuranceValidationContext({ now: '2026-09-03T05:00:00.000Z' });
    expect(a.registry()).not.toBe(b.registry());
    expect(a.now).not.toBe(b.now);
    expect(await withAssuranceValidationContext(a, () => currentAssuranceValidationContext(a.root))).toBe(a);
    expect(await withAssuranceValidationContext(b, () => currentAssuranceValidationContext(b.root))).toBe(b);
  });
});
