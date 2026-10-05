import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

const env = {
  WG_DB: new SqliteD1(),
  GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('DEMO-385 retained inspector', () => {
  it.each(['d1', 'r2', 'workers', 'durable-objects', 'i18n'])('provides %s as an inline disclosure without JavaScript', async (id) => {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai/demos?demo=${id}`, { headers: { accept: 'text/html' } }), env);
    const window = new Window();
    try {
      window.document.documentElement.innerHTML = await response.text();
      const document = window.document;
      const inspector = document.querySelector('[data-demo-inspector]');
      const disclosure = inspector?.querySelector('details');
      expect(inspector).not.toBeNull();
      expect(disclosure?.open).toBe(false);
      expect(disclosure?.querySelector('summary')?.textContent).toBe('Inspector');
      expect(document.querySelector('[data-demo-inspector-toggle]')?.getAttribute('aria-controls')).toBe('demo-inspector');
      const evidence = disclosure?.querySelector('.demo-inspector-static .demo-evidence-list');
      expect(evidence?.querySelectorAll('li')).toHaveLength(2);
      expect(evidence?.textContent).toContain(`#${id}`);
      expect(evidence?.querySelector('a')?.getAttribute('href')).toContain(`/blob/main/src/demos/`);
      expect(disclosure?.querySelector('.demo-inspector-static')?.textContent).toContain('Guide');
    } finally {
      await window.happyDOM.abort();
    }
  });

  it('keeps D1 Request limited to the latest response and points to its in-stage SQL Inspector', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos?demo=d1', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(html).toContain('The SQL statement and status are in the live SQL Inspector');
    expect(html).toContain('Read the in-stage SQL Inspector');
    expect(html).not.toContain('Mirrors the live SQL Inspector');
  });
});
