import { Fragment, type ReactNode } from 'react';
import type { LocalizationContext } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import { useRequestLocalization } from '../ui/document';
import { reactPageResponse } from '../ui/page';
import {
  DEFAULT_DEMO_ID,
  defaultDemoForCategory,
  demoCategories,
  demonstrations,
  demosForCategory,
  hasDemoInspector,
  inspectorModes,
  sourceHref,
  type ArchitectureDemo,
  type InspectorMode,
} from './demos-page';

interface BrowserDemoMetadata {
  id: string;
  category: ArchitectureDemo['category'];
  categoryLabel: string;
  group: string;
  label: string;
  summary: string;
  hasInspector: boolean;
  guide: readonly string[];
  status: readonly string[];
  sourcePath: string;
  sourceUrl: string;
  inspectorLabel: string;
  request: {
    intro: string;
    fields: readonly { label: string; selector: string; empty: string }[];
  } | null;
}

function localizedDemo(demo: ArchitectureDemo, env: Env, localization: LocalizationContext): BrowserDemoMetadata {
  const hasInspector = hasDemoInspector(demo);
  return {
    id: demo.id,
    category: demo.category,
    categoryLabel: localization.exact(demo.category),
    group: localization.exact(demo.group),
    label: localization.exact(demo.label),
    summary: localization.exact(demo.summary),
    hasInspector,
    guide: hasInspector ? (demo.guide ?? []).map((step) => localization.exact(step)) : [],
    status: (demo.status ?? []).map((status) => localization.exact(status)),
    sourcePath: hasInspector ? demo.sourcePath : '',
    sourceUrl: hasInspector ? sourceHref(env, demo.sourcePath) : '',
    inspectorLabel: hasInspector ? localization.exact(`${demo.label} inspector`) : '',
    request: demo.request ? {
      intro: localization.exact(demo.request.intro),
      fields: demo.request.fields.map((field) => ({
        label: localization.exact(field.label),
        selector: field.selector,
        empty: localization.exact(field.empty),
      })),
    } : null,
  };
}

function demoLink(id: string, localization: LocalizationContext): string {
  const language = localization.locale === 'en' ? '' : `lang=${encodeURIComponent(localization.locale)}&`;
  return `?${language}demo=${encodeURIComponent(id)}#${id}`;
}

function CategoryTabs({ localization, selectedDemo }: Readonly<{ localization: LocalizationContext; selectedDemo: ArchitectureDemo }>) {
  const categoryLabel = localization.exact('Demo categories');
  return <div className="demo-category-tabs" role="tablist" aria-label={categoryLabel}>
    {demoCategories.map((category) => {
      const demos = demosForCategory(category);
      const defaultDemo = defaultDemoForCategory(category);
      const selected = category === selectedDemo.category;
      return <Fragment key={category}>
        <a
          className="demo-category-tab"
          id={demos.length === 1 ? defaultDemo.id : undefined}
          href={demoLink(defaultDemo.id, localization)}
          role="tab"
          aria-controls="demo-workbench"
          aria-selected={selected}
          tabIndex={selected ? 0 : -1}
          data-demo-link={defaultDemo.id}
          data-demo-category={category}
        >
          {category === 'AI' ? <span hidden><strong>AI / MCP</strong></span> : null}
          <strong>{localization.exact(category)}</strong>
        </a>
      </Fragment>;
    })}
  </div>;
}

function LocalSelectors({ localization, selectedDemo }: Readonly<{ localization: LocalizationContext; selectedDemo: ArchitectureDemo }>) {
  return <div className="demo-selector-slot" data-demo-selector-slot="">
    {demoCategories.map((category) => {
      const demos = demosForCategory(category);
      if (demos.length < 2) return null;
      return <nav
        key={category}
        className="demo-local-selector"
        aria-label={localization.exact(`${category} demos`)}
        data-demo-selector-category={category}
        hidden={category !== selectedDemo.category}
      >
        {demos.map((demo) => <a
          key={demo.id}
          id={demo.id}
          href={demoLink(demo.id, localization)}
          data-demo-link={demo.id}
          aria-current={demo.id === selectedDemo.id ? 'location' : undefined}
        >{localization.exact(demo.selectorLabel)}</a>)}
      </nav>;
    })}
  </div>;
}

function InspectorTabs({ demo, localization }: Readonly<{ demo: ArchitectureDemo; localization: LocalizationContext }>) {
  const modes = inspectorModes(demo);
  return <div className="demo-inspector-tabs" role="tablist" aria-label={localization.exact('Inspector modes')} data-demo-inspector-tabs="">
    {modes.map((mode, index) => <button
      key={mode}
      id={`demo-inspector-tab-${mode.toLowerCase()}`}
      className="demo-inspector-tab"
      type="button"
      role="tab"
      aria-controls="demo-inspector-panel"
      aria-selected={index === 0}
      tabIndex={index === 0 ? 0 : -1}
      data-demo-inspector-mode={mode}
    >{localization.exact(mode)}</button>)}
  </div>;
}

function DefaultInspector({ demo, env, localization }: Readonly<{
  demo: ArchitectureDemo;
  env: Env;
  localization: LocalizationContext;
}>) {
  return <aside id="demo-inspector" className="demo-inspector" data-demo-inspector="" aria-label={localization.exact(`${demo.label} inspector`)}>
    <details className="demo-inspector-disclosure" data-demo-inspector-disclosure="">
      <summary>{localization.exact('Inspector')}</summary>
      <div className="demo-inspector-header">
        <strong>{localization.exact('Inspector')}</strong>
        <span className="subtle" data-demo-inspector-context="">{localization.exact(demo.category)}</span>
        <button type="button" data-demo-inspector-close="">{localization.exact('Close inspector')}</button>
      </div>
      <div className="demo-inspector-static">
        <h3>{localization.exact('Guide')}</h3>
        <ol className="demo-guide-list">{(demo.guide ?? []).map((step) => <li key={step}>{localization.exact(step)}</li>)}</ol>
        {demo.request ? <>
          <h3>{localization.exact('Request')}</h3>
          <p>{localization.exact(demo.request.intro)}</p>
          <p>{localization.exact('Run a D1 operation to capture its response.')}</p>
        </> : null}
        <h3>{localization.exact('Evidence')}</h3>
        <ul className="demo-evidence-list">
          <li><strong>{localization.exact('Stable fragment: ')}</strong><code>#{demo.id}</code></li>
          <li><strong>{localization.exact('Implementation: ')}</strong><a href={sourceHref(env, demo.sourcePath)} target="_blank" rel="noreferrer">{demo.sourcePath}</a></li>
        </ul>
      </div>
      <InspectorTabs demo={demo} localization={localization} />
      <div
        id="demo-inspector-panel"
        className="demo-inspector-panel"
        role="tabpanel"
        aria-labelledby="demo-inspector-tab-guide"
        tabIndex={0}
        data-demo-inspector-panel=""
      >
        <ol className="demo-guide-list">{(demo.guide ?? []).map((step) => <li key={step}>{localization.exact(step)}</li>)}</ol>
      </div>
    </details>
  </aside>;
}

function DemosBrowserModule({ env, localization }: Readonly<{ env: Env; localization: LocalizationContext }>) {
  const source = routeUrl('operations.assets', { asset: browserAssetName('scripts.demos') });
  const demos = demonstrations.map((demo) => localizedDemo(demo, env, localization));
  const config = JSON.stringify({
    demos,
    defaultDemoId: DEFAULT_DEMO_ID,
    presentationPattern: routeUrl('demos.presentation', { demo: '__demo__' }),
  });
  const modes = Object.fromEntries((['Guide', 'Request', 'Evidence'] as const).map((mode) => [mode, localization.exact(mode)])) as Record<InspectorMode, string>;
  const messages = JSON.stringify({
    modes,
    loading: localization.exact('Loading {label} demonstration…'),
    failed: localization.exact('The demonstration could not be loaded.'),
    retry: localization.exact('Retry demo'),
    stableFragment: localization.exact('Stable fragment: '),
    implementation: localization.exact('Implementation: '),
    inspector: localization.exact('Inspector'),
    inspectorModes: localization.exact('Inspector modes'),
    closeInspector: localization.exact('Close inspector'),
    resetDemo: localization.exact('Reset demo'),
    resetQuestion: localization.exact('Reset this demo?'),
    resetD1: localization.exact('Your changes will be replaced with three fictional users and four related tasks.'),
    resetR2: localization.exact('Your uploads will be removed. Shared demo files stay in place.'),
    resetWebhooks: localization.exact('Your synthetic webhook events will be cleared.'),
    confirmReset: localization.exact('Confirm reset'),
    cancel: localization.exact('Cancel'),
    resetComplete: localization.exact('Demo reset complete.'),
    resetFailed: localization.exact('Reset failed — try again.'),
  });
  return <script type="module" src={source} data-demos-browser="" data-config={config} data-messages={messages} />;
}

export function DemosWorkbenchPage({ env, selectedDemo, initialPresentation }: Readonly<{
  env: Env;
  selectedDemo: ArchitectureDemo;
  initialPresentation: ReactNode;
}>) {
  const localization = useRequestLocalization();
  return <>
    <section className="page-header demo-page-header">
      <h1>{localization.exact('Architecture Demos')}</h1>
      <p className="lede">{localization.exact('Choose a capability, run one focused demonstration, and inspect what happened.')}</p>
    </section>
    <section className="demo-workbench-nav" aria-label={localization.exact('Architecture demo navigation')}>
      <CategoryTabs localization={localization} selectedDemo={selectedDemo} />
      <LocalSelectors localization={localization} selectedDemo={selectedDemo} />
    </section>
    <section id="demo-workbench" className="demo-workbench" data-demo-workbench="" data-demo-id={selectedDemo.id} aria-labelledby="demo-active-title">
      <header className="demo-active-header">
        <div className="demo-active-heading">
          <h2 id="demo-active-title" data-demo-active-title="">{localization.exact(selectedDemo.label)}</h2>
          <div className="demo-statuses" data-demo-statuses="" hidden={!selectedDemo.status?.length}>
            {(selectedDemo.status ?? []).map((status) => <span key={status} className="demo-status-chip">{localization.exact(status)}</span>)}
          </div>
          <button type="button" data-demo-reset="" hidden>{localization.exact('Reset demo')}</button>
          <button type="button" className="demo-inspector-toggle" data-demo-inspector-toggle="" aria-controls="demo-inspector" aria-expanded="false" hidden={!hasDemoInspector(selectedDemo)}>{localization.exact('Inspector')}</button>
        </div>
        <p className="demo-active-purpose" data-demo-purpose="">{localization.exact(selectedDemo.summary)}</p>
        <p className="demo-reset-notice" data-demo-reset-notice="" role="status" aria-live="polite" hidden />
      </header>
      <dialog className="demo-reset-dialog" data-demo-reset-dialog="" aria-labelledby="demo-reset-title" aria-describedby="demo-reset-description">
        <h2 id="demo-reset-title">{localization.exact('Reset this demo?')}</h2>
        <p id="demo-reset-description" data-demo-reset-description="" />
        <div className="button-row">
          <button type="button" data-demo-reset-cancel="">{localization.exact('Cancel')}</button>
          <button className="button-primary" type="button" data-demo-reset-confirm="">{localization.exact('Confirm reset')}</button>
        </div>
      </dialog>
      <div className="demo-workbench-layout" data-demo-inspector-enabled={String(hasDemoInspector(selectedDemo))}>
        <div className="demo-stage">
          <div className="demo-panel" data-demo-panel="" aria-busy="false">
            {initialPresentation}
          </div>
        </div>
        {hasDemoInspector(selectedDemo) ? <DefaultInspector demo={selectedDemo} env={env} localization={localization} /> : null}
      </div>
      <div className="demo-inspector-scrim" data-demo-inspector-scrim="" hidden />
    </section>
    <DemosBrowserModule env={env} localization={localization} />
  </>;
}

export async function renderDemosWorkbench(request: Request, env: Env): Promise<Response> {
  const requestedId = new URL(request.url).searchParams.get('demo');
  const selectedDemo = demonstrations.find((demo) => demo.id === requestedId)
    ?? demonstrations.find((demo) => demo.id === DEFAULT_DEMO_ID);
  if (!selectedDemo) throw new Error('No demonstrations registered.');
  const section = await selectedDemo.render(request, env, {
    scope: selectedDemo.id,
    idPrefix: selectedDemo.id,
    headingLevel: 2,
    canonicalPath: routeUrl('demos.index'),
    presentationPath: `${routeUrl('demos.index')}#${selectedDemo.id}`,
  });
  return reactPageResponse(env, 'Architecture Demos', <DemosWorkbenchPage env={env} selectedDemo={selectedDemo} initialPresentation={section.element} />, {
    routeId: 'demos.index',
    canonicalPath: routeUrl('demos.index'),
    description: 'Focused executable architecture demonstrations for data, APIs, integrations, identity, AI, platform runtime, and quality.',
  });
}

export {
  DemoHeading,
  DemoPresentationScope,
  createDemoPresentationScope,
  useDemoPresentationScope,
} from '../ui/demo-presentation-scope';
