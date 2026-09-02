import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { securityTxtResponse, SECURITY_TXT_EXPIRES } from '../src/api/security-policy';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_DB: {
    prepare(sql: string) {
      return {
        bind() { return this; },
        async run() { return { meta: {} }; },
        async all() {
          if (sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-02T00:00:00Z', updated_by: 'test' }] };
          if (sql.includes('FROM crawler_control')) return { results: [{ state: 'disabled', updated_at: '2026-09-02T00:00:00Z', updated_by: 'test' }] };
          return { results: [] };
        },
      };
    },
  },
} as Env;

describe('security.txt', () => {
  it('publishes the required private contact and expiry at the canonical location', async () => {
    const response = securityTxtResponse(new Request('https://demo.wizardgang.ai/.well-known/security.txt'), env);
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(body).toContain('Contact: https://github.com/SouthernGentlemen/wizardgang-architecture-demo/security/advisories/new');
    expect(body).toContain('Policy: https://demo.wizardgang.ai/security');
    expect(body).toContain('Canonical: https://demo.wizardgang.ai/.well-known/security.txt');
    expect(body).toContain(`Expires: ${SECURITY_TXT_EXPIRES}`);
    const expiry = Date.parse(SECURITY_TXT_EXPIRES);
    expect(expiry).toBeGreaterThan(Date.now());
    expect(expiry).toBeLessThan(Date.now() + 366 * 24 * 60 * 60 * 1000);
  });

  it('supports HEAD and rejects mutation methods', async () => {
    const head = securityTxtResponse(new Request('https://demo.wizardgang.ai/.well-known/security.txt', { method: 'HEAD' }), env);
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    const post = securityTxtResponse(new Request('https://demo.wizardgang.ai/.well-known/security.txt', { method: 'POST' }), env);
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET, HEAD');
  });
});

describe('public concern and security routes', () => {
  it('separates private security reporting from public issue intake', async () => {
    const security = await routeRequest(new Request('https://demo.wizardgang.ai/security', { headers: { accept: 'text/html' } }), env);
    const securityHtml = await security.text();
    expect(security.status).toBe(200);
    expect(securityHtml).toContain('/security/advisories/new');
    expect(securityHtml).toContain('/.well-known/security.txt');
    expect(securityHtml).toContain('/governance/concerns');

    const concerns = await routeRequest(new Request('https://demo.wizardgang.ai/governance/concerns', { headers: { accept: 'text/html' } }), env);
    const concernsHtml = await concerns.text();
    expect(concerns.status).toBe(200);
    for (const template of ['bug.yml', 'feature.yml', 'concern.yml']) expect(concernsHtml).toContain(encodeURIComponent(template));
    expect(concernsHtml).toContain('/security/advisories/new');
  });

  it('offers no public security issue form', () => {
    const config = readFileSync('.github/ISSUE_TEMPLATE/config.yml', 'utf8');
    expect(config).toContain('blank_issues_enabled: false');
    expect(config).toContain('/security/advisories/new');
    expect(config).not.toContain('security.yml');
  });
});
