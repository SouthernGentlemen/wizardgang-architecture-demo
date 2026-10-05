import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';
import { removedHtml404Pathnames } from './fixtures/removed-html-pathnames';
import { SqliteD1 } from './helpers/wg-storage';

const env: Env = {
  WG_DB: new SqliteD1(),
  WG_SESSION_KEY: 'test-incidents-page-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

describe('assurance activity boundary', () => {
  it('keeps incident and exercise inventories out of the assurance workbench', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance#ISO27001-A.5.1', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('data-assurance-workbench');
    expect(html).toContain('data-assurance-record="ISO27001-A.5.1"');
    expect(html).not.toContain('data-assurance-workbench-section="activity"');
    expect(html).not.toContain('Browse incident and exercise records');
    expect(html).not.toContain('/api/labs/governance-traceability');

    for (const collection of ['incidents', 'exercises']) {
      const reporting = await routeRequest(new Request(`https://demo.wizardgang.ai/api/reporting/${collection}`, { headers: { accept: 'application/json' } }), env);
      expect(reporting.status, collection).toBe(200);
    }
  });

  it('retires the incidents child route without an alias or redirect', async () => {
    const pathname = removedHtml404Pathnames.find((path) => path.endsWith('/incidents'))!;
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai${pathname}`, { headers: { accept: 'text/html' } }), env);
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
  });
});
