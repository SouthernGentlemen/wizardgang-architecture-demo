import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import { architectureMapEntries, primaryNavigation } from '../src/routing/navigation';
import { escapeHtml } from '../src/lib/html';
import type { Env } from '../src/types';
import {
  breadcrumbNavigation,
  pageContent,
  renderIndex,
  renderPage,
  secondaryNavigationHtml,
} from '../src/ui/page';
import { navigationStyles } from '../src/ui/navigation-styles';
import { styles } from '../src/ui/styles';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'test',
} as Env;

const publicPages = applicationRouteRegistry.declarations.filter((route) => (
  route.kind === 'page'
  && route.page
  && route.visibility === 'public'
  && route.methods.includes('GET')
  && !route.pattern.includes(':')
));

function parentWalk(routeId: string) {
  const byId = new Map(applicationRouteRegistry.declarations.map((route) => [route.id, route]));
  const chain = [];
  let current = byId.get(routeId);
  const seen = new Set<string>();
  while (current?.page) {
    if (seen.has(current.id)) throw new Error(`Parent cycle at ${current.id}`);
    seen.add(current.id);
    chain.unshift(current);
    current = current.page.parent ? byId.get(current.page.parent) : undefined;
  }
  return chain;
}

function navMarkup(html: string): string {
  return [...html.matchAll(/<nav\b[\s\S]*?<\/nav>/g)].map((match) => match[0]).join('\n');
}

describe('navigation projection', () => {
  it('projects breadcrumb chains from registered parent walks', () => {
    for (const route of publicPages) {
      const chain = parentWalk(route.id);
      const breadcrumb = breadcrumbNavigation(route.id);
      expect(breadcrumb, route.id).toContain('aria-label="Breadcrumb"');
      expect(breadcrumb, route.id).not.toContain('?');
      for (const ancestor of chain.slice(0, -1)) {
        expect(breadcrumb, route.id).toContain(`href="${routeUrl(ancestor.id)}"`);
        expect(breadcrumb, route.id).toContain(`>${escapeHtml(ancestor.page!.label)}</a>`);
      }
      expect(breadcrumb, route.id).toContain(`<li aria-current="page">${escapeHtml(route.page!.label)}</li>`);
      expect(breadcrumb, route.id).not.toContain(`>${route.pattern}<`);
    }
  });

  it('uses registered route URLs for primary, secondary, related, and breadcrumb links', async () => {
    const registeredPageUrls = new Set(publicPages.map((route) => routeUrl(route.id)));
    for (const route of publicPages) {
      const response = renderPage(env, pageContent(env, route.page!.label, '<section class="page-header"><h1>Projection</h1></section>', {
        routeId: route.id,
        canonicalPath: routeUrl(route.id),
      }));
      const navigation = navMarkup(await response.text());
      expect(navigation, route.id).not.toContain('?view=');
      expect(navigation.match(/aria-current="page"/g), route.id).toHaveLength(1);
      for (const match of navigation.matchAll(/href="([^"]+)"/g)) {
        const href = match[1];
        if (!href.startsWith('/')) continue;
        expect(registeredPageUrls.has(href), `${route.id}: ${href}`).toBe(true);
      }
    }
    expect(primaryNavigation().every((route) => !routeUrl(route.id).includes('?'))).toBe(true);
  });

  it('keeps cross-domain assurance navigation in its own landmark', () => {
    const navigation = secondaryNavigationHtml('assurance.risks');
    expect(navigation).toContain('aria-label="Assurance sections"');
    expect(navigation).toContain('aria-label="Assurance related destinations"');
    expect(navigation).toContain(`href="${routeUrl('security.index')}"`);
    expect(navigation).not.toContain('?');
  });

  it('renders every public destination from the homepage and groups map cards by parent', async () => {
    const entries = architectureMapEntries();
    const html = await renderIndex(env, entries).text();
    const hrefs = new Set([...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]));
    for (const route of publicPages) {
      expect(hrefs.has(routeUrl(route.id)), route.id).toBe(true);
    }
    for (const route of entries) {
      expect(route.page?.parent, route.id).toBeTruthy();
      expect(html, route.id).toContain(`data-parent-route="${route.page!.parent}"`);
      expect(html, route.id).toContain(`href="${routeUrl(route.id)}"`);
      expect(html, route.id).toContain(route.page!.summary);
    }
    expect(html).toContain(`${entries.length} live destinations`);
  });

  it('keeps 44px targets and horizontal secondary navigation in the mobile shell', () => {
    expect(navigationStyles).toContain('@media (max-width: 700px)');
    expect(navigationStyles).toMatch(/\.nav a,[\s\S]*?min-height:\s*44px/);
    expect(navigationStyles).toMatch(/\.breadcrumb a\s*\{[\s\S]*?min-height:\s*44px/);
    expect(navigationStyles).toMatch(/\.secondary-navigation,[\s\S]*?overflow-x:\s*auto/);
    expect(styles).toContain('.lab-grid > * { min-width: 0; }');
    expect(navigationStyles).toMatch(/\.site-main\s*\{[\s\S]*?padding-top:\s*0\.6rem/);
    expect(navigationStyles).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
