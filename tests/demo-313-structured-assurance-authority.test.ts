import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function json(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('DEMO-313 structured assurance authority', () => {
  it('records the documentation-only compliance migration review against exact source revisions', () => {
    const lifecycle = json('assurance/lifecycle/records.json');
    const review = lifecycle.reviewEvents.find((event: any) => event.id === 'review-demo313-structured-assurance-authority');
    expect(review).toBeDefined();
    expect(review.basis).toContain('Only documentation relationships changed');
    expect(review.basis).toContain('no assurance conclusion, status, rationale, gap, applicability, or evidence relationship changed');

    expect(lifecycle.sourceApprovals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resource: 'compliance.iso-27001',
        revision: 'ddc8f9766ebc5e51001e7f4aa56aca2a2917c6f4',
        reviewRef: review.id,
      }),
      expect.objectContaining({
        resource: 'compliance.iso-42001',
        revision: '117540e8f13aa387dbdddc56caf50f9a1082f8f1',
        reviewRef: review.id,
      }),
    ]));
  });

  it('keeps presentation source IDs resolvable through the assurance registry', () => {
    const registry = json('assurance/registry.json');
    const presentation = json('assurance/presentation/documents.json');
    const flatten = (resources: any[]): any[] => resources.flatMap((resource) => [resource, ...flatten(resource.resources ?? [])]);
    const ids = new Set(flatten(registry.datasets).map((resource) => resource.id));
    for (const resource of registry.presentations ?? []) ids.add(resource.id);
    for (const document of presentation.documents) {
      for (const source of document.sourceDatasets) expect(ids.has(source)).toBe(true);
    }
  });
});
