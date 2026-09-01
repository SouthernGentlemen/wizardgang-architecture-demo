import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const workerTextAssets = [
  '/axe-core/axe.min.js',
  '/@graphql-yoga/graphiql/dist/yoga-graphiql.umd.js',
  '/@graphql-yoga/graphiql/dist/graphiql.css',
  '/@graphql-yoga/graphiql/dist/monacoeditorwork/editor.worker.bundle.js',
  '/@graphql-yoga/graphiql/dist/monacoeditorwork/json.worker.bundle.js',
  '/@graphql-yoga/graphiql/dist/monacoeditorwork/graphql.worker..bundle.js',
];

export default defineConfig({
  ssr: { noExternal: true },
  plugins: [{
    name: 'worker-text-assets',
    enforce: 'pre',
    load(id) {
      const path = id.split('?')[0];
      if (!workerTextAssets.some((suffix) => path.endsWith(suffix))) return null;
      return `export default ${JSON.stringify(readFileSync(path, 'utf8'))};`;
    },
  }],
});
