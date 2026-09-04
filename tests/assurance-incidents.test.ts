import { describe, expect, it } from 'vitest';
import { assuranceIncidentsResponse } from '../src/api/assurance';
import { deriveIncidentCounts } from '../src/assurance/service';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import { renderIncidents } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('public incident and exercise assurance', () => {
  it('derives truthful counts and lifecycle invariants from canonical records', () => {
    const incidents = listPublishedAssuranceRecords('incidents');
    const exercises = listPublishedAssuranceRecords('exercises');
    expect(deriveIncidentCounts(incidents, exercises)).toEqual({
      actualIncidents: incidents.length,
      exercises: exercises.length,
      plannedExercises: exercises.filter((record) => record.status === 'planned').length,
      completedExercises: exercises.filter((record) => ['completed', 'follow-up-open', 'closed'].includes(record.status)).length,
    });

    for (const incident of incidents) {
      expect(incident.id).toMatch(/^INC-[0-9]{3,}$/);
      expect(incident.recordType).toBe('incident');
      expect(incident.simulated).toBe(false);
      expect(incident).toHaveProperty('relationships');
      expect(incident).not.toHaveProperty('riskLinks');
    }
    for (const exercise of exercises) {
      expect(exercise.id).toMatch(/^EX-[0-9]{3,}$/);
      expect(exercise.recordType).toBe('exercise');
      expect(exercise.simulated).toBe(true);
      expect(exercise).toHaveProperty('relationships');
      expect(exercise).not.toHaveProperty('objectiveLinks');
      if (exercise.status === 'planned') {
        expect(exercise).not.toHaveProperty('completedAt');
        expect(exercise).not.toHaveProperty('resultSummary');
      }
    }
  });

  it('publishes incidents and exercises in one common read-only record collection', async () => {
    const incidents = listPublishedAssuranceRecords('incidents');
    const exercises = listPublishedAssuranceRecords('exercises');
    const response = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json() as {
      dataset: string;
      datasets: string[];
      records: Array<{ id: string; recordType: string; relationships: Record<string, string[]> }>;
      derived: { count: number; totalAvailable: number };
      incidents?: unknown;
      exercises?: unknown;
    };
    expect(body.dataset).toBe('incidents');
    expect(body.datasets).toEqual(['incidents', 'exercises']);
    expect(body.records).toEqual([...incidents, ...exercises]);
    expect(body.derived.count).toBe(incidents.length + exercises.length);
    expect(body.derived.totalAvailable).toBe(incidents.length + exercises.length);
    expect(body).not.toHaveProperty('incidents');
    expect(body).not.toHaveProperty('exercises');

    const rejected = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
  });

  it('renders permanent anchors only for canonical records and uses empty-state copy only when the dataset is empty', async () => {
    const incidents = listPublishedAssuranceRecords('incidents');
    const exercises = listPublishedAssuranceRecords('exercises');
    const response = renderIncidents(env);
    const html = await response.text();
    const renderedIncidentIds = [...html.matchAll(/id="(INC-[0-9]{3,})"/g)].map((match) => match[1]);
    const renderedExerciseIds = [...html.matchAll(/id="(EX-[0-9]{3,})"/g)].map((match) => match[1]);
    expect(renderedIncidentIds).toEqual(incidents.map((record) => record.id));
    expect(renderedExerciseIds).toEqual(exercises.map((record) => record.id));

    if (incidents.length === 0) expect(html).toContain('No actual incident records are established');
    if (exercises.some((record) => record.status === 'planned')) {
      expect(html).toContain('Planned only. This record is not evidence that the exercise has occurred.');
    }
    expect(html).toContain('Vulnerabilities');
    expect(html).toContain('Advisories');
  });
});
