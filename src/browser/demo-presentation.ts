export type DemoPresentationMount = (root: HTMLElement) => void | Promise<void>;

export interface DemoPresentationBrowserModule {
  mount: DemoPresentationMount;
}

export type DemoPresentationModuleLoader = (
  moduleName: string,
) => Promise<Partial<DemoPresentationBrowserModule>>;

function executeLegacyScripts(root: ParentNode): void {
  root.querySelectorAll('script').forEach((script) => {
    const replacement = document.createElement('script');
    for (const attribute of script.attributes) replacement.setAttribute(attribute.name, attribute.value);
    replacement.textContent = script.textContent;
    script.replaceWith(replacement);
  });
}

async function loadDemoPresentationModule(moduleName: string): Promise<Partial<DemoPresentationBrowserModule>> {
  return import(/* @vite-ignore */ moduleName) as Promise<Partial<DemoPresentationBrowserModule>>;
}

export async function mountDemoPresentation(
  root: HTMLElement,
  loadModule: DemoPresentationModuleLoader = loadDemoPresentationModule,
): Promise<void> {
  const moduleName = root.dataset.demoBrowserModule;
  if (!moduleName) {
    executeLegacyScripts(root);
    return;
  }
  const presentation = await loadModule(moduleName);
  if (typeof presentation.mount !== 'function') {
    throw new Error(`Demo browser module ${moduleName} does not export mount().`);
  }
  await presentation.mount(root);
}
