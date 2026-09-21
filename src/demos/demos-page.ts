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
  tryThis: string;
  guide: readonly string[];
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
    tryThis: 'Create or edit a row, then inspect the exact SQL and response.',
    guide: ['Switch between Users and Tasks.', 'Create, edit, or delete one row.', 'Open Request to inspect the SQL and response produced by that action.'],
    sourcePath: 'src/demos/d1-presentation.tsx', status: ['RESETTABLE'],
    request: {
      intro: 'Mirrors the live SQL Inspector produced by the selected D1 operation.',
      fields: [
        { label: 'Status', selector: '[data-inspector-status]', empty: 'Run a D1 operation to capture a status.' },
        { label: 'Statement', selector: '[data-inspector-sql]', empty: 'Run a D1 operation to capture its SQL statement.' },
        { label: 'Response', selector: '[data-state-output]', empty: 'Run a D1 operation to capture its response.' },
      ],
    },
    render: (_request, env, options) => d1Section(env, options),
  },
  {
    id: 'r2', label: 'R2', selectorLabel: 'R2', group: 'Data', category: 'Data', tier: 'primary',
    summary: 'Upload, inspect, and remove bounded objects in live storage.',
    tryThis: 'Upload a small object, inspect it, then remove it from the sandbox.',
    guide: ['Upload a small bounded object.', 'Inspect the object metadata and content.', 'Remove the object when you are finished.'],
    sourcePath: 'src/demos/r2-presentation.tsx', render: (_request, env, options) => r2Section(env, options),
  },
  {
    id: 'rest', label: 'REST / OpenAPI', selectorLabel: 'REST', group: 'APIs', category: 'APIs', tier: 'primary',
    summary: 'Run the focused REST contract and inspect its OpenAPI description.',
    tryThis: 'Execute one REST operation and compare the result with its declared contract.',
    guide: ['Choose an operation in the live REST demo.', 'Execute it with the provided controls.', 'Use Evidence for the implementation source when you need deeper detail.'],
    sourcePath: 'src/demos/rest-presentation.tsx', render: (_request, env, options) => restSection(env, options),
  },
  {
    id: 'graphql', label: 'GraphQL', selectorLabel: 'GraphQL', group: 'APIs', category: 'APIs', tier: 'primary',
    summary: 'Execute GraphQL operations against the live protocol endpoint.',
    tryThis: 'Run a query, change one field selection, and compare the returned shape.',
    guide: ['Start with the provided query.', 'Change one selected field.', 'Execute the operation and compare the response shape.'],
    sourcePath: 'src/demos/graphql-presentation.tsx', render: (_request, env, options) => graphqlSection(env, options),
  },
  {
    id: 'webhooks', label: 'Webhooks', selectorLabel: 'Webhooks', group: 'Integrations', category: 'Integrations', tier: 'primary',
    summary: 'Generate and inspect signed synthetic webhook delivery behavior.',
    tryThis: 'Send the synthetic delivery and inspect how its signature is validated.',
    guide: ['Use the synthetic webhook controls.', 'Send a bounded delivery.', 'Inspect the verification result shown by the live demo.'],
    sourcePath: 'src/demos/webhook-presentation.tsx', render: (_request, env, options) => webhooksSection(env, options),
  },
  {
    id: 'identity', label: 'Identity', selectorLabel: 'Identity', group: 'Identity', category: 'Identity', tier: 'primary',
    summary: 'Inspect the OAuth, OIDC, SAML, session, and authorization behavior available here.',
    tryThis: 'Choose one identity boundary and trace the controls that apply to it.',
    guide: ['Choose one identity or authorization boundary.', 'Inspect the available protocol behavior.', 'Use Evidence to open the implementation source.'],
    sourcePath: 'src/demos/identity-presentation.tsx', render: (_request, env, options) => identitySection(env, options),
  },
  {
    id: 'mcp', label: 'MCP', selectorLabel: 'MCP', group: 'AI / MCP', category: 'AI', tier: 'primary',
    summary: 'Inspect the endpoint, available tools, and one executable read-only MCP call.',
    tryThis: 'Run the read-only MCP call and inspect the bounded result.',
    guide: ['Inspect the advertised MCP tools.', 'Run the provided read-only call.', 'Compare the returned result with the visible tool contract.'],
    sourcePath: 'src/demos/mcp-presentation.tsx', render: (request, env, options) => mcpSection(request, env, options),
  },
  {
    id: 'edge', label: 'Edge', selectorLabel: 'Edge', group: 'Runtime architecture', category: 'Platform', tier: 'secondary',
    summary: 'Inspect the public DNS, TLS, CDN, routing, and request boundary.',
    tryThis: 'Trace one request from the public edge boundary into the application.',
    guide: ['Start at the public edge boundary.', 'Follow DNS, TLS, CDN, and routing evidence.', 'Use Evidence for the source implementation.'],
    sourcePath: 'src/demos/edge-presentation.tsx', render: (_request, env, options) => edgeSection(env, options),
  },
  {
    id: 'workers', label: 'Workers', selectorLabel: 'Workers', group: 'Runtime architecture', category: 'Platform', tier: 'secondary',
    summary: 'Exercise stateless edge compute and request policy behavior.',
    tryThis: 'Run the Worker interaction and inspect the request-policy result.',
    guide: ['Run the available Worker interaction.', 'Inspect the response and request-policy behavior.', 'Use Evidence for the implementation source.'],
    sourcePath: 'src/demos/workers-presentation.tsx', render: (_request, env, options) => workersSection(env, options),
  },
  {
    id: 'durable-objects', label: 'Durable Objects', selectorLabel: 'Durable Objects', group: 'Runtime architecture', category: 'Platform', tier: 'secondary',
    summary: 'Coordinate stateful requests against one shared object.',
    tryThis: 'Change the shared state and confirm the coordinated object owns the result.',
    guide: ['Use the shared-state controls.', 'Change the coordinated state.', 'Inspect the result returned by the live object.'],
    sourcePath: 'src/demos/durable-objects-presentation.tsx', render: (_request, env, options) => durableObjectsSection(env, options),
  },
  {
    id: 'accessibility', label: 'Accessibility', selectorLabel: 'Accessibility', group: 'Quality', category: 'Quality', tier: 'secondary',
    summary: 'Operate accessible behavior and inspect bounded failure analysis.',
    tryThis: 'Use the keyboard-only interaction and inspect the bounded accessibility result.',
    guide: ['Operate the demonstration without a pointer.', 'Trigger the bounded accessibility behavior.', 'Inspect the result without leaving the workbench.'],
    sourcePath: 'src/demos/accessibility-page.ts', render: (request, env, options) => accessibilitySection(request, env, options),
  },
  {
    id: 'i18n', label: 'Internationalization', selectorLabel: 'Internationalization', group: 'Quality', category: 'Quality', tier: 'secondary',
    summary: 'Exercise locale, formatting, pluralization, and RTL behavior.',
    tryThis: 'Change the locale and compare formatting, pluralization, and direction.',
    guide: ['Change the locale in the live demo.', 'Compare formatting and pluralization.', 'Inspect right-to-left behavior where available.'],
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

export function sourceHref(env: Env, sourcePath: string): string {
  const repository = env.GITHUB_REPO_URL.replace(/\/$/, '');
  const branch = env.GITHUB_BRANCH || 'main';
  const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
  const encodedPath = sourcePath.split('/').map(encodeURIComponent).join('/');
  return `${repository}/blob/${encodedBranch}/${encodedPath}`;
}
