import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry } from '../src/routing/application-routes';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';
import {
  referenceFreeRemovedHtml404Pathnames,
  removedHtml404Pathnames,
  removedHtmlPathnames,
} from './fixtures/removed-html-pathnames';
import { retiredApiReferencePrefixes } from './fixtures/removed-api-pathnames';

class RemovedRouteStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: {} }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-05T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-05T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new RemovedRouteStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_ADMIN_USER: 'operator',
  DEMO_ADMIN_PASSWORD: 'test-admin-password',
  BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
};

const removedRouteReferences = [...new Set([
  ...referenceFreeRemovedHtml404Pathnames,
  ...retiredApiReferencePrefixes,
])];

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.txt', '.yaml', '.yml']);
const excludedFiles = new Set([
  'CHANGELOG.md',
  'docs/INTERACTIVE-DEMO-SPEC.md',
  'tests/fixtures/removed-api-pathnames.ts',
  'tests/fixtures/removed-html-pathnames.ts',
  'tests/removed-api-routes.test.ts',
  'tests/removed-routes.test.ts',
]);
const excludedDirectories = ['.git/', '.wrangler/', 'dist/', 'docs/history/', 'docs/releases/', 'node_modules/'];
const maxReferenceFailures = 50;

function repositoryTextFiles(directory = '.'): string[] {
  const files: string[] = [];
  for (const name of readdirSync(directory)) {
    const fullPath = path.join(directory, name);
    const relativePath = fullPath.replace(/^\.\//, '').replaceAll('\\', '/');
    if (excludedDirectories.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix))) continue;
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...repositoryTextFiles(fullPath));
      continue;
    }
    if (!textExtensions.has(path.extname(name))) continue;
    if (excludedFiles.has(relativePath)) continue;
    files.push(relativePath);
  }
  return files;
}

function pathReferencePattern(route: string): RegExp {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:["'\u0060(]|demo\\.wizardgang\\.ai)${escaped}(?=["'\u0060#?\\s)>/]|$)`);
}

describe('removed route handling', () => {
  it('keeps every superseded route ID registered', () => {
    const routeIds = new Set(applicationRouteRegistry.declarations.map((route) => route.id));
    const unknown = removedHtmlPathnames
      .filter((entry) => 'supersededBy' in entry)
      .filter((entry) => !routeIds.has(entry.supersededBy))
      .map((entry) => `${entry.pathname}: ${entry.supersededBy}`);
    expect(unknown).toEqual([]);
  });

  it('lets every removed HTML URL fall through the ordinary 404', async () => {
    for (const route of removedHtml404Pathnames) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${route}`, {
        headers: { accept: 'text/html' },
      }), environment);
      expect(response.status, route).toBe(404);
      expect(response.headers.get('location'), route).toBeNull();
    }
  });

  it('contains no current runtime, documentation, test, or internal-link references to retired URLs', () => {
    const references: string[] = [];
    for (const file of repositoryTextFiles()) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      for (const [index, line] of lines.entries()) {
        for (const route of removedRouteReferences) {
          if (!pathReferencePattern(route).test(line)) continue;
          references.push(`${file}:${index + 1}: ${route}`);
          if (references.length >= maxReferenceFailures) break;
        }
        if (references.length >= maxReferenceFailures) break;
      }
      if (references.length >= maxReferenceFailures) break;
    }
    expect(
      references,
      'Remove retired URL references or move deliberate dead-route contract data into the excluded fixtures/tests.',
    ).toEqual([]);
  });
});
