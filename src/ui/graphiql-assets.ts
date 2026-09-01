import graphiqlScript from '../../node_modules/@graphql-yoga/graphiql/dist/yoga-graphiql.umd.js';
import graphiqlStyles from '../../node_modules/@graphql-yoga/graphiql/dist/graphiql.css';
import editorWorker from '../../node_modules/@graphql-yoga/graphiql/dist/monacoeditorwork/editor.worker.bundle.js';
import jsonWorker from '../../node_modules/@graphql-yoga/graphiql/dist/monacoeditorwork/json.worker.bundle.js';
import graphqlWorker from '../../node_modules/@graphql-yoga/graphiql/dist/monacoeditorwork/graphql.worker..bundle.js';
import { methodNotAllowed, withSecurityHeaders } from '../lib/http';

const defaultQuery = `query Users {
  users {
    id
    name
    email
    role
  }
}`;

const assets: Record<string, { body: string; contentType: string }> = {
  'graphiql.js': { body: graphiqlScript, contentType: 'text/javascript; charset=utf-8' },
  'graphiql.css': { body: graphiqlStyles, contentType: 'text/css; charset=utf-8' },
  'editor.worker.js': { body: editorWorker, contentType: 'text/javascript; charset=utf-8' },
  'json.worker.js': { body: jsonWorker, contentType: 'text/javascript; charset=utf-8' },
  'graphql.worker.js': { body: graphqlWorker, contentType: 'text/javascript; charset=utf-8' },
};

export function graphiqlAssetResponse(request: Request, rawName: string): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const asset = assets[rawName];
  if (!asset) return new Response('Not found.', { status: 404, headers: { 'cache-control': 'no-store' } });
  const headers = withSecurityHeaders(new Headers({
    'content-type': asset.contentType,
    'cache-control': 'public, max-age=31536000, immutable',
  }));
  return new Response(asset.body, { headers });
}

export function localGraphiqlResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const options = JSON.stringify({
    endpoint: '/graphql',
    title: 'WizardGang GraphiQL',
    defaultQuery,
    defaultTabs: [{ query: defaultQuery }],
    credentials: 'same-origin',
    shouldPersistHeaders: false,
  }).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WizardGang GraphiQL</title><link rel="stylesheet" href="/__assets/graphiql/graphiql.css"></head><body id="body" class="no-focus-outline"><noscript>JavaScript is required to run GraphiQL.</noscript><div id="root">Loading WizardGang GraphiQL…</div><script>
  const workerSources={editorWorkerService:'/__assets/graphiql/editor.worker.js',json:'/__assets/graphiql/json.worker.js',graphql:'/__assets/graphiql/graphql.worker.js'};
  const workerUrls={};
  const prepareWorkers=()=>Promise.all(Object.entries(workerSources).map(async([name,url])=>{const response=await fetch(url);if(!response.ok)throw new Error('Editor worker unavailable');workerUrls[name]=URL.createObjectURL(new Blob([await response.text()],{type:'application/javascript'}))}));
  self.MonacoEnvironment={globalAPI:false,getWorkerUrl:(_moduleId,label)=>workerUrls[label]||workerUrls.editorWorkerService};
  </script><script src="/__assets/graphiql/graphiql.js"></script><script>prepareWorkers().finally(()=>YogaGraphiQL.renderYogaGraphiQL(document.getElementById('root'),${options}))</script></body></html>`;
  return new Response(html, { headers: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; connect-src 'self'; img-src data:; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; worker-src blob:; frame-ancestors 'self'; base-uri 'none'; form-action 'self'",
    'cross-origin-resource-policy': 'same-origin',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
  } });
}
