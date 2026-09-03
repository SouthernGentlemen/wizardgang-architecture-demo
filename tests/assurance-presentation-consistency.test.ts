import { describe, expect, it } from 'vitest';
import { assuranceIncidentsResponse, assuranceRisksResponse } from '../src/api/assurance';
import { deriveRiskCounts, type PublicIncident, type PublicExercise, type PublicRisk } from '../src/assurance/registry';
import { renderIncidents, renderRisks } from '../src/demos/assurance-pages';
import type { Env } from '../src/types';

const environment = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as unknown as Env;

type RiskApiBody = {
  counts: ReturnType<typeof deriveRiskCounts>;
  totalAvailable: number;
  records: PublicRisk[];
};

type IncidentApiBody = {
  counts: {
    actualIncidents: number;
    exercises: number;
    plannedExercises: number;
    completedExercises: number;
  };
  incidents: PublicIncident[];
  exercises: PublicExercise[];
};

function riskProjectionErrors(body: RiskApiBody, html: string): string[] {
  const errors: string[] = [];
  const htmlIds = [...html.matchAll(/<article class="info-card" id="((?:SEC|AI)-RISK-[0-9]{3})">/g)].map((match) => match[1]);
  const apiIds = body.records.map((record) => record.id);
  if (JSON.stringify(htmlIds) !== JSON.stringify(apiIds)) errors.push('risk HTML record IDs do not match the API record set');

  const counts = body.counts;
  const summary = `<strong>${counts.total}</strong> matching records · ${counts.byFramework.security} security · ${counts.byFramework.ai} AI · ${counts.byResidualRating.high} high residual · ${counts.byResidualRating.moderate} moderate residual · ${counts.byResidualRating.low} low residual.`;
  if (!html.includes(summary)) errors.push('risk HTML counts do not match API counts');
  return errors;
}

function incidentProjectionErrors(body: IncidentApiBody, html: string): string[] {
  const errors: string[] = [];
  const htmlIds = [...html.matchAll(/<article class="info-card" id="((?:INC|EX)-[0-9]{3,})">/g)].map((match) => match[1]);
  const apiIds = [...body.incidents.map((record) => record.id), ...body.exercises.map((record) => record.id)];
  if (JSON.stringify(htmlIds) !== JSON.stringify(apiIds)) errors.push('incident/exercise HTML record IDs do not match the API record set');

  const counts = body.counts;
  const summary = `<strong>Current retained posture:</strong> ${counts.actualIncidents} established actual incident records; ${counts.exercises} exercise record, of which ${counts.plannedExercises} is planned and ${counts.completedExercises} is completed or in post-exercise follow-up.`;
  if (!html.includes(summary)) errors.push('incident/exercise HTML counts do not match API counts');
  return errors;
}

describe('public assurance API and HTML projection consistency', () => {
  it.each([
    '',
    '?framework=security&status=treating&residual=high',
    '?framework=ai&status=open',
    '?framework=security&residual=moderate',
  ])('keeps risk API records and HTML cards/counts identical for %s', async (query) => {
    const apiResponse = assuranceRisksResponse(new Request(`https://demo.wizardgang.ai/v1/assurance/risks${query}`));
    const body = await apiResponse.json() as RiskApiBody;
    const htmlResponse = renderRisks(new Request(`https://demo.wizardgang.ai/governance/risks${query}`), environment);
    const html = await htmlResponse.text();
    expect(riskProjectionErrors(body, html)).toEqual([]);
  });

  it('keeps incident and exercise API records and HTML cards/counts identical', async () => {
    const apiResponse = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents'));
    const body = await apiResponse.json() as IncidentApiBody;
    const htmlResponse = renderIncidents(environment);
    const html = await htmlResponse.text();
    expect(incidentProjectionErrors(body, html)).toEqual([]);
  });

  it('proves the risk and incident consistency assertions reject drift', async () => {
    const riskResponse = assuranceRisksResponse(new Request('https://demo.wizardgang.ai/v1/assurance/risks?framework=security&residual=high'));
    const riskBody = await riskResponse.json() as RiskApiBody;
    const riskHtml = await renderRisks(new Request('https://demo.wizardgang.ai/governance/risks?framework=security&residual=high'), environment).text();
    const riskDrift = structuredClone(riskBody);
    riskDrift.counts.total += 1;
    expect(riskProjectionErrors(riskDrift, riskHtml)).toContain('risk HTML counts do not match API counts');

    const incidentResponse = assuranceIncidentsResponse(new Request('https://demo.wizardgang.ai/v1/assurance/incidents'));
    const incidentBody = await incidentResponse.json() as IncidentApiBody;
    const incidentHtml = await renderIncidents(environment).text();
    const firstRecordId = [...incidentBody.incidents, ...incidentBody.exercises][0]?.id;
    expect(firstRecordId).toBeDefined();
    const incidentDriftHtml = incidentHtml.replace(`id="${firstRecordId}"`, `id="REMOVED-${firstRecordId}"`);
    expect(incidentProjectionErrors(incidentBody, incidentDriftHtml)).toContain('incident/exercise HTML record IDs do not match the API record set');
  });
});
