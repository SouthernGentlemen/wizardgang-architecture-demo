import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceRelationshipIds } from '../src/assurance/relationship-contract.js';
import { resolveAssuranceDocumentationReference } from '../src/assurance/presentation';
import {
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
} from '../src/assurance/publication';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import { removedPlatformLaboratoryPathnames } from './fixtures/removed-api-pathnames';
import type { D1PreparedStatement, Env } from '../src/types';

class Statement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-17T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-17T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const origin = 'https://demo.wizardgang.ai';
const deployedSha = '0123456789abcdef0123456789abcdef01234567';
const env = {
  DEMO_DB: { prepare: (sql: string) => new Statement(sql) },
  DEMO_SESSION_SECRET: 'test-assurance-assessment-acceptance-secret',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: deployedSha,
  DEPLOYED_VERSION: 'acceptance-v0.24.0',
} as Env;

const statuses = ['pass', 'partial', 'gap', 'not-applicable'] as const;
const legacyStatuses = ['met', 'demonstrated', 'not-observed'] as const;
const retiredLaboratoryPathnames = removedPlatformLaboratoryPathnames.slice(-3);

async function requestHtml(path: string) {
  const response = await routeRequest(new Request(origin + path, { headers: { accept: 'text/html' } }), env);
  return { response, html: await response.text() };
}

function visibleText(markup: string): string {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function embeddedSummaries(html: string): Array<{ id: string; framework: string; section: string; status: string }> {
  const match = html.match(/<script\b[^>]*\bdata-assurance-browser=""[^>]*\bdata-config="([^"]+)"/);
  if (!match) throw new Error('The assurance workbench did not publish its canonical record summaries.');
  const serialized = match[1]
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
  return JSON.parse(serialized).records;
}

function countPosture(records: Array<{ status: string }>) {
  return Object.fromEntries(statuses.map((status) => [status, records.filter((record) => record.status === status).length]));
}

function renderedPostures(html: string) {
  return [...html.matchAll(/data-posture-count="([^"]+)">(\d+)</g)]
    .map((match) => ({ status: match[1], count: Number(match[2]) }));
}

describe('DEMO-290 assurance assessment acceptance', () => {
  it('enforces the completed assessment contract and bidirectional Markdown documentation mapping', () => {
    const records = listPublishedAssuranceRecords('compliance');
    expect(records).toHaveLength(287);

    for (const record of records) {
      expect(legacyStatuses).not.toContain(record.status as typeof legacyStatuses[number]);
      expect(String(record.rationale ?? '').trim().length, record.id + ': rationale').toBeGreaterThanOrEqual(10);

      if (record.status === 'partial' || record.status === 'gap') {
        expect(record.gaps?.length ?? 0, record.id + ': gaps').toBeGreaterThan(0);
      }

      const documentation = assuranceRelationshipIds(record.relationships, 'documentation');
      if (record.status === 'pass' || record.status === 'partial' || record.status === 'not-applicable') {
        expect(documentation.length, record.id + ': documentation').toBeGreaterThan(0);
      }

      if (record.kind === 'clause') expect(record.status, record.id + ': clause applicability').not.toBe('not-applicable');
    }

    const documentationValidation = execFileSync(process.execPath, ['scripts/validate-assurance-documentation.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(documentationValidation).toContain('Assurance documentation reference validation passed for 287 compliance records');
    expect(documentationValidation).toContain('structured compliance relationships to tracked Markdown headings');
  });

  it('keeps the retired check UI out of the public assurance output', async () => {
    const { response, html } = await requestHtml(routeUrl('assurance.index'));
    expect(response.status).toBe(200);
    expect(html).not.toMatch(/<section\b[^>]*class="[^"]*\bassurance-check\b/i);

    const controls = [...html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map((match) => visibleText(match[2]));
    expect(controls.some((label) => /^Run(?:\s|$)/i.test(label))).toBe(false);
  });

  it('renders every record with its documentation and resolved evidence locations pinned to deployment where applicable', async () => {
    const records = listPublishedAssuranceRecords('compliance');
    const evidenceById = new Map(presentedPublishedEvidenceRecords(env, origin).map((record) => [record.id, record]));

    for (const record of records) {
      const { response, html } = await requestHtml(routeUrl('assurance.presentation', { record: record.id }) + '?rev=' + deployedSha);
      expect(response.status, record.id).toBe(200);
      expect(html, record.id).toContain('data-assurance-record="' + record.id + '"');

      const documentation = assuranceRelationshipIds(record.relationships, 'documentation');
      expect(documentation.length, record.id + ': pane documentation').toBeGreaterThan(0);
      for (const reference of documentation) {
        const resolved = resolveAssuranceDocumentationReference(reference, env);
        expect(resolved.resolution, reference).toBe('deployed-commit');
        expect(resolved.revision, reference).toBe(deployedSha);
        expect(resolved.url, reference).toContain('/blob/' + deployedSha + '/');
        expect(html, record.id + ': ' + reference).toContain('href="' + resolved.url + '"');
      }

      const evidenceIds = assuranceRelationshipIds(record.relationships, 'evidence');
      expect(evidenceIds.length, record.id + ': evidence').toBeGreaterThan(0);
      for (const evidenceId of evidenceIds) {
        const evidence = evidenceById.get(evidenceId);
        if (!evidence) throw new Error(record.id + ': unresolved published evidence ' + evidenceId);
        expect(evidence.resolved.url, record.id + ': ' + evidenceId).toBeTruthy();
        expect(html, record.id + ': ' + evidenceId).toContain('href="' + evidence.resolved.url + '"');
        if (evidence.resolved.kind === 'repository') {
          expect(evidence.resolved.revision, evidenceId).toBe(deployedSha);
          expect(evidence.resolved.url, evidenceId).toContain('/blob/' + deployedSha + '/');
        }
      }

      expect(html, record.id).not.toContain('/blob/main/');
    }
  });

  it('derives complete four-status posture for every framework and section and publishes the same record set to the workbench', async () => {
    const canonical = listPublishedAssuranceRecords('compliance');
    const { html } = await requestHtml(routeUrl('assurance.index'));
    const summaries = embeddedSummaries(html);
    expect(summaries).toHaveLength(canonical.length);

    const canonicalById = new Map(canonical.map((record) => [record.id, record]));
    for (const summary of summaries) {
      const record = canonicalById.get(summary.id);
      expect(record, summary.id).toBeDefined();
      expect(summary.framework, summary.id).toBe(record?.framework);
      expect(summary.section, summary.id).toBe(record?.section);
      expect(summary.status, summary.id).toBe(record?.status);
    }

    const groups = new Map<string, typeof summaries>();
    for (const summary of summaries) {
      for (const key of [summary.framework, summary.framework + '::' + summary.section]) {
        const values = groups.get(key) ?? [];
        values.push(summary);
        groups.set(key, values);
      }
    }

    for (const [key, records] of groups) {
      const counts = countPosture(records);
      expect(Object.keys(counts), key).toEqual(statuses);
      expect(Object.values(counts).reduce((sum, value) => sum + value, 0), key).toBe(records.length);
    }

    const initial = canonical.find((record) => record.id === 'ISO27001-A.5.1');
    if (!initial) throw new Error('Missing default assurance record.');
    const expectedSection = countPosture(canonical.filter((record) => record.framework === initial.framework && record.section === initial.section));
    const expectedFramework = countPosture(canonical.filter((record) => record.framework === initial.framework));
    const rendered = renderedPostures(html);
    expect(rendered).toHaveLength(8);
    expect(Object.fromEntries(rendered.slice(0, 4).map((entry) => [entry.status, entry.count]))).toEqual(expectedSection);
    expect(Object.fromEntries(rendered.slice(4, 8).map((entry) => [entry.status, entry.count]))).toEqual(expectedFramework);
  });

  it('resolves every public record ID through the presentation route and rejects unknown IDs', async () => {
    const records = listPublishedAssuranceRecords('compliance');
    const page = await requestHtml(routeUrl('assurance.index'));
    const ids = new Set(embeddedSummaries(page.html).map((record) => record.id));

    for (const record of records) {
      expect(ids.has(record.id), record.id + ': workbench selection inventory').toBe(true);
      const { response, html } = await requestHtml(routeUrl('assurance.presentation', { record: record.id }) + '?rev=' + deployedSha);
      expect(response.status, record.id).toBe(200);
      expect(html, record.id).toContain('data-assurance-record="' + record.id + '"');
    }

    const unknown = await routeRequest(new Request(origin + routeUrl('assurance.presentation', { record: 'NOT-A-RECORD' }), { headers: { accept: 'text/html' } }), env);
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get('location')).toBeNull();
  });

  it('keeps the three retired governance laboratory paths on the ordinary no-redirect 404', async () => {
    for (const pathname of retiredLaboratoryPathnames) {
      const response = await routeRequest(new Request(origin + pathname), env);
      expect(response.status, pathname).toBe(404);
      expect(response.headers.get('location'), pathname).toBeNull();
    }
  });

  it('keeps the MCP negative boundary cases executable in the dedicated client test', () => {
    const output = execFileSync(process.execPath, [
      'node_modules/vitest/vitest.mjs',
      'run',
      'tests/mcp-client.test.ts',
      '--reporter=verbose',
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 30_000,
    });

    for (const caseName of [
      'rejects an unknown MCP method at the real MCP boundary',
      'rejects an invalid demo-record namespace at the real MCP boundary',
      'rejects a prohibited write tool at the real MCP boundary',
    ]) {
      expect(output).toContain(caseName);
    }
  });

  it('records complete WCAG structured scope and representative browser/axe coverage in English and Arabic', () => {
    const wcagRecords = listPublishedAssuranceRecords('compliance')
      .filter((record) => record.id.startsWith('WCAG-'));
    expect(wcagRecords).toHaveLength(86);
    expect(new Set(wcagRecords.map((record) => record.id)).size).toBe(86);

    const registry = JSON.parse(readFileSync('assurance/compliance/wcag-2.2.json', 'utf8')) as {
      scope: string;
      sources: { normative: string };
    };
    expect(registry.scope).toContain('every canonical public HTML page');
    expect(registry.scope).toContain('English and Arabic');
    expect(registry.sources.normative).toBe('https://www.w3.org/TR/WCAG22/');

    const audit = JSON.parse(readFileSync('config/site-audit-states.json', 'utf8')) as {
      states: Array<{ name: string; path: string }>;
    };
    const assurancePath = routeUrl('assurance.index');
    const assuranceStates = audit.states.filter((state) => state.path.startsWith(assurancePath));
    expect(assuranceStates.length).toBeGreaterThanOrEqual(4);
    expect(assuranceStates.some((state) => state.path.includes('ISO27001-A.5.1'))).toBe(true);
    expect(assuranceStates.some((state) => state.path.includes('ISO27001-A.5.19'))).toBe(true);
    expect(assuranceStates.some((state) => state.path.includes('WCAG-1.1.1'))).toBe(true);
    expect(assuranceStates.some((state) => state.path.includes('lang=ar'))).toBe(true);

    const evaluation = readFileSync('scripts/demo-289-site-evaluation.mjs', 'utf8');
    expect(evaluation).toContain('chromeExecutable');
    expect(evaluation).toContain('axe-core');
    expect(evaluation).toContain("for (const locale of ['en','ar'])");
    expect(evaluation).toContain('auditConfig.states.map');
  });
});
