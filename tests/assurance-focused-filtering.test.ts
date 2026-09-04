import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { assuranceIncidentsResponse } from '../src/api/assurance';
import { selectFocusedAssuranceRecords } from '../src/api/assurance-filtering';
import { assuranceEvidenceResponse } from '../src/api/assurance-registry';
import { assuranceRuntimeFilterVocabularies } from '../src/assurance/generated/registry-bindings';
import { primaryAssuranceResource, type AssuranceDataset } from '../src/assurance/model';
import {
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
} from '../src/assurance/publication';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

interface MutableFilterResource {
  filters?: Record<string, { path: string; label: string }>;
}

const vocabularies = assuranceRuntimeFilterVocabularies as unknown as Record<
  string,
  Record<string, readonly string[]>
>;
const restoreFixtureDeclarations: Array<() => void> = [];

function declareFixtureFilter(
  dataset: AssuranceDataset,
  parameter: string,
  path: string,
  allowed: readonly string[],
): void {
  const resource = primaryAssuranceResource(dataset) as MutableFilterResource;
  const previousFilters = resource.filters;
  const previousVocabulary = vocabularies[dataset];

  resource.filters = {
    ...(previousFilters ?? {}),
    [parameter]: { path, label: parameter },
  };
  vocabularies[dataset] = {
    ...(previousVocabulary ?? {}),
    [parameter]: [...allowed],
  };

  restoreFixtureDeclarations.push(() => {
    resource.filters = previousFilters;
    if (previousVocabulary) vocabularies[dataset] = previousVocabulary;
    else delete vocabularies[dataset];
  });
}

afterEach(() => {
  while (restoreFixtureDeclarations.length > 0) restoreFixtureDeclarations.pop()?.();
});

describe('focused assurance registry-declared filtering', () => {
  it('applies a fixture-declared evidence kind filter before counts and pagination', async () => {
    declareFixtureFilter(
      'evidence',
      'kind',
      'kind',
      ['source', 'test', 'workflow', 'governance-record', 'release', 'live-route', 'observation'],
    );

    const origin = 'https://demo.wizardgang.ai';
    const expected = presentedPublishedEvidenceRecords(environment, origin)
      .filter((record) => record.kind === 'source');
    expect(expected).toHaveLength(7);

    const response = assuranceEvidenceResponse(
      new Request(`${origin}/v1/assurance/evidence?kind=source&limit=2`),
      environment,
    );
    expect(response.status).toBe(200);
    const body = await response.json() as {
      count: number;
      records: Array<{ id: string; kind: string }>;
      pagination: { total: number; returned: number; nextCursor: string | null };
    };

    expect(body.count).toBe(expected.length);
    expect(body.records.map((record) => record.id)).toEqual(expected.slice(0, 2).map((record) => record.id));
    expect(body.records.every((record) => record.kind === 'source')).toBe(true);
    expect(body.pagination.total).toBe(expected.length);
    expect(body.pagination.returned).toBe(2);
    expect(body.pagination.nextCursor).toBe(expected[1].id);
  });

  it('rejects invalid, empty, and repeated declared evidence filters while ignoring undeclared parameters', async () => {
    declareFixtureFilter(
      'evidence',
      'kind',
      'kind',
      ['source', 'test', 'workflow', 'governance-record', 'release', 'live-route', 'observation'],
    );

    const origin = 'https://demo.wizardgang.ai';
    const cases = [
      [`${origin}/v1/assurance/evidence?kind=unsupported`, 'unsupported'],
      [`${origin}/v1/assurance/evidence?kind=`, ''],
    ] as const;
    for (const [url, value] of cases) {
      const response = assuranceEvidenceResponse(new Request(url), environment);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: 'invalid_filter',
        parameter: 'kind',
        value,
      });
    }

    const repeated = assuranceEvidenceResponse(
      new Request(`${origin}/v1/assurance/evidence?kind=source&kind=test`),
      environment,
    );
    expect(repeated.status).toBe(400);
    expect(await repeated.json()).toMatchObject({
      error: 'invalid_filter',
      parameter: 'kind',
      value: ['source', 'test'],
    });

    const allRecords = presentedPublishedEvidenceRecords(environment, origin);
    const undeclared = assuranceEvidenceResponse(
      new Request(`${origin}/v1/assurance/evidence?futureParameter=ignored&q=source`),
      environment,
    );
    expect(undeclared.status).toBe(200);
    const undeclaredBody = await undeclared.json() as { count: number; records: Array<{ id: string }> };
    expect(undeclaredBody.count).toBe(allRecords.length);
    expect(undeclaredBody.records.map((record) => record.id)).toEqual(allRecords.map((record) => record.id));
  });

  it('uses the incident route owner for a shared incident and exercise filter contract', async () => {
    declareFixtureFilter('incidents', 'recordType', 'recordType', ['incident', 'exercise']);

    const expectedExercises = listPublishedAssuranceRecords('exercises');
    expect(expectedExercises.length).toBeGreaterThan(0);
    const response = assuranceIncidentsResponse(new Request(
      'https://demo.wizardgang.ai/v1/assurance/incidents?recordType=exercise&limit=1',
    ));
    expect(response.status).toBe(200);
    const body = await response.json() as {
      counts: { actualIncidents: number; exercises: number; plannedExercises: number; completedExercises: number };
      incidents: Array<{ id: string }>;
      exercises: Array<{ id: string }>;
      pagination: { total: number };
    };

    expect(body.incidents).toEqual([]);
    expect(body.exercises.map((record) => record.id)).toEqual(expectedExercises.slice(0, 1).map((record) => record.id));
    expect(body.counts.actualIncidents).toBe(0);
    expect(body.counts.exercises).toBe(expectedExercises.length);
    expect(body.pagination.total).toBe(expectedExercises.length);

    const invalid = assuranceIncidentsResponse(new Request(
      'https://demo.wizardgang.ai/v1/assurance/incidents?recordType=advisory',
    ));
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({
      error: 'invalid_filter',
      parameter: 'recordType',
      value: 'advisory',
    });
  });

  it('runs nonempty advisory fixtures through the same focused selection pipeline', async () => {
    declareFixtureFilter('advisories', 'severity', 'severity', ['low', 'moderate', 'high', 'critical']);
    const fixture = JSON.parse(
      readFileSync('tests/fixtures/assurance/advisories/valid-nonempty.json', 'utf8'),
    ) as { records: Array<{ id: string; severity: string }> };

    const lowUrl = new URL('https://demo.wizardgang.ai/v1/assurance/advisories?severity=low');
    const low = selectFocusedAssuranceRecords(
      new Request(lowUrl),
      lowUrl,
      ['advisories'],
      fixture.records,
    );
    expect(low).not.toBeInstanceOf(Response);
    if (low instanceof Response) throw new Error('Expected advisory fixture selection.');
    expect(low.filterOwner).toBe('advisories');
    expect(low.records.map((record) => record.id)).toEqual(['GHSA-aaaa-bbbb-cccc']);

    const highUrl = new URL('https://demo.wizardgang.ai/v1/assurance/advisories?severity=high');
    const high = selectFocusedAssuranceRecords(
      new Request(highUrl),
      highUrl,
      ['advisories'],
      fixture.records,
    );
    expect(high).not.toBeInstanceOf(Response);
    if (high instanceof Response) throw new Error('Expected advisory fixture selection.');
    expect(high.records).toEqual([]);

    const invalidUrl = new URL('https://demo.wizardgang.ai/v1/assurance/advisories?severity=unknown');
    const invalid = selectFocusedAssuranceRecords(
      new Request(invalidUrl),
      invalidUrl,
      ['advisories'],
      fixture.records,
    );
    expect(invalid).toBeInstanceOf(Response);
    if (!(invalid instanceof Response)) throw new Error('Expected advisory fixture filter error.');
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: 'invalid_filter', parameter: 'severity', value: 'unknown' });
  });

  it('does not add fixture-only filters to the canonical registry', () => {
    const registry = JSON.parse(readFileSync('assurance/registry.json', 'utf8')) as {
      datasets: Array<{ kind: string; filters?: unknown }>;
    };
    for (const kind of ['evidence', 'incidents', 'advisories']) {
      expect(registry.datasets.find((dataset) => dataset.kind === kind)?.filters).toBeUndefined();
    }
  });
});
