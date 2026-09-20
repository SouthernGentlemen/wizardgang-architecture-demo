import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';
import { GRAPHQL_EXAMPLES } from './graphql-examples';

function graphqlBrowserMessages(localization: LocalizationContext): Readonly<Record<string, string>> {
  const exact = (english: string) => localization.exact(english);
  return Object.freeze({
    enterQuery: exact('Enter a GraphQL query before running it.'),
    runningQuery: exact('Running query…'),
    waitingForResponse: exact('Waiting for response…'),
    emptyResponse: exact('(empty response)'),
    graphqlError: exact('GraphQL error'),
    graphqlErrors: exact('GraphQL errors'),
    queryComplete: exact('Query complete'),
    errorResponse: exact('Error response'),
    networkFailure: exact('Network failure'),
    reviewError: exact('Review the error below.'),
  });
}

function GraphqlExample({
  example,
  index,
  localization,
}: Readonly<{
  example: (typeof GRAPHQL_EXAMPLES)[number];
  index: number;
  localization: LocalizationContext;
}>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const statusId = scope.id(`graphql-example-status-${index}`);
  return <article className="graphql-example">
    <div className="section-head">
      <DemoHeading level={3}>{exact(example.title)}</DemoHeading>
      <button type="button" className="button" data-graphql-example={index} aria-describedby={statusId}>{exact('Run example')}</button>
    </div>
    <pre><code>{example.query}</code></pre>
    <p className="subtle" id={statusId} data-graphql-example-status={index} role="status" aria-live="polite">{exact('Ready.')}</p>
    <pre className="graphql-example-result" data-graphql-result={index} tabIndex={0} aria-label={exact(`${example.title} response`)} hidden />
  </article>;
}

function GraphqlPresentation({ localization }: Readonly<{ localization: LocalizationContext }>) {
  const exact = (english: string) => localization.exact(english);
  const scope = useDemoPresentationScope();
  const identityUrl = localization.href(`${routeUrl('demos.index')}#identity`);
  const d1Url = localization.href(`${routeUrl('demos.index')}#d1`);
  const examplesHeading = scope.id('graphql-examples-heading');
  const runnerHeading = scope.id('graphql-runner-heading');
  const queryId = scope.id('graphql-query');
  const queryHelpId = scope.id('graphql-query-help');
  const runnerStatusId = scope.id('graphql-runner-status');
  const responseHeading = scope.id('graphql-response-heading');
  const controlsHeading = scope.id('graphql-controls-heading');
  const sharedHeading = scope.id('graphql-shared-heading');
  return <>
    <section className="page-header lab-page-header graphql-page-header" id={scope.id('graphql')}>
      <DemoHeading level={1}>{exact('GraphQL API')}</DemoHeading>
      <p className="lede">{exact('Run readable queries against a typed user directory. The examples and first-party query runner below call the live machine endpoint directly.')}</p>
    </section>
    <section className="graphql-examples" aria-labelledby={examplesHeading}>
      <div className="section-head"><DemoHeading level={2} id={examplesHeading}>{exact('Working examples')}</DemoHeading><span>{exact('Public queries · JSON responses')}</span></div>
      <div className="graphql-example-grid">{GRAPHQL_EXAMPLES.map((example, index) => <GraphqlExample key={example.title} example={example} index={index} localization={localization} />)}</div>
    </section>
    <details className="panel graphql-fields">
      <summary><strong>{exact('Available fields')}</strong><span>{exact('Compact schema guide')}</span></summary>
      <div className="graphql-field-grid">
        <div><DemoHeading level={3}>{exact('Query')}</DemoHeading><code>users: [User!]!</code><code>user(id: ID!): User</code></div>
        <div><DemoHeading level={3}>{exact('User')}</DemoHeading><code>id: ID!</code><code>name: String!</code><code>email: String!</code><code>role: String!</code></div>
        <div><DemoHeading level={3}>{exact('Mutation')}</DemoHeading><code>createUser</code><code>updateUser</code><code>deleteUser</code><small>{exact('Authenticated session required')}</small></div>
      </div>
    </details>
    <section className="graphql-workspace panel" aria-labelledby={runnerHeading}>
      <div className="graphql-workspace-heading">
        <div><p className="eyebrow">{exact('First-party interface')}</p><DemoHeading level={2} id={runnerHeading}>{exact('Accessible query runner')}</DemoHeading></div>
        <p>{exact('Queries are public.')} <a href={identityUrl}>{exact('Sign in for mutation access')}</a> {exact('through the shared application policy.')}</p>
      </div>
      <p>{exact('Enter a GraphQL query as text, run it with the button or keyboard, and review the JSON response. The protocol endpoint remains machine-only when requested as HTML.')}</p>
      <form data-graphql-form="">
        <label htmlFor={queryId}>{exact('GraphQL query')}</label>{' '}
        <textarea
          id={queryId}
          name="query"
          rows={9}
          spellCheck="false"
          autoComplete="off"
          autoCapitalize="off"
          aria-describedby={queryHelpId}
          defaultValue={GRAPHQL_EXAMPLES[0].query}
        />{' '}
        <p className="subtle" id={queryHelpId}>{exact('Use standard GraphQL query syntax. This public runner does not require a pointer or an embedded third-party editor.')}</p>{' '}
        <button type="submit" className="button button-primary" data-graphql-run="">{exact('Run query')}</button>
      </form>
      <p className="subtle" id={runnerStatusId} data-graphql-runner-status="" role="status" aria-live="polite">{exact('Ready.')}</p>
      <section aria-labelledby={responseHeading}>
        <DemoHeading level={3} id={responseHeading}>{exact('Response')}</DemoHeading>
        <pre data-graphql-workspace-result="" tabIndex={0}>{exact('Run a query to inspect the JSON response.')}</pre>
      </section>
    </section>
    <section className="graphql-controls" aria-labelledby={controlsHeading}>
      <div className="section-head"><DemoHeading level={2} id={controlsHeading}>{exact('Execution controls')}</DemoHeading><span>{exact('Enforced before resolver execution')}</span></div>
      <div className="graphql-control-grid">
        <article><strong>{localization.number(8)}</strong><span>{exact('Depth limit')}</span></article>
        <article><strong>{localization.number(50)}</strong><span>{exact('Field limit')}</span></article>
        <article><strong>{exact('Off')}</strong><span>{exact('Batching')}</span></article>
        <article><strong>{localization.number(16)} KiB</strong><span>{exact('Request limit')}</span></article>
      </div>
    </section>
    <section className="graphql-shared panel" aria-labelledby={sharedHeading}>
      <div><p className="eyebrow">{exact('Shared data')}</p><DemoHeading level={2} id={sharedHeading}>{exact('GraphQL ↔ D1 Users')}</DemoHeading><p>{exact('The query runner and the D1 console call the same bounded user services. Transport changes; persistence and policy do not.')}</p></div>
      <a className="button" href={d1Url}>{exact('Open D1 view →')}</a>
    </section>
  </>;
}

export function graphqlSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const presentationPath = `${routeUrl('demos.index')}#graphql`;
  return createReactDemoSection(env, {
    key: 'graphql',
    title: 'GraphQL API',
    defaultPresentationPath: presentationPath,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.graphql') }),
    browserMessages: graphqlBrowserMessages(localization),
    children: <GraphqlPresentation localization={localization} />,
  }, options);
}
