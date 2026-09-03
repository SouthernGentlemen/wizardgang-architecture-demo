import { describe, expect, it } from 'vitest';
import { assuranceAdvisoriesResponse } from '../src/api/advisories';
import { serializeAssuranceV1Advisory } from '../src/api/assurance-v1';
import { advisoryQualification } from '../src/assurance/service';
import { listPublishedAssuranceRecords } from '../src/assurance/publication';
import { renderSecurity } from '../src/demos/security-page';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

const unsafePublicAdvisoryFields = /reporter|privateReport|exploitDetails|reproduction/i;
const ghsaPattern = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

describe('published security advisory assurance', () => {
  it('derives advisory state from canonical records without requiring permanent emptiness', () => {
    const records = listPublishedAssuranceRecords('advisories');
    expect(advisoryQualification).toContain('Only published, sanitized GitHub Security Advisories');
    for (const record of records) {
      expect(record.id).toMatch(ghsaPattern);
      expect(record).toHaveProperty('relationships');
      expect(record).not.toHaveProperty('incidentLinks');
      expect(JSON.stringify(record)).not.toMatch(unsafePublicAdvisoryFields);
    }
  });

  it('publishes the documented read-only advisory API shape without private report state', async () => {
    const records = listPublishedAssuranceRecords('advisories');
    const response = assuranceAdvisoriesResponse(new Request('https://demo.wizardgang.ai/v1/assurance/advisories'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    const body = await response.json() as {
      schemaVersion: number;
      dataset: string;
      count: number;
      qualification: string;
      records: ReturnType<typeof serializeAssuranceV1Advisory>[];
      pagination?: unknown;
    };
    expect(body.dataset).toBe('advisories');
    expect(body.count).toBe(records.length);
    expect(body.records).toEqual(records.map(serializeAssuranceV1Advisory));
    expect(body.qualification).toBe(advisoryQualification);
    expect(JSON.stringify(body)).not.toMatch(unsafePublicAdvisoryFields);

    const rejected = assuranceAdvisoriesResponse(new Request('https://demo.wizardgang.ai/v1/assurance/advisories', { method: 'POST' }));
    expect(rejected.status).toBe(405);
    expect(rejected.headers.get('allow')).toBe('GET');
  });

  it('documents coordinated disclosure and renders the current canonical advisory state truthfully', async () => {
    const records = listPublishedAssuranceRecords('advisories');
    const response = renderSecurity(env);
    const html = await response.text();
    expect(html).toContain('id="disclosure-lifecycle"');
    expect(html).toContain('Private report → triage → GHSA → fix/release → eligible CVE → public advisory');
    expect(html).toContain('id="published-advisories"');
    expect(html).toContain('/v1/assurance/advisories');
    expect(html).toContain('INC-*');

    if (records.length === 0) {
      expect(html).toContain('No published advisories are established');
    } else {
      for (const advisory of records) expect(html).toContain(advisory.id);
    }
  });
});
