import { describe, expect, it } from 'vitest';
import { assuranceAdvisoriesResponse } from '../src/api/advisories';
import { publicAssuranceRegistry } from '../src/assurance/registry';
import { renderSecurity } from '../src/demos/security-page';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('published security advisory assurance', () => {
  it('starts with no fabricated published advisories or CVEs', () => {
    expect(publicAssuranceRegistry.counts.advisories).toBe(0);
    expect(publicAssuranceRegistry.advisories).toEqual([]);
    expect(publicAssuranceRegistry.advisoryQualification).toContain('Only published, sanitized GitHub Security Advisories');
  });

  it('publishes a read-only advisory API without private report state', async () => {
    const response = assuranceAdvisoriesResponse(new Request('https://demo.wizardgang.ai/v1/assurance/advisories'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    const body = await response.json() as {
      dataset: string;
      count: number;
      qualification: string;
      records: unknown[];
    };
    expect(body.dataset).toBe('advisories');
    expect(body.count).toBe(0);
    expect(body.records).toEqual([]);
    expect(JSON.stringify(body)).not.toMatch(/reporter|privateReport|exploitDetails|reproduction/i);

    const rejected = assuranceAdvisoriesResponse(new Request('https://demo.wizardgang.ai/v1/assurance/advisories', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
  });

  it('documents coordinated disclosure and renders a truthful empty published-advisory section', async () => {
    const response = renderSecurity(env);
    const html = await response.text();
    expect(html).toContain('id="disclosure-lifecycle"');
    expect(html).toContain('Private report → triage → GHSA → fix/release → eligible CVE → public advisory');
    expect(html).toContain('id="published-advisories"');
    expect(html).toContain('/v1/assurance/advisories');
    expect(html).toContain('No published advisories are established');
    expect(html).toContain('INC-*');
    expect(html).not.toMatch(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/);
    expect(html).not.toMatch(/CVE-[0-9]{4}-[0-9]{4,}/);
  });
});
