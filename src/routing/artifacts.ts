import type { ApplicationRouteDeclaration } from './application-routes';

export interface RouteManifestEntry {
  id: string;
  route: string;
  methods: readonly string[];
  kind: ApplicationRouteDeclaration['kind'];
  visibility: ApplicationRouteDeclaration['visibility'];
  browser_html: ApplicationRouteDeclaration['browserHtml'];
  authentication: ApplicationRouteDeclaration['authentication'];
  authorization: ApplicationRouteDeclaration['authorization'];
  same_origin: ApplicationRouteDeclaration['sameOrigin'];
  offline: ApplicationRouteDeclaration['offline'];
  cache: ApplicationRouteDeclaration['cache'];
  crawler: ApplicationRouteDeclaration['crawler'];
  title: string;
  description: string;
  docs: readonly string[];
  source: ApplicationRouteDeclaration['source'];
  navigation?: {
    parent?: string;
    label: string;
    order: number;
    navigation: 'primary' | 'secondary';
    architectureMap: boolean;
    sitemap: boolean;
  };
  status: 'working';
}

function publishedPattern(pattern: string): string {
  return pattern.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, '{$1}');
}

function sitemapMember(route: ApplicationRouteDeclaration): boolean {
  return route.kind === 'page'
    && route.visibility === 'public'
    && route.crawler.indexing === 'allow'
    && !route.pattern.includes(':');
}

export function buildRouteManifest(
  declarations: readonly ApplicationRouteDeclaration[],
): RouteManifestEntry[] {
  return declarations
    .map((route) => ({
      id: route.id,
      route: publishedPattern(route.pattern),
      methods: [...route.methods],
      kind: route.kind,
      visibility: route.visibility,
      browser_html: route.browserHtml,
      authentication: route.authentication,
      authorization: route.authorization,
      same_origin: route.sameOrigin,
      offline: route.offline,
      cache: route.cache,
      crawler: route.crawler,
      title: route.documentation.title,
      description: route.documentation.description,
      docs: [...route.documentation.docs],
      source: route.source,
      ...(route.page && route.page.navigation !== 'none' ? {
        navigation: {
          ...(route.page.parent ? { parent: route.page.parent } : {}),
          label: route.page.label,
          order: route.page.order,
          navigation: route.page.navigation,
          architectureMap: route.page.architectureMap,
          sitemap: sitemapMember(route),
        },
      } : {}),
      status: 'working' as const,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function serializeRouteManifest(
  declarations: readonly ApplicationRouteDeclaration[],
): string {
  return `${JSON.stringify(buildRouteManifest(declarations), null, 2)}\n`;
}

function cell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function methodCell(methods: readonly string[]): string {
  return methods.map((method) => `\`${method}\``).join(', ');
}

function routeCell(pattern: string): string {
  return `\`${publishedPattern(pattern)}\``;
}

function documentationTable(
  declarations: readonly ApplicationRouteDeclaration[],
  predicate: (route: ApplicationRouteDeclaration) => boolean,
): string {
  const rows = declarations
    .filter(predicate)
    .sort((left, right) => left.pattern.localeCompare(right.pattern) || left.id.localeCompare(right.id))
    .map((route) => `| \`${cell(route.id)}\` | ${routeCell(route.pattern)} | ${methodCell(route.methods)} | ${route.kind} | ${route.visibility} | ${route.offline.mode} | ${route.crawler.indexing} | ${cell(route.documentation.title)} | \`${cell(route.source.module)}\` |`)
    .join('\n');
  return `| Route ID | Route | Methods | Kind | Visibility | Offline | Indexing | Purpose | Source |\n|---|---|---|---|---|---|---|---|---|\n${rows}`;
}

export function buildRoutesDocumentation(
  declarations: readonly ApplicationRouteDeclaration[],
): string {
  const navigable = documentationTable(declarations, (route) => Boolean(route.page && route.page.navigation !== 'none'));
  const service = documentationTable(declarations, (route) => !route.page || route.page.navigation === 'none');
  return `# Route-to-source map\n\nThis file is generated from the active declarative application registry. Route IDs, URL patterns, methods, policy metadata, documentation, and source ownership must be changed in route declarations rather than edited here.\n\n## Registered public navigation\n\n${navigable}\n\n## Registered service, protocol, asset, and private routes\n\n${service}\n\n## Generation\n\n- Runtime registry: \`src/routing/application-routes.ts\`\n- Route contract: \`src/routing/registry.ts\`\n- Artifact projection: \`src/routing/artifacts.ts\`\n- Regenerate: \`npm run generate:routes\`\n- Validate: \`npm run validate:routes\`\n\nUnknown paths are not inferred from prefixes or aliases; they use the normal 404 response.\n`;
}
