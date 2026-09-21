import { MCP_PROTOCOL_VERSION, MCP_SERVER_PATH, mcpMetaKeys } from '../api/mcp';
import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';

function mcpBrowserMessages(localization: LocalizationContext): Readonly<Record<string, string>> {
  return Object.freeze({
    running: localization.exact('Running ping…'),
    copied: localization.exact('Endpoint copied.'),
    clipboardUnavailable: localization.exact('Clipboard access was unavailable. Select the endpoint above and copy it manually.'),
  });
}

function McpPresentation({ endpoint, localization }: Readonly<{
  endpoint: string;
  localization: LocalizationContext;
}>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const toolsHeading = scope.id('mcp-tools-heading');
  const runHeading = scope.id('mcp-run-heading');
  const connectHeading = scope.id('mcp-connect-heading');
  const claudeCommand = `claude mcp add --transport http wizardgang ${endpoint}`;
  const codexCommand = `codex mcp add wizardgang --url ${endpoint}`;
  const inspectorCommand = `npx @modelcontextprotocol/inspector --web --server-url ${endpoint} --transport http`;
  const requestBody = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'ping',
      arguments: {},
      _meta: {
        [mcpMetaKeys.protocolVersion]: MCP_PROTOCOL_VERSION,
        [mcpMetaKeys.clientInfo]: { name: 'wizardgang-browser-demo', version: '1.0' },
        [mcpMetaKeys.clientCapabilities]: {},
      },
    },
  };

  return <>
    <section className="page-header">
      <p className="eyebrow">{exact('AI / MCP')}</p>
      <DemoHeading level={1}>{exact('Model Context Protocol')}</DemoHeading>
      <p className="lede">{exact('Inspect the live MCP boundary, run one representative read-only tool, then copy the endpoint into a compatible client.')}</p>
      <div className="request-line"><span className="http-method http-post">MCP</span><code id={scope.id('mcp-endpoint')}>{endpoint}</code></div>
    </section>

    <section aria-labelledby={toolsHeading}>
      <div className="section-head"><DemoHeading level={2} id={toolsHeading}>{exact('Available tools')}</DemoHeading><span>{localization.number(2)} {exact('read-only tools')}</span></div>
      <div className="grid">
        <article className="card"><p className="eyebrow">{exact('Tool')}</p><DemoHeading level={3}><code>ping</code></DemoHeading><p>{exact('Verify that an MCP client can reach the live server boundary.')}</p></article>
        <article className="card"><p className="eyebrow">{exact('Tool')}</p><DemoHeading level={3}><code>list_demo_records</code></DemoHeading><p>{exact('Read bounded public demonstration records through the normal D1 authorization path.')}</p></article>
      </div>
    </section>

    <section className="action-card" aria-labelledby={runHeading}>
      <DemoHeading level={2} id={runHeading}>{exact('Run')} <code>ping</code></DemoHeading>
      <p>{exact('Execute the representative tool directly against the deployed MCP endpoint.')}</p>
      <button className="button-primary" type="button" data-mcp-run="">{exact('Run ping')}</button>
      <pre className="action-output" aria-live="polite" data-mcp-output="" hidden />
    </section>

    <section aria-labelledby={connectHeading}>
      <div className="section-head"><DemoHeading level={2} id={connectHeading}>{exact('Connect a client')}</DemoHeading><span>{exact('Copy the endpoint or one command')}</span></div>
      <div className="link-row"><button type="button" data-copy-value={endpoint}>{exact('Copy endpoint')}</button></div>
      <p className="subtle" data-copy-status="" aria-live="polite" />
      <details className="implementation-notes">
        <summary>{exact('Advanced client setup and wire details')}</summary>
        <div className="info-grid">
          <article className="info-card"><DemoHeading level={3}>Claude Code</DemoHeading><pre>{claudeCommand}</pre></article>
          <article className="info-card"><DemoHeading level={3}>Codex CLI</DemoHeading><pre>{codexCommand}</pre></article>
          <article className="info-card"><DemoHeading level={3}>MCP Inspector</DemoHeading><pre>{inspectorCommand}</pre></article>
        </div>
        <details><summary>{exact('Representative request headers')}</summary><pre>{`MCP-Protocol-Version: ${MCP_PROTOCOL_VERSION}\nMcp-Method: tools/call\nMcp-Name: ping`}</pre></details>
        <details><summary>{exact('Representative JSON-RPC request')}</summary><pre>{JSON.stringify(requestBody, null, 2)}</pre></details>
        <details><summary>{exact('Latest public demo MCP activity')}</summary><p className="subtle">{exact('Activity history remains outside the default success path so the primary walkthrough stays focused on endpoint, tools, one executable call, result, and connection guidance.')}</p></details>
        <p className="subtle">{exact('Transport: Streamable HTTP · protocol')} {MCP_PROTOCOL_VERSION} · {exact('public read-only demo authorization.')}</p>
      </details>
    </section>
  </>;
}

export function mcpSection(request: Request, env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const endpoint = `${new URL(request.url).origin}${MCP_SERVER_PATH}`;
  const presentationPath = `${routeUrl('demos.index')}#mcp`;
  return createReactDemoSection(env, {
    key: 'mcp',
    title: 'Model Context Protocol',
    defaultPresentationPath: presentationPath,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.mcp') }),
    browserMessages: mcpBrowserMessages(localization),
    children: <McpPresentation endpoint={endpoint} localization={localization} />,
  }, options);
}
