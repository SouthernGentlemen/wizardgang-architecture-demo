import { describe, expect, it } from 'vitest';
import { assuranceIncidentsResponse } from '../src/api/assurance';
import { deriveIncidentCounts, publicAssuranceRegistry } from '../src/assurance/registry';
import { renderIncidents } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('public incident and exercise assurance', () => {
  it('derives truthful counts and lifecycle invariants from whatever canonical records are established', () => {
    const incidents = publicAssuranceRegistry.incidents;
    const exercises = publicAssuranceRegistry.exercises;
    expect(publicAssuranceRegistry.incidentCounts).toEqual(deriveIncidentCounts(incidents, exercises));

    for (const incident of incidents) {
      expect(incident.id).toMatch(/^INC-[0-9]{3,}$/);
      expect(incident.recordType).toBe('incident');
      expect(incident.simulated).toBe(false);
    }
    for (const exercise of exercises) {
      expect(exercise.id).toMatch(/^EX-[0-9]{3,}$/);
      expect(exercise.recordType).toBe('exercise');
      expect(exercise.simulated).toBe(true);
      if (exercise.status === 'planned') {
        expect(exercise).not.toHaveProperty('completedAt');
        expect(exercise).not.toHaveProperty('resultSummary');
      }
    }
  });

  it('publishes the combined read-only assurance API from the same canonical records', async () => {
    const response = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json() as {
      dataset: string;
      counts: typeof publicAssuranceRegistry.incidentCounts;
      incidents: typeof publicAssuranceRegistry.incidents;
      exercises: typeof publicAssuranceRegistry.exercises;
    };
    expect(body.dataset).toBe('incidents');
    expect(body.counts).toEqual(deriveIncidentCounts(publicAssuranceRegistry.incidents, publicAssuranceRegistry.exercises));
    expect(body.incidents).toEqual(publicAssuranceRegistry.incidents);
    expect(body.exercises).toEqual(publicAssuranceRegistry.exercises);

    const rejected = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
  });

  it('renders permanent anchors only for canonical records and uses empty-state copy only when the dataset is empty', async () => {
    const response = renderIncidents(env);
    const html = await response.text();
    const renderedIncidentIds = [...html.matchAll(/id="(INC-[0-9]{3,})"/g)].map((match) => match[1]);
    const renderedExerciseIds = [...html.matchAll(/id="(EX-[0-9]{3,})"/g)].map((match) => match[1]);
    expect(renderedIncidentIds).toEqual(publicAssuranceRegistry.incidents.map((record) => record.id));
    expect(renderedExerciseIds).toEqual(publicAssuranceRegistry.exercises.map((record) => record.id));

    if (publicAssuranceRegistry.incidents.length === 0) {
      expect(html).toContain('No actual incident records are established');
    }
    if (publicAssuranceRegistry.exercises.some((record) => record.status === 'planned')) {
      expect(html).toContain('Planned only. This record is not evidence that the exercise has occurred.');
    }
    expect(html).toContain('Vulnerabilities');
    expect(html).toContain('Advisories');
  });
});
