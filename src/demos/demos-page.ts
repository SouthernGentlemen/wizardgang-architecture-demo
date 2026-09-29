import type { Env } from '../types';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import {
  accessibilitySection,
  d1Section,
  durableObjectsSection,
  edgeSection,
  graphqlSection,
  i18nSection,
  identitySection,
  mcpSection,
  r2Section,
  restSection,
  webhooksSection,
  workersSection,
} from './composable-presentations';

export const DEFAULT_DEMO_ID = 'd1';

type DemoTier = 'primary' | 'secondary';
export type DemoCategory = 'Data' | 'APIs' | 'Integrations' | 'Identity' | 'AI' | 'Platform' | 'Quality';
export type InspectorMode = 'Guide' | 'Request' | 'Evidence';

export interface DemoRequestField {
  label: string;
  selector: string;
  empty: string;
}

export interface DemoRequestInspector {
  intro: string;
  fields: readonly DemoRequestField[];
}

export interface ArchitectureDemo {
  id: string;
  label: string;
  selectorLabel: string;
  group: string;
  category: DemoCategory;
  tier: DemoTier;
  summary: string;
  guide?: readonly string[];
  sourcePath: string;
  status?: readonly string[];
  request?: DemoRequestInspector;
  render: (request: Request, env: Env, options: DemoSectionOptions) => DemoSection | Promise<DemoSection>;
}

export const demoCategories: readonly DemoCategory[] = [
  'Data', 'APIs', 'Integrations', 'Identity', 'AI', 'Platform', 'Quality',
] as const;

export const demonstrations: readonly ArchitectureDemo[] = [
  {
    id: 'd1', label: 'D1', selectorLabel: 'D1', group: 'Data', category: 'Data', tier: 'primary',
    summary: 'Run relational CRUD against resettable shared demo state.',
    guide: ['Switch between Users and Tasks.', 'Create, edit, or delete one row.', 'Read the in-stage SQL Inspector for the statement; open Request for the latest response.'],
    sourcePath: 'src/demos/d1-presentation.tsx', status: ['RESETTABLE'],
    request: {
      intro: 'Shows the latest D1 response. The SQL statement and status are in the live SQL Inspector beside the tables.',
      fields: [
        { label: 'Response', selector: '[data-state-output]', empty: 'Run a D1 operation to capture its response.' },
      ],
    },
    render: (_request, env, options) => d1Section(env, options),
  },
  {
    id: 'r2', label: 'R2', selectorLabel: 'R2', group: 'Data', category: 'Data', tier: 'primary',
    summary: 'Upload, inspect, and remove bounded objects in live storage.',
    guide: ['Upload a small bounded object.', 'Inspect the object metadata and content.', 'Remove the object when you are finished.'],
    sourcePath: 'src/demos/r2-presentation.tsx', status: ['RESETTABLE'], render: (_request, env, options) => r2Section(env, options),
  },
  {
    id: 'rest', label: 'REST / OpenAPI', selectorLabel: 'REST', group: 'APIs', category: 'APIs', tier: 'primary',
    summary: 'Run the focused REST contract and inspect its OpenAPI description.',
    sourcePath: 'src/demos/rest-presentation.tsx', render: (_request, env, options) => restSection(env, options),
  },
  {
    id: 'graphql', label: 'GraphQL', selectorLabel: 'GraphQL', group: 'APIs', category: 'APIs', tier: 'primary',
    summary: 'Execute GraphQL operations against the live protocol endpoint.',
    sourcePath: 'src/demos/graphql-presentation.tsx', render: (_request, env, options) => graphqlSection(env, options),
  },
  {
    id: 'webhooks', label: 'Webhooks', selectorLabel: 'Webhooks', group: 'Integrations', category: 'Integrations', tier: 'primary',
    summary: 'Generate and inspect signed synthetic webhook delivery behavior.',
    sourcePath: 'src/demos/webhook-presentation.tsx', status: ['RESETTABLE'], render: (_request, env, options) => webhooksSection(env, options),
  },
  {
    id: 'oauth', label: 'OAuth 2.0', selectorLabel: 'OAuth 2.0', group: 'Identity', category: 'Identity', tier: 'primary',
    summary: 'Sign in with GitHub authorization code and PKCE, then inspect API identity revalidation and application authorization.',
    sourcePath: 'src/demos/identity-presentation.tsx', render: (_request, env, options) => identitySection(env, options, 'oauth'),
  },
  {
    id: 'sso', label: 'SSO', selectorLabel: 'SSO', group: 'Identity', category: 'Identity', tier: 'primary',
    summary: 'Sign in with Microsoft Entra ID or Google OpenID Connect and inspect the validated application identity.',
    sourcePath: 'src/demos/identity-presentation.tsx', render: (_request, env, options) => identitySection(env, options, 'sso'),
  },
  {
    id: 'saml', label: 'SAML', selectorLabel: 'SAML', group: 'Identity', category: 'Identity', tier: 'primary',
    summary: 'Inspect Entra ID SAML federation, service-provider metadata, assertion validation, and application authorization.',
    sourcePath: 'src/demos/identity-presentation.tsx', render: (_request, env, options) => identitySection(env, options, 'saml'),
  },
  {
    id: 'mcp', label: 'MCP', selectorLabel: 'MCP', group: 'AI / MCP', category: 'AI', tier: 'primary',
    summary: 'Inspect the endpoint, available tools, and one executable read-only MCP call.',
    sourcePath: 'src/demos/mcp-presentation.tsx', render: (request, env, options) => mcpSection(request, env, options),
  },
  {
    id: 'edge', label: 'Edge', selectorLabel: 'Edge', group: 'Runtime architecture', category: 'Platform', tier: 'secondary',
    summary: 'Inspect an edge request and its routing response.',
    sourcePath: 'src/demos/edge-presentation.tsx', render: (_request, env, options) => edgeSection(env, options),
  },
  {
    id: 'workers', label: 'Workers', selectorLabel: 'Workers', group: 'Runtime architecture', category: 'Platform', tier: 'secondary',
    summary: 'Exercise stateless edge compute and request policy behavior.',
    guide: ['Choose a method, resource, and request properties.', 'Apply edge request policy.', 'Inspect the resulting response and policy decisions.'],
    sourcePath: 'src/demos/workers-presentation.tsx', render: (_request, env, options) => workersSection(env, options),
  },
  {
    id: 'durable-objects', label: 'Durable Objects', selectorLabel: 'Durable Objects', group: 'Runtime architecture', category: 'Platform', tier: 'secondary',
    summary: 'Coordinate stateful requests against one shared object.',
    guide: ['Increment once or send 10 concurrent increments.', 'Compare the final count with the serialized state.', 'Inspect the result returned by the live object.'],
    sourcePath: 'src/demos/durable-objects-presentation.tsx', render: (_request, env, options) => durableObjectsSection(env, options),
  },
  {
    id: 'accessibility', label: 'Accessibility', selectorLabel: 'Accessibility', group: 'Quality', category: 'Quality', tier: 'secondary',
    summary: 'Operate accessible behavior and inspect bounded failure analysis.',
    sourcePath: 'src/demos/accessibility-page.ts', render: (request, env, options) => accessibilitySection(request, env, options),
  },
  {
    id: 'i18n', label: 'Internationalization', selectorLabel: 'Internationalization', group: 'Quality', category: 'Quality', tier: 'secondary',
    summary: 'Exercise locale, formatting, pluralization, and RTL behavior.',
    guide: ['Change the language with the selector in the page header.', 'Change the count and compare formatting and pluralization.', 'Select Arabic in the page header to inspect right-to-left behavior.'],
    sourcePath: 'src/demos/i18n-presentation.tsx', render: (request, env, options) => i18nSection(request, env, options),
  },
] as const;

export function demosForCategory(category: DemoCategory): readonly ArchitectureDemo[] {
  return demonstrations.filter((demo) => demo.category === category);
}

export function defaultDemoForCategory(category: DemoCategory): ArchitectureDemo {
  const demo = demosForCategory(category)[0];
  if (!demo) throw new Error(`No demonstration registered for ${category}.`);
  return demo;
}

export function inspectorModes(demo: ArchitectureDemo): readonly InspectorMode[] {
  return demo.request ? ['Guide', 'Request', 'Evidence'] : ['Guide', 'Evidence'];
}

const INSPECTOR_DEMOS = new Set(['d1', 'r2', 'workers', 'durable-objects', 'i18n']);

export function hasDemoInspector(demo: ArchitectureDemo): boolean {
  return INSPECTOR_DEMOS.has(demo.id);
}

export function sourceHref(env: Env, sourcePath: string): string {
  const repository = env.GITHUB_REPO_URL.replace(/\/$/, '');
  const branch = env.GITHUB_BRANCH || 'main';
  const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
  const encodedPath = sourcePath.split('/').map(encodeURIComponent).join('/');
  return `${repository}/blob/${encodedBranch}/${encodedPath}`;
}
