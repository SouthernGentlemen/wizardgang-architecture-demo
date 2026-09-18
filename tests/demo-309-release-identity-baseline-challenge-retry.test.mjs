import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const workflowPath = '.github/workflows/deploy.yml';

function extractBaselineScript() {
  const lines = fs.readFileSync(workflowPath, 'utf8').split('\n');
  const stepIndex = lines.findIndex((line) => line.includes('- name: Capture pre-deployment identity baseline'));
  if (stepIndex < 0) throw new Error('Identity baseline step is missing.');

  const start = lines.findIndex((line, index) => (
    index > stepIndex && /node --input-type=module - <<'NODE'\s*$/.test(line)
  ));
  if (start < 0) throw new Error('Identity baseline inline Node block is missing.');

  const indent = lines[start].match(/^(\s*)/)?.[1] ?? '';
  const script = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index] === `${indent}NODE`) return script.map((line) => (
      line.startsWith(indent) ? line.slice(indent.length) : line
    )).join('\n');
    script.push(lines[index]);
  }

  throw new Error('Identity baseline inline Node block is unterminated.');
}

function runBaseline(fetchFixture) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-309-'));
  const baselinePath = path.join(directory, 'identity-before.json');
  const script = extractBaselineScript();
  const harness = `
globalThis.__demo309Calls = [];
globalThis.fetch = ${fetchFixture};
process.env.IDENTITY_BASELINE_FILE = ${JSON.stringify(baselinePath)};
${script}
if (globalThis.__demo309Calls.length < 1) throw new Error('mock fetch was not called');
`;

  const result = spawnSync(process.execPath, ['--input-type=module'], {
    input: harness,
    encoding: 'utf8',
  });

  return { result, baselinePath, directory };
}

describe('DEMO-309 release identity baseline managed-challenge handling', () => {
  it('retries one Cloudflare managed challenge and captures the identity baseline', () => {
    const { result, baselinePath, directory } = runBaseline(`async (url, init) => {
      const href = String(url);
      globalThis.__demo309Calls.push({ href, init });
      const healthCalls = globalThis.__demo309Calls.filter((call) => call.href.endsWith('/api/operations/health')).length;

      if (href.endsWith('/api/operations/health') && healthCalls === 1) {
        return new Response('<html>Just a moment</html>', {
          status: 403,
          headers: {
            'cf-mitigated': 'challenge',
            'cf-ray': 'demo309-first',
            server: 'cloudflare',
          },
        });
      }

      if (href.endsWith('/api/operations/health')) {
        return new Response(JSON.stringify({ services: { worker: 'operational' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        providers: {
          github: { configured: true },
          google: { configured: false },
        },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }`);

    try {
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('retrying once with the same identified request');
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      expect(baseline).toEqual({
        identity: 'ready',
        configuredProviders: ['github'],
      });
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('fails closed after the bounded retry and reports public-safe edge diagnostics', () => {
    const { result, directory } = runBaseline(`async (url, init) => {
      const href = String(url);
      globalThis.__demo309Calls.push({ href, init });
      return new Response('<html>challenge</html>', {
        status: 403,
        headers: {
          'cf-mitigated': 'challenge',
          'cf-ray': 'demo309-persistent',
          server: 'cloudflare',
        },
      });
    }`);

    try {
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('returned HTTP 403');
      expect(result.stderr).toContain('server=cloudflare');
      expect(result.stderr).toContain('cf-ray=demo309-persistent');
      expect(result.stderr).toContain('cf-mitigated=challenge');
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
