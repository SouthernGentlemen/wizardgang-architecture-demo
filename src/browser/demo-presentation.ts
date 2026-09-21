export type DemoPresentationMount = (root: HTMLElement) => void | Promise<void>;

export interface DemoPresentationBrowserModule {
  mount: DemoPresentationMount;
}

export type DemoPresentationModuleLoader = (
  moduleName: string,
) => Promise<Partial<DemoPresentationBrowserModule>>;

async function loadDemoPresentationModule(moduleName: string): Promise<Partial<DemoPresentationBrowserModule>> {
  return import(/* @vite-ignore */ moduleName) as Promise<Partial<DemoPresentationBrowserModule>>;
}

export async function mountDemoPresentation(
  root: HTMLElement,
  loadModule: DemoPresentationModuleLoader = loadDemoPresentationModule,
): Promise<void> {
  const moduleName = root.dataset.demoBrowserModule;
  if (!moduleName) throw new Error('Demo presentation does not declare a browser module.');
  const presentation = await loadModule(moduleName);
  if (typeof presentation.mount !== 'function') {
    throw new Error(`Demo browser module ${moduleName} does not export mount().`);
  }
  await presentation.mount(root);
}
