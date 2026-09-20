import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import {
  createDemoSection,
  type DemoSection,
  type DemoSectionOptions,
} from '../ui/demo-section';
import { edgeContent } from './edge';
import { workersContent } from './workers';
import { durableObjectsContent } from './durable-objects';
import { webhooksContent } from './webhook-console';
import { identityContent } from './identity-page';
import { curatedMcpContent } from './mcp-curated';
import { accessibilityContent } from './accessibility-page';
import { i18nContent } from './i18n-page';

function section(
  content: ReturnType<typeof edgeContent>,
  key: string,
  presentationPath: string,
  options: DemoSectionOptions,
): DemoSection {
  return createDemoSection(content, key, presentationPath, options);
}

export function edgeSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(edgeContent(env), 'edge', `${routeUrl('demos.index')}#edge`, options);
}

export function workersSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(workersContent(env), 'workers', `${routeUrl('demos.index')}#workers`, options);
}

export function durableObjectsSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(durableObjectsContent(env), 'durable-objects', `${routeUrl('demos.index')}#durable-objects`, options);
}

export function webhooksSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(webhooksContent(env), 'webhooks', `${routeUrl('demos.index')}#webhooks`, options);
}

export function identitySection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(identityContent(env), 'identity', `${routeUrl('demos.index')}#identity`, options);
}

export function mcpSection(request: Request, env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(curatedMcpContent(request, env), 'mcp', `${routeUrl('demos.index')}#mcp`, options);
}

export function accessibilitySection(request: Request, env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(accessibilityContent(request, env), 'accessibility', `${routeUrl('demos.index')}#accessibility`, options);
}

export function i18nSection(request: Request, env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(i18nContent(request, env), 'i18n', `${routeUrl('demos.index')}#i18n`, options);
}

export { d1Section } from './d1-presentation';
export { r2Section } from './r2-presentation';
export { restSection } from './rest-presentation';
export { graphqlSection } from './graphql-presentation';
