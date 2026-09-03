import { describe, expect, it } from 'vitest';
import { assuranceAdvisoriesResponse } from '../src/api/advisories';
import { publicAssuranceRegistry } from '../src/assurance/registry';
import { renderSecurity } from '../src/demos/security-page';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

const unsafePublicAdvisoryFields = /reporter|privateReport|exploitDetails|reproduction/i;
const ghsaPattern = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

describe('published security advisory assurance', () => {
  it('derives advisory counts from the canonical records without requiring permanent emptiness', () => {
    const records = publicAssuranceRegistry.advisories;
    expect(publicAssuranceRegistry.counts.advisories).toBe(records.length);
    expect(publicAssuranceRegistry.advisoryQualification).toContain('Only published, sanitized GitHub Security Advisories');
    for (const record of records) {
      expect(record.id).toMatch(ghsaPattern);
      expect(JSON.stringify(record)).not.toMatch(unsafePublicAdvisoryFields);
    }
  });

  it('publishes the documented read-only advisory API shape without private report state', async () => {
    const response = assuranceAdvisoriesResponse(new Request('https://demo.wizardgang.ai/v1/assurance/advisories'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    const body = await response.json() as {
      schemaVersion: number;
      dataset: string;
      count: number;
      qualification: string;
      records: Array<{ id?: string }>;
      pagination?: unknown;
    };
    expect(body.dataset).toBe('advisories');
    expect(body.count).toBe(publicAssuranceRegistry.advisories.length);
    expect(body.records.length).toBeLessThanOrEqual(body.count);
    expect(body.qualification).toBe(publicAssuranceRegistry.advisoryQualification);
    expect(JSON.stringify(body)).not.toMatch(unsafePublicAdvisoryFields);

    const rejected = assuranceAdvisoriesResponse(new Request('https://demo.wizardgang.ai/v1/assurance/advisories', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
  });

  it('documents coordinated disclosure and renders the current canonical advisory state truthfully', async () => {
    const response = renderSecurity(env);
    const html = await response.text();
    expect(html).toContain('id="disclosure-lifecycle"');
    expect(html).toContain('Private report → triage → GHSA → fix/release → eligible CVE → public advisory');
    expect(html).toContain('id="published-advisories"');
    expect(html).toContain('/v1/assurance/advisories');
    expect(html).toContain('INC-*');

    if (publicAssuranceRegistry.advisories.length === 0) {
      expect(html).toContain('No published advisories are established');
    } else {
      for (const advisory of publicAssuranceRegistry.advisories) expect(html).toContain(advisory.id);
    }
  });
});
