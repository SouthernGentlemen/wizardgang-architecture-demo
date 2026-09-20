import { renderToStaticMarkup } from 'react-dom/server';
import { browserAssetPath } from './asset-map';

const defaultQuery = `query Users {
  users {
    id
    name
    email
    role
  }
}`;

interface GraphiqlBrowserConfig {
  readonly options: {
    readonly endpoint: string;
    readonly title: string;
    readonly defaultQuery: string;
    readonly defaultTabs: readonly Readonly<{ query: string }>[];
    readonly credentials: 'same-origin';
    readonly shouldPersistHeaders: false;
  };
  readonly workerSources: Readonly<Record<string, string>>;
}

function GraphiqlDocument({ request }: Readonly<{ request: Request }>) {
  const config: GraphiqlBrowserConfig = {
    options: {
      endpoint: new URL('/graphql', request.url).toString(),
      title: 'WizardGang GraphiQL',
      defaultQuery,
      defaultTabs: [{ query: defaultQuery }],
      credentials: 'same-origin',
      shouldPersistHeaders: false,
    },
    workerSources: {
      editorWorkerService: browserAssetPath('vendor.monaco.editor'),
      json: browserAssetPath('vendor.monaco.json'),
      graphql: browserAssetPath('vendor.monaco.graphql'),
    },
  };
  const setupModule = browserAssetPath('scripts.graphiql');
  return <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>WizardGang GraphiQL</title>
      <link rel="stylesheet" href={browserAssetPath('vendor.graphiql.styles')} />
    </head>
    <body id="body" className="no-focus-outline">
      <noscript>JavaScript is required to run GraphiQL.</noscript>
      <div id="root" data-config={JSON.stringify(config)}>Loading WizardGang GraphiQL…</div>
      <script src={browserAssetPath('vendor.graphiql.script')} />
      <script type="module" src={setupModule} />
    </body>
  </html>;
}

export function localGraphiqlDocument(request: Request): string {
  if (request.method !== 'GET') throw new Error('GraphiQL document requires GET.');
  return `<!doctype html>${renderToStaticMarkup(<GraphiqlDocument request={request} />)}`;
}
