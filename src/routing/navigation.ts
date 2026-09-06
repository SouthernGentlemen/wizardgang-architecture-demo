import type { DemoDefinition } from '../types';

export interface RegisteredPageMetadata {
  group: string;
  label: string;
  summary: string;
  order: number;
  index: boolean;
  sitemap: boolean;
  demo?: DemoDefinition;
}

export interface RegisteredRouteMetadataView {
  id: string;
  pattern: string;
  methods: readonly string[];
  kind: string;
  visibility: 'public' | 'private';
  crawler: { crawling: string; indexing: 'allow' | 'deny' };
  documentation: { title: string; description: string; docs: readonly string[] };
  source: { module: string; exportName?: string; tests?: readonly string[] };
  navigation?: RegisteredPageMetadata;
}

let registeredRoutes: readonly RegisteredRouteMetadataView[] = Object.freeze([]);

export function configureRegisteredRoutes(routes: readonly RegisteredRouteMetadataView[]): void {
  registeredRoutes = Object.freeze([...routes]);
}

export function registeredRouteMetadata(): readonly RegisteredRouteMetadataView[] {
  return registeredRoutes;
}

export function registeredPageMetadata(): readonly RegisteredRouteMetadataView[] {
  return registeredRoutes
    .filter((route) => route.navigation && route.visibility === 'public' && route.methods.includes('GET'))
    .sort((left, right) => (left.navigation?.order ?? 0) - (right.navigation?.order ?? 0));
}

export function registeredDemoNavigation(): DemoDefinition[] {
  return registeredPageMetadata()
    .filter((route) => route.navigation?.index && route.navigation.demo)
    .map((route) => ({ ...route.navigation!.demo!, route: route.pattern }));
}

export function registeredSitemapPaths(): string[] {
  return registeredPageMetadata()
    .filter((route) => route.navigation?.sitemap && route.crawler.indexing === 'allow' && !route.pattern.includes(':'))
    .map((route) => route.pattern);
}
