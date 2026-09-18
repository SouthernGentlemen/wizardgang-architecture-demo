import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registry from '../assurance/registry.json';

interface RegistryResource {
  id: string;
  kind: string;
  path: string;
  capabilities: string[];
  resources?: RegistryResource[];
}

function flatten(resources: RegistryResource[]): RegistryResource[] {
  return resources.flatMap((resource) => [resource, ...flatten(resource.resources ?? [])]);
}

const governanceResources = flatten(registry.datasets as RegistryResource[])
  .filter((resource) => resource.kind === 'governance-records');

describe('canonical governance register records', () => {
  it('registers 253 schema-covered records in 14 structured views', () => {
    const documents = governanceResources.map((resource) => JSON.parse(readFileSync(resource.path, 'utf8')) as {
      source: string;
      qualification: string;
      views: Array<{ id: string; columns: Array<{ key: string; label: string }>; document?: string; section?: string }>;
      records: Array<{ id: string; view: string }>;
    });
    const views = documents.flatMap((document) => document.views);
    const records = documents.flatMap((document) => document.records);

    expect(governanceResources).toHaveLength(14);
    expect(governanceResources.every((resource) => resource.capabilities.includes('summary-source'))).toBe(true);
    expect(documents.every((document) => document.source === 'governance.records')).toBe(true);
    expect(views).toHaveLength(14);
    expect(records).toHaveLength(253);
    expect(new Set(views.map((view) => view.id)).size).toBe(14);
    expect(new Set(records.map((record) => record.id)).size).toBe(253);
    expect(records.every((record) => views.some((view) => view.id === record.view))).toBe(true);
    expect(views.every((view) => view.columns.length >= 2)).toBe(true);
  });

  it('keeps Markdown output paths out of canonical view metadata', () => {
    for (const resource of governanceResources) {
      const document = JSON.parse(readFileSync(resource.path, 'utf8')) as {
        qualification: string;
        views: Array<Record<string, unknown>>;
      };
      expect(document.qualification).toContain('Canonical structured register facts');
      for (const view of document.views) {
        expect(view).not.toHaveProperty('document');
        expect(view).not.toHaveProperty('section');
      }
    }
  });
});
