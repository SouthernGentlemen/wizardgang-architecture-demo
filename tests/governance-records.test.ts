import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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
  it('registers 250 schema-covered records in 14 reviewable partitions and views', () => {
    const documents = governanceResources.map((resource) => JSON.parse(readFileSync(resource.path, 'utf8')) as {
      source: string;
      views: Array<{ id: string; document: string }>;
      records: Array<{ id: string; view: string }>;
    });
    const views = documents.flatMap((document) => document.views);
    const records = documents.flatMap((document) => document.records);
    expect(governanceResources).toHaveLength(14);
    expect(governanceResources.every((resource) => resource.capabilities.includes('summary-source'))).toBe(true);
    expect(documents.every((document) => document.source === 'governance.records')).toBe(true);
    expect(views).toHaveLength(14);
    expect(records).toHaveLength(250);
    expect(new Set(views.map((view) => view.id)).size).toBe(14);
    expect(new Set(records.map((record) => record.id)).size).toBe(250);
    expect(records.every((record) => views.some((view) => view.id === record.view))).toBe(true);
  });

  it('keeps every generated table current and bracketed by deterministic markers', () => {
    const validation = spawnSync(process.execPath, ['scripts/generate-governance-registers.mjs', '--check'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(validation.status, `${validation.stdout}\n${validation.stderr}`).toBe(0);
    for (const resource of governanceResources) {
      const document = JSON.parse(readFileSync(resource.path, 'utf8')) as { views: Array<{ id: string; document: string }> };
      for (const view of document.views) {
        const markdown = readFileSync(view.document, 'utf8');
        expect(markdown).toContain(`<!-- GENERATED:governance-records:${view.id}:start -->`);
        expect(markdown).toContain(`<!-- GENERATED:governance-records:${view.id}:end -->`);
      }
    }
  });

  it('leaves policy tables and existing assurance projections outside governance-record ownership', () => {
    const viewIds = governanceResources.flatMap((resource) => {
      const document = JSON.parse(readFileSync(resource.path, 'utf8')) as { views: Array<{ id: string }> };
      return document.views.map((view) => view.id);
    });
    expect(viewIds).not.toContain('obligation-trigger-matrix');
    expect(viewIds).not.toContain('security-testing-status-model');
    expect(viewIds).not.toContain('security-risk-register');
    expect(viewIds).not.toContain('ai-risk-register');
    expect(viewIds).not.toContain('objectives');
    expect(viewIds).not.toContain('incidents');
  });
});
