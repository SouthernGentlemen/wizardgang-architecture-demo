import { describe, expect, it } from 'vitest';
import { graphqlContent } from '../src/demos/graphql-console';
import { openApiConsole } from '../src/demos/openapi-console';
import { renderPage } from '../src/ui/page';
import { runtimeStyles } from '../src/ui/runtime-styles';
import { accessibilityLabResponse } from '../src/ui/accessibility-lab';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + .05) / (darker + .05);
}

describe('DEMO-237 shared WCAG 2.2 AAA remediation', () => {
  it('raises the shared target, focus, motion, reflow, bidi, and contrast baseline without claiming conformance', () => {
    expect(runtimeStyles).toContain('--violet: #a98fff');
    expect(runtimeStyles).toContain('--cyan: #005a6d');
    expect(contrastRatio('#a98fff', '#111116')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio('#005a6d', '#fffdf7')).toBeGreaterThanOrEqual(7);
    expect(runtimeStyles).toContain('min-block-size: 44px !important');
    expect(runtimeStyles).toContain('outline: 3px solid var(--focus, #ffd84d)');
    expect(runtimeStyles).toContain('max-inline-size: 80ch');
    expect(runtimeStyles).toContain('unicode-bidi: isolate');
    expect(runtimeStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(runtimeStyles).toContain('transition-duration: .01ms !important');
    expect(runtimeStyles).toContain('@media (forced-colors: active)');
  });

  it('keeps the failure lesson accessible by rendering anti-patterns as inert text instead of live broken controls', async () => {
    const response = accessibilityLabResponse(new Request('https://demo.example/api/labs/accessibility?mode=broken'));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Annotated accessibility anti-patterns');
    expect(html).toContain('does not expose intentionally inaccessible controls');
    expect(html).toContain('&lt;input name=&quot;password&quot;');
    expect(html).toContain('&lt;img class=&quot;product&quot;');
    expect(html).not.toMatch(/<input\b[^>]*\bonpaste=/i);
    expect(html).not.toContain('<div class="click-control"');
    expect(html).not.toContain('<div class="tiny-controls"');
    expect(html).toContain("axe.run(document");
  });

  it('uses a labeled first-party GraphQL runner instead of exposing the embedded editor', async () => {
    const html = await renderPage(env, { ...graphqlContent(env), routeId: 'interfaces.graphql.console' }).text();
    expect(html).toContain('Accessible query runner');
    expect(html).toContain('data-graphql-form');
    expect(html).toContain('<label for="graphql-query">GraphQL query</label>');
    expect(html).toContain('data-graphql-runner-status role="status" aria-live="polite"');
    expect(html).toContain('tabindex="0">Run a query to inspect the JSON response.');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('title="GraphiQL query editor"');
  });

  it('completes the OpenAPI tab pattern with relationships and keyboard behavior including RTL direction', () => {
    const html = openApiConsole('/api/labs/rest-demo-openapi');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-controls="rest-demo-');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-labelledby="rest-demo-');
    expect(html).toContain("'ArrowLeft'");
    expect(html).toContain("'ArrowRight'");
    expect(html).toContain("'Home'");
    expect(html).toContain("'End'");
    expect(html).toContain("direction === 'rtl'");
  });
});
