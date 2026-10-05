import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount as mountWebhooks } from '../src/browser/webhooks';
import { webhooksSection } from '../src/demos/webhook-presentation';
import type { Env } from '../src/types';

const repository = 'https://github.com/Wizard-Gang/wizardgang-architecture-demo';
const requestId = '123e4567-e89b-42d3-a456-426614174000';
const sha = 'a'.repeat(40);
const base = { GITHUB_REPO_URL: repository, GITHUB_BRANCH: 'main' } as Env;

function status(checkConclusion: string | null, available = true) {
  const run = { id: 101, name: 'CI', status: checkConclusion ? 'completed' : 'in_progress', conclusion: checkConclusion, url: `${repository}/actions/runs/101`, createdAt: '2026-09-30T12:00:00Z', updatedAt: '2026-09-30T12:02:00Z' };
  return {
    active: true, requestId, targetVersion: '0.28.1', pullRequest: { number: 54, state: 'open', url: `${repository}/pull/54` },
    releaseReady: checkConclusion === 'success' && available, failures: available ? [] : ['ciChecks'],
    stages: ['branch', 'pr', 'ci', 'merge', 'tag', 'release', 'deploy', 'health'].map((key) => ({ key, label: key, state: key === 'ci' ? checkConclusion ? 'complete' : 'current' : 'queued' })),
    ci: { run, available, checks: available ? ['validate', 'change-id', 'security', 'secrets'].map((name) => ({ name, status: checkConclusion ? 'completed' : 'in_progress', conclusion: checkConclusion, url: `${repository}/runs/${name}`, startedAt: '2026-09-30T12:00:00Z', completedAt: checkConclusion ? '2026-09-30T12:02:00Z' : null })) : [], jobs: [{ name: 'validate', status: checkConclusion ? 'completed' : 'in_progress', conclusion: checkConclusion, url: `${repository}/actions/runs/101/job/1`, steps: [{ number: 1, name: 'Install locked dependencies', status: 'completed', conclusion: 'success' }, { number: 2, name: 'Run acceptance', status: checkConclusion ? 'completed' : 'in_progress', conclusion: checkConclusion }] }] },
    controller: { start: null, release: null, startJobs: [], releaseJobs: [] },
    delivery: { releaseRun: null, deployRun: null, releaseJobs: [], deployJobs: [], releaseUrl: null },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('DEMO-392 live Webhooks presentation', () => {
  it('shows admin preflight, keeps visitor feed read-only, and updates real checks and steps in place', async () => {
    const window = new Window({ url: 'https://demo.wizardgang.ai/demos', settings: { disableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
    window.document.body.innerHTML = webhooksSection(base).body;
    const intervals: Array<() => void> = [];
    vi.spyOn(window, 'setInterval').mockImplementation(((handler: () => void) => { intervals.push(handler); return intervals.length; }) as typeof window.setInterval);
    const root = window.document.querySelector<HTMLElement>('[data-demo-section="webhooks"]')!;
    let conclusion: string | null = null;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input), window.location.href);
      if (url.pathname === '/api/labs/webhook-events') return new Response(JSON.stringify({ events: [], pollingIntervalMs: 2000, repository: 'Wizard-Gang/wizardgang-architecture-demo' }));
      if (url.searchParams.has('preflight')) {
        if (!new Headers(init?.headers).get('authorization')) return new Response(null, { status: 401 });
        return new Response(JSON.stringify({ mainSha: sha, currentVersion: '0.28.0', targetVersion: '0.28.1', lastRelease: 'v0.28.0', active: null, commitsSinceRelease: [{ sha, subject: '[DEMO-391] Reconcile release', url: `${repository}/commit/${sha}` }] }));
      }
      if (url.pathname === '/api/labs/git-delivery') return new Response(JSON.stringify(status(conclusion)));
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal('window', window);
    vi.stubGlobal('document', window.document);
    vi.stubGlobal('fetch', fetchMock);
    try {
      await mountWebhooks(root);
      await vi.waitFor(() => expect(root.querySelectorAll('[data-live-checks] li')).toHaveLength(4));
      expect(root.querySelector<HTMLButtonElement>('[data-live-release]')?.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>('[data-live-controls]')?.hidden).toBe(true);
      const check = root.querySelector<HTMLElement>('[data-key="check-0-validate"]');
      const step = root.querySelector<HTMLElement>('[data-key$="step-2-Run acceptance"]');
      expect(step?.textContent).toContain('in_progress');
      conclusion = 'success';
      intervals[0]();
      await vi.waitFor(() => expect(check?.textContent).toContain('success'));
      expect(root.querySelector<HTMLElement>('[data-key="check-0-validate"]')).toBe(check);
      expect(root.querySelector<HTMLElement>('[data-key$="step-2-Run acceptance"]')).toBe(step);
      const refresh = fetchMock.mock.calls.find(([input]) => String(input).includes('/api/labs/git-delivery'));
      expect(refresh).toBeTruthy();
      root.querySelector<HTMLInputElement>('[name="username"]')!.value = 'operator';
      root.querySelector<HTMLInputElement>('[name="password"]')!.value = 'secret';
      root.querySelector<HTMLFormElement>('[data-live-auth]')!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>('[data-live-preflight-panel]')?.hidden).toBe(false));
      expect(root.querySelector<HTMLButtonElement>('[data-live-release]')?.disabled).toBe(false);
      expect(root.querySelector('[data-live-target]')?.textContent).toContain('v0.28.1');
      expect(root.querySelector('[data-live-commits]')?.textContent).toContain('DEMO-391');
      expect(root.querySelector<HTMLButtonElement>('[data-live-start]')?.disabled).toBe(true);
      root.querySelector<HTMLInputElement>('[data-live-confirm]')!.click();
      expect(root.querySelector<HTMLButtonElement>('[data-live-start]')?.disabled).toBe(true); // Active PR prevents a concurrent start.
      root.dispatchEvent(new window.Event('demo:deactivate'));
    } finally { await window.happyDOM.close(); }
  });
});
