interface GraphiqlBrowserConfig {
  options: Record<string, unknown>;
  workerSources: Record<string, string>;
}

interface YogaGraphiqlGlobal {
  renderYogaGraphiQL(root: HTMLElement, options: Record<string, unknown>): void;
}

type GraphiqlGlobal = typeof globalThis & {
  MonacoEnvironment?: {
    globalAPI: boolean;
    getWorkerUrl(_moduleId: string, label: string): string | undefined;
  };
  YogaGraphiQL?: YogaGraphiqlGlobal;
};

function readConfig(root: HTMLElement): GraphiqlBrowserConfig {
  const value = JSON.parse(root.dataset.config ?? '{}') as Partial<GraphiqlBrowserConfig>;
  if (!value.options || !value.workerSources) throw new Error('GraphiQL browser configuration is missing.');
  return { options: value.options, workerSources: value.workerSources };
}

async function prepareWorkers(workerSources: Readonly<Record<string, string>>): Promise<void> {
  const workerUrls: Record<string, string> = {};
  await Promise.all(Object.entries(workerSources).map(async ([name, url]) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Editor worker unavailable');
    workerUrls[name] = URL.createObjectURL(new Blob([await response.text()], { type: 'application/javascript' }));
  }));
  const scope = globalThis as GraphiqlGlobal;
  scope.MonacoEnvironment = {
    globalAPI: false,
    getWorkerUrl: (_moduleId, label) => workerUrls[label] || workerUrls.editorWorkerService,
  };
}

export async function initializeGraphiql(root: HTMLElement): Promise<void> {
  const config = readConfig(root);
  try {
    await prepareWorkers(config.workerSources);
  } finally {
    const graphiql = (globalThis as GraphiqlGlobal).YogaGraphiQL;
    if (!graphiql) throw new Error('GraphiQL vendor module is unavailable.');
    graphiql.renderYogaGraphiQL(root, config.options);
  }
}

if (typeof document !== 'undefined') {
  const root = document.querySelector<HTMLElement>('#root[data-config]');
  if (root) void initializeGraphiql(root);
}
