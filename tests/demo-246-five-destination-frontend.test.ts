import { describe, expect, it } from 'vitest';
import { securityContent } from '../src/demos/security-page';
import {
  applicationRouteRegistry,
  routeUrl,
  type ApplicationRouteDeclaration,
} from '../src/routing/application-routes';
import { primaryNavigation, sitemapPaths } from '../src/routing/navigation';
import { renderIndex, renderPage } from '../src/ui/page';
import type { Env } from '../src/types';

const repositoryUrl = 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo';
const env = {
  GITHUB_REPO_URL: repositoryUrl,
  GITHUB_BRANCH: 'main',
} as Env;

function textContent(fragment: string): string {
  return fragment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function anchorDestinations(fragment: string): Array<{ href: string; text: string }> {
  return [...fragment.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((match) => ({ href: match[1], text: textContent(match[2]) }));
}

describe('DEMO-246 five-destination frontend', () => {
  it('projects the exact public header destinations while the logo remains Home', async () => {
    expect(primaryNavigation().map((route) => [route.page?.label, route.pattern])).toEqual([
      ['Demos', routeUrl('demos.index')],
      ['Assurance', routeUrl('assurance.index')],
      ['Operations', routeUrl('operations.index')],
      ['Security', routeUrl('security.index')],
    ]);

    const html = await renderIndex(env).text();
    const header = html.match(/<header class="site-header">([\s\S]*?)<\/header>/)?.[0] ?? '';
    const nav = header.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)?.[0] ?? '';
    expect(header).toContain(`<a class="brand" href="${routeUrl('interfaces.frontend.index')}"`);
    expect(anchorDestinations(nav)).toEqual([
      { href: routeUrl('demos.index'), text: 'Demos' },
      { href: routeUrl('assurance.index'), text: 'Assurance' },
      { href: routeUrl('operations.index'), text: 'Operations' },
      { href: routeUrl('security.index'), text: 'Security' },
      { href: repositoryUrl, text: 'Source ↗' },
    ]);
    expect(nav).not.toMatch(/>Architecture<|>Architecture\s*</);
  });

  it('makes the homepage a three-action launcher without route-count marketing', async () => {
    const html = await renderIndex(env).text();
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[0] ?? '';
    const actions = main.match(/<section class="grid home-actions"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(main).not.toBe('');
    expect(anchorDestinations(actions)).toEqual([
      { href: routeUrl('demos.index'), text: 'Run it Execute the interactive architecture demonstrations.' },
      { href: routeUrl('assurance.index'), text: 'Verify it Inspect assurance, evidence, governance, and compliance records.' },
      { href: routeUrl('operations.index'), text: 'Observe it Review runtime status, availability, activity, usage, and deployment evidence.' },
    ]);
    expect(main).not.toContain('live destinations');
    expect(main).not.toContain('id="architecture-map"');
    expect(main).not.toContain('data-parent-route=');
    expect(main).not.toContain('destination count');
    expect(main).not.toContain('data-health');
  });

  it('organizes Security around reporting, disclosure, and published advisories', async () => {
    const html = await renderPage(env, { ...securityContent(env), routeId: 'security.index' }).text();
    expect(html).toContain('<h2 id="report-vulnerability-heading">Report vulnerability</h2>');
    expect(html).toContain('<h2 id="disclosure-process-heading">Disclosure process</h2>');
    expect(html).toContain('<h2 id="published-advisories-heading">Published advisories</h2>');
    expect(html).toContain(`${repositoryUrl}/security/advisories/new`);
    expect(html).toContain('>Open a private security report</a>');
    expect(html).toContain('/.well-known/security.txt');
    expect(html).toContain(routeUrl('assurance.index') + '#concerns');
  });

  it('links the global footer directly to the existing public-safe bug issue form', async () => {
    const html = await renderIndex(env).text();
    const footer = html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[0] ?? '';
    expect(anchorDestinations(footer)).toContainEqual({
      href: `${repositoryUrl}/issues/new?template=bug.yml`,
      text: 'Report an issue',
    });
  });

  it('derives the public indexable browser inventory from declarations and keeps hidden pages out', () => {
    const declarations = applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[];
    const publicIndexableBrowserPaths = declarations
      .filter((route) => (
        route.kind === 'page'
        && route.visibility === 'public'
        && route.methods.includes('GET')
        && route.crawler.indexing === 'allow'
        && !route.pattern.includes(':')
      ))
      .map((route) => route.pattern)
      .sort();
    const expected = [
      routeUrl('interfaces.frontend.index'),
      routeUrl('demos.index'),
      routeUrl('assurance.index'),
      routeUrl('operations.index'),
      routeUrl('security.index'),
    ].sort();
    expect(publicIndexableBrowserPaths).toEqual(expected);
    expect([...sitemapPaths()].sort()).toEqual(expected);

    expect(declarations.find((route) => route.pattern === '/admin')).toMatchObject({
      kind: 'page', visibility: 'private', crawler: { indexing: 'deny' },
    });
    expect(declarations.find((route) => route.pattern === '/offline')).toMatchObject({
      kind: 'page', visibility: 'public', crawler: { indexing: 'deny' },
    });
  });

  it('preserves representative machine, API, protocol, identity, reporting, and crawler declarations', () => {
    const declarations = new Map(applicationRouteRegistry.declarations.map((route) => [route.id, route]));
    const expected = [
      ['interfaces.openapi.json', '/api/openapi.json', ['GET'], 'api'],
      ['interfaces.graphql.endpoint', '/graphql', ['GET', 'POST'], 'protocol'],
      ['interfaces.mcp.server', '/mcp', ['GET', 'POST', 'DELETE'], 'protocol'],
      ['interfaces.identity.saml.metadata', '/auth/saml/metadata', ['GET'], 'protocol'],
      ['interfaces.webhooks.github', '/webhooks/github', ['POST'], 'protocol'],
      ['reporting.index', '/api/reporting', ['GET', 'OPTIONS'], 'api'],
      ['reporting.collection', '/api/reporting/:collection', ['GET', 'OPTIONS'], 'api'],
      ['reporting.record', '/api/reporting/:collection/:recordId', ['GET', 'PATCH', 'OPTIONS'], 'api'],
      ['operations.security-txt', '/.well-known/security.txt', ['GET', 'HEAD'], 'protocol'],
      ['operations.robots', '/robots.txt', ['GET', 'HEAD'], 'protocol'],
      ['operations.sitemap', '/sitemap.xml', ['GET'], 'protocol'],
    ] as const;

    for (const [id, pattern, methods, kind] of expected) {
      expect(declarations.get(id), id).toMatchObject({ pattern, methods: [...methods], kind });
    }
  });
});
