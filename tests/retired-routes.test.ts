import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

const retiredRoutes = [
  '/api/rest',
  '/api/openapi',
  '/api/graphql',
  '/api/webhooks',
  '/identity/oauth',
  '/identity/sso',
  '/git/versioning',
  '/git/branching',
  '/git/releases',
  '/git/actions',
  '/environments',
  '/governance/iso-27001',
  '/governance/iso-42001',
  '/traceability',
  '/dashboard/health',
] as const;

class RetiredRouteStatement implements D1PreparedStatement {
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
  DEMO_DB: { prepare: (sql: string) => new RetiredRouteStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_ADMIN_USER: 'operator',
  DEMO_ADMIN_PASSWORD: 'test-admin-password',
  BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
};

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.txt', '.yaml', '.yml']);
const excludedFiles = new Set([
  'CHANGELOG.md',
  'docs/INTERACTIVE-DEMO-SPEC.md', // v0.5.0 release design record; retained as historical documentation.
  'tests/retired-routes.test.ts',
]);
const excludedDirectories = ['.git/', '.wrangler/', 'dist/', 'docs/history/', 'docs/releases/', 'node_modules/'];

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
  return new RegExp(`(?:["'\u0060(]|demo\\.wizardgang\\.ai)${escaped}(?=["'\u0060#?\\s)>]|$)`);
}

describe('retired route removal', () => {
  it('lets every retired URL fall through the ordinary 404', async () => {
    for (const route of retiredRoutes) {
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
      const source = readFileSync(file, 'utf8');
      for (const route of retiredRoutes) {
        if (pathReferencePattern(route).test(source)) references.push(`${file}: ${route}`);
      }
    }
    expect(references).toEqual([]);
  });
});
