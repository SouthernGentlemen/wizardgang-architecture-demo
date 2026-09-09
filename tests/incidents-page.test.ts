import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class IncidentsPageStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-09T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-09T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new IncidentsPageStatement(sql) },
  DEMO_SESSION_SECRET: 'test-incidents-page-cursor-secret-that-is-long-enough',
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

async function incidentsPage() {
  return routeRequest(new Request('https://demo.wizardgang.ai/assurance/incidents', {
    headers: { accept: 'text/html' },
  }), environment);
}

describe('incidents assurance presentation', () => {
  it('renders response posture and the useful exercise before the empty incident register', async () => {
    const response = await incidentsPage();
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Incident response readiness you can inspect.');
    expect(html).toContain('Current response posture');
    expect(html).toContain('Established incidents</p><h2>0</h2>');
    expect(html).toContain('Response exercises</p><h2>1</h2>');
    expect(html).toContain('Next exercise');
    expect(html).toContain('2026-12-02');
    expect(html.indexOf('Response exercises</h2>')).toBeLessThan(html.indexOf('Actual incidents</h2>'));
    expect(html).not.toContain('Shared reporting projection');
    expect(html).not.toContain('id="assurance-reporting"');
  });

  it('keeps incident and exercise machine-readable actions distinct', async () => {
    const response = await incidentsPage();
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('href="/api/reporting/exercises"');
    expect(html).toContain('>Exercise JSON</a>');
    expect(html).toContain('href="/api/reporting/incidents"');
    expect(html).toContain('>Incident JSON</a>');
    expect(html).toContain('href="/api/reporting/exercises/EX-001"');
    expect(html).toContain('Exact exercise JSON');
  });

  it('uses a live route-source link and makes the exercise assurance chain navigable', async () => {
    const response = await incidentsPage();
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('src/demos/incidents-page.ts');
    expect(html).not.toContain('src/demos/incidents.ts');
    expect(html).toContain('id="EX-001"');
    expect(html).toContain('<summary>Trace the exercise</summary>');
    expect(html).toContain('SEC-OBJ-005');
    expect(html).toContain('assurance/objectives/objectives.json');
    expect(html).toContain('WG-OBJ-001');
    expect(html).toContain('None yet. Completion evidence is created only after the exercise is performed.');
  });

  it('states the retained-register boundary once the actual incident section is reached', async () => {
    const response = await incidentsPage();
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('No established public incident records are in the current retained register.');
    expect(html).toContain('This is not a claim that defects, outages, vulnerabilities, near misses, or incidents have never occurred.');
    expect(html).toContain('What belongs on this page?');
    expect(html).toContain('Vulnerabilities and public advisories use the separate security-reporting lifecycle.');
  });
});