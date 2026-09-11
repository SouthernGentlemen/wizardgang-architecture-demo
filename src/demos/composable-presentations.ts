import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import {
  createDemoSection,
  demoSectionPage,
  fullPageSectionOptions,
  type DemoSection,
  type DemoSectionOptions,
} from '../ui/demo-section';
import { edgeContent } from './edge';
import { workersContent } from './workers';
import { durableObjectsContent } from './durable-objects';
import { d1Content } from './d1-page';
import { r2Content } from './r2-page';
import { apiContent } from './api-page';
import { graphqlContent } from './graphql-console';
import { webhooksContent } from './webhook-console';
import { identityContent } from './identity-page';
import { mcpContent } from './mcp-page';
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

export function d1Section(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(d1Content(env), 'd1', `${routeUrl('demos.index')}#d1`, options);
}

export function r2Section(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(r2Content(env), 'r2', `${routeUrl('demos.index')}#r2`, options);
}

export function restSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(apiContent(env), 'rest', `${routeUrl('demos.index')}#rest`, options);
}

export function graphqlSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(graphqlContent(env), 'graphql', `${routeUrl('demos.index')}#graphql`, options);
}

export function webhooksSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(webhooksContent(env), 'webhooks', `${routeUrl('demos.index')}#webhooks`, options);
}

export function identitySection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(identityContent(env), 'identity', `${routeUrl('demos.index')}#identity`, options);
}

export async function mcpSection(request: Request, env: Env, options: DemoSectionOptions = {}): Promise<DemoSection> {
  return section(await mcpContent(request, env), 'mcp', `${routeUrl('demos.index')}#mcp`, options);
}

export function accessibilitySection(request: Request, env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(accessibilityContent(request, env), 'accessibility', `${routeUrl('demos.index')}#accessibility`, options);
}

export function i18nSection(request: Request, env: Env, options: DemoSectionOptions = {}): DemoSection {
  return section(i18nContent(request, env), 'i18n', `${routeUrl('demos.index')}#i18n`, options);
}

export const edgePageContent = (env: Env) => demoSectionPage(edgeSection(env, fullPageSectionOptions('edge')));
export const workersPageContent = (env: Env) => demoSectionPage(workersSection(env, fullPageSectionOptions('workers')));
export const durableObjectsPageContent = (env: Env) => demoSectionPage(durableObjectsSection(env, fullPageSectionOptions('durable-objects')));
export const d1PageContent = (env: Env) => demoSectionPage(d1Section(env, fullPageSectionOptions('d1')));
export const r2PageContent = (env: Env) => demoSectionPage(r2Section(env, fullPageSectionOptions('r2')));
export const restPageContent = (env: Env) => demoSectionPage(restSection(env, fullPageSectionOptions('rest')));
export const graphqlPageContent = (env: Env) => demoSectionPage(graphqlSection(env, fullPageSectionOptions('graphql')));
export const webhooksPageContent = (env: Env) => demoSectionPage(webhooksSection(env, fullPageSectionOptions('webhooks')));
export const identityPageContent = (env: Env) => demoSectionPage(identitySection(env, fullPageSectionOptions('identity')));
export const mcpPageContent = async (request: Request, env: Env) => demoSectionPage(await mcpSection(request, env, fullPageSectionOptions('mcp')));
export const accessibilityPageContent = (request: Request, env: Env) => demoSectionPage(accessibilitySection(request, env, fullPageSectionOptions('accessibility')));
export const i18nPageContent = (request: Request, env: Env) => demoSectionPage(i18nSection(request, env, fullPageSectionOptions('i18n')));
