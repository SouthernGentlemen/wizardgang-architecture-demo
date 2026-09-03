import { describe, expect, it } from 'vitest';
import { assuranceIncidentsResponse } from '../src/api/assurance';
import { publicAssuranceRegistry } from '../src/assurance/registry';
import { renderIncidents } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('public incident and exercise assurance', () => {
  it('derives truthful counts without fabricating incident history or exercise completion', () => {
    expect(publicAssuranceRegistry.incidentCounts).toEqual({
      actualIncidents: 0,
      exercises: 1,
      plannedExercises: 1,
      completedExercises: 0,
    });
    expect(publicAssuranceRegistry.incidents).toEqual([]);
    expect(publicAssuranceRegistry.exercises).toHaveLength(1);
    expect(publicAssuranceRegistry.exercises[0]).toMatchObject({
      id: 'EX-001',
      recordType: 'exercise',
      simulated: true,
      exerciseType: 'Tabletop / response exercise',
      scenario: 'Combined security + AI/MCP incident scenario',
      status: 'planned',
      dueDate: '2026-12-02',
      riskLinks: [],
      objectiveLinks: ['SEC-OBJ-005'],
      evidence: [],
    });
    expect(publicAssuranceRegistry.exercises[0]).not.toHaveProperty('completedAt');
    expect(publicAssuranceRegistry.exercises[0]).not.toHaveProperty('resultSummary');
  });

  it('publishes the combined read-only assurance API', async () => {
    const response = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json() as {
      dataset: string;
      counts: typeof publicAssuranceRegistry.incidentCounts;
      incidents: unknown[];
      exercises: Array<{ id: string; status: string; simulated: boolean }>;
    };
    expect(body.dataset).toBe('incidents');
    expect(body.counts.actualIncidents).toBe(0);
    expect(body.incidents).toEqual([]);
    expect(body.exercises[0]).toMatchObject({ id: 'EX-001', status: 'planned', simulated: true });

    const rejected = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
  });

  it('renders permanent anchors only for records that actually exist', async () => {
    const response = renderIncidents(env);
    const html = await response.text();
    expect(html).toContain('id="EX-001"');
    expect(html).not.toContain('id="INC-001"');
    expect(html).toContain('No actual incident records are established');
    expect(html).toContain('Planned only. This record is not evidence that the exercise has occurred.');
    expect(html).toContain('Vulnerabilities');
    expect(html).toContain('Advisories');
  });
});
