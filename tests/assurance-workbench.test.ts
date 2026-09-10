import { describe, expect, it } from 'vitest';
import {
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
} from '../src/assurance/publication';
import {
  deriveComplianceCounts,
  deriveIncidentCounts,
  deriveRiskCounts,
} from '../src/assurance/service';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class AssuranceWorkbenchStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-10T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-10T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new AssuranceWorkbenchStatement(sql) },
  DEMO_SESSION_SECRET: 'test-assurance-workbench-cursor-secret-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

async function assuranceHtml(path = routeUrl('assurance.index')): Promise<{ response: Response; html: string }> {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
    headers: { accept: 'text/html' },
  }), environment);
  return { response, html: await response.text() };
}

describe('summary-first assurance workbench', () => {
  it('orders the workbench by human task and keeps demonstrations above registries', async () => {
    const { response, html } = await assuranceHtml();
    expect(response.status).toBe(200);

    const orderedIds = ['posture', 'frameworks', 'risks', 'evidence', 'governance', 'activity'];
    const positions = orderedIds.map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));

    expect(html.indexOf('id="iso-27001"')).toBeLessThan(html.indexOf('data-assurance-collection="frameworks"'));
    expect(html.indexOf('id="iso-42001"')).toBeLessThan(html.indexOf('data-assurance-collection="frameworks"'));
    expect(html.indexOf('id="wcag-2-2-posture"')).toBeLessThan(html.indexOf('data-assurance-collection="frameworks"'));
    expect(html.indexOf('id="traceability"')).toBeLessThan(html.indexOf('data-assurance-collection="frameworks"'));
  });

  it('derives visible summary counts from canonical assurance services', async () => {
    const { html } = await assuranceHtml();
    const compliance = listPublishedAssuranceRecords('compliance');
    const risks = listPublishedAssuranceRecords('risks');
    const incidents = listPublishedAssuranceRecords('incidents');
    const exercises = listPublishedAssuranceRecords('exercises');
    const evidence = presentedPublishedEvidenceRecords(environment, 'https://demo.wizardgang.ai');
    const complianceCounts = deriveComplianceCounts(compliance);
    const riskCounts = deriveRiskCounts(risks);
    const incidentCounts = deriveIncidentCounts(incidents, exercises);

    expect(html).toContain(`${complianceCounts.total} framework records`);
    expect(html).toContain(`${riskCounts.total} published risks`);
    expect(html).toContain(`${evidence.length} published evidence records`);
    expect(html).toContain(`${incidentCounts.actualIncidents} incidents · ${incidentCounts.exercises} exercises`);
  });

  it('does not append the generic reporting presenter or eagerly expose raw collections', async () => {
    const { html } = await assuranceHtml();
    expect(html).not.toContain('Shared reporting projection');
    expect(html).not.toContain('id="assurance-reporting"');
    expect(html).not.toContain('assurance-reporting-heading');

    for (const collection of ['claims', 'frameworks', 'risks', 'evidence', 'governance', 'activity']) {
      expect(html).toMatch(new RegExp(`<details class="implementation-notes" data-assurance-collection="${collection}">`));
      expect(html).not.toMatch(new RegExp(`<details[^>]*data-assurance-collection="${collection}"[^>]*\\sopen(?:[=\\s>])`));
    }
  });

  it('uses query parameters only for filtering/search while fragments identify workbench sections', async () => {
    const assuranceRoute = routeUrl('assurance.index');
    const { response, html } = await assuranceHtml(`${assuranceRoute}?framework=wcag-2.2&q=keyboard`);
    expect(response.status).toBe(200);
    expect(html).toContain('option value="wcag-2.2" selected');
    expect(html).toContain('name="q" type="search" value="keyboard"');
    expect(html).not.toContain('name="view"');
    expect(html).not.toContain(`${assuranceRoute}?view=`);
    for (const section of ['posture', 'frameworks', 'risks', 'evidence', 'governance', 'activity']) {
      expect(html).toContain(`href="#${section}"`);
    }

    const legacy = await routeRequest(new Request(`https://demo.wizardgang.ai${assuranceRoute}?view=compliance`, {
      headers: { accept: 'text/html' },
    }), environment);
    expect(legacy.status).toBe(404);
    expect(legacy.headers.get('location')).toBeNull();
  });

  it('preserves all canonical assurance child routes during the preparatory migration', async () => {
    const childRouteIds = [
      'assurance.delivery',
      'assurance.governance',
      'assurance.evidence',
      'assurance.compliance',
      'assurance.risks',
      'assurance.incidents',
      'assurance.concerns',
    ] as const;
    const { html } = await assuranceHtml();
    for (const routeId of childRouteIds) {
      const path = routeUrl(routeId);
      expect(html).toContain(`href="${path}"`);
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, {
        headers: { accept: 'text/html' },
      }), environment);
      expect(response.status, routeId).toBe(200);
    }
  });
});
