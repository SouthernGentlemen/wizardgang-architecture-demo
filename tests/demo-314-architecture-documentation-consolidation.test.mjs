import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const canonicalDocs = [
  'docs/ASSURANCE.md',
  'docs/REPORTING.md',
  'docs/ROUTE-REGISTRY.md',
];

const retiredDocs = [
  'docs/ASSURANCE-API.md',
  'docs/ASSURANCE-FRESHNESS.md',
  'docs/ASSURANCE-REGISTRY.md',
  'docs/ASSURANCE-RUNTIME.md',
  'docs/EVIDENCE.md',
  'docs/REPORTING-CURSORS.md',
  'docs/FRONTEND-ROUTES.md',
  'docs/ROUTES.md',
];

const retiredNames = retiredDocs.flatMap((path) => [path, path.split('/').at(-1)!]);

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function currentStateFiles() {
  const files = ['README.md', 'AGENTS.md'];
  const walk = (directory) => {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (
          path === 'docs/history'
          || path === 'docs/governance/assessments'
          || path === 'docs/governance/evaluations'
        ) continue;
        walk(path);
      } else if (/\.(?:md|mjs|js|ts|json)$/.test(entry.name)) {
        files.push(relative(root, join(root, path)).replaceAll('\\', '/'));
      }
    }
  };

  for (const directory of ['docs', 'src', 'scripts']) walk(directory);
  return [...new Set(files)].filter((path) => !retiredDocs.includes(path));
}

describe('DEMO-314 architecture documentation consolidation', () => {
  it('keeps exactly the three canonical architecture documents and retires the eight redundant documents', () => {
    for (const path of canonicalDocs) expect(existsSync(join(root, path)), path).toBe(true);
    for (const path of retiredDocs) expect(existsSync(join(root, path)), path).toBe(false);
  });

  it('removes Markdown route-table generation and keeps route generation manifest-only', () => {
    const artifacts = read('src/routing/artifacts.ts');
    expect(artifacts).not.toContain('buildRoutesDocumentation');
    expect(artifacts).not.toContain('documentationTable');
    expect(artifacts).not.toContain('ROUTES.md');

    const generated = read('scripts/validate-generated-artifacts.mjs');
    const routeDefinition = generated.match(/id: 'routes',[\s\S]*?\n  \},/)?.[0] ?? '';
    expect(routeDefinition).toContain("outputs: ['docs/route-manifest.json']");
    expect(routeDefinition).not.toContain('docs/ROUTES.md');

    const scaffold = read('scripts/validate-scaffold.mjs');
    expect(scaffold).not.toContain("'docs/ROUTES.md'");
  });

  it('keeps retired filenames out of permanent current-state docs and active source metadata', () => {
    const offenders = [];
    for (const path of currentStateFiles()) {
      const text = read(path);
      for (const retired of retiredNames) {
        if (text.includes(retired)) offenders.push(`${path} -> ${retired}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps canonical architecture prose current-state only', () => {
    for (const path of canonicalDocs) {
      expect(read(path), path).not.toMatch(/\bDEMO-\d+\b/);
    }
  });

  it('does not recreate a complete Markdown route inventory in the human routing architecture', () => {
    const routes = read('docs/ROUTE-REGISTRY.md');
    expect(routes).not.toContain('| Route ID | Route | Methods |');
    expect(routes).not.toMatch(/^\|\s*\`[^|]+\`\s*\|\s*\`\/(?:[^|]*)\`\s*\|/m);
  });
});
