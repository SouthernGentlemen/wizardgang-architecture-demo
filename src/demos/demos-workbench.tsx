import { Fragment } from 'react';
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
  tryThis: string;
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
  return {
    id: demo.id,
    category: demo.category,
    categoryLabel: localization.exact(demo.category),
    group: localization.exact(demo.group),
    label: localization.exact(demo.label),
    summary: localization.exact(demo.summary),
    tryThis: localization.exact(demo.tryThis),
    guide: demo.guide.map((step) => localization.exact(step)),
    status: (demo.status ?? []).map((status) => localization.exact(status)),
    sourcePath: demo.sourcePath,
    sourceUrl: sourceHref(env, demo.sourcePath),
    inspectorLabel: localization.exact(`${demo.label} inspector`),
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

function CategoryTabs({ localization }: Readonly<{ localization: LocalizationContext }>) {
  const categoryLabel = localization.exact('Demo categories');
  return <div className="demo-category-tabs" role="tablist" aria-label={categoryLabel}>
    {demoCategories.map((category) => {
      const demos = demosForCategory(category);
      const defaultDemo = defaultDemoForCategory(category);
      const selected = category === 'Data';
      return <Fragment key={category}>
        <a
          className="demo-category-tab"
          id={demos.length === 1 ? defaultDemo.id : undefined}
          href={`#${defaultDemo.id}`}
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

function LocalSelectors({ localization }: Readonly<{ localization: LocalizationContext }>) {
  return <div className="demo-selector-slot" data-demo-selector-slot="">
    {demoCategories.map((category) => {
      const demos = demosForCategory(category);
      if (demos.length < 2) return null;
      return <nav
        key={category}
        className="demo-local-selector"
        aria-label={localization.exact(`${category} demos`)}
        data-demo-selector-category={category}
        hidden={category !== 'Data'}
      >
        {demos.map((demo) => <a
          key={demo.id}
          id={demo.id}
          href={`#${demo.id}`}
          data-demo-link={demo.id}
          aria-current={demo.id === DEFAULT_DEMO_ID ? 'location' : undefined}
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
  return <>
    <aside className="demo-inspector" data-demo-inspector="" aria-label={localization.exact(`${demo.label} inspector`)}>
      <div className="demo-inspector-header">
        <strong>{localization.exact('Inspector')}</strong>
        <span className="subtle" data-demo-inspector-context="">{localization.exact(demo.category)}</span>
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
        <ol className="demo-guide-list">{demo.guide.map((step) => <li key={step}>{localization.exact(step)}</li>)}</ol>
      </div>
    </aside>
    <div className="demo-workbench-tools" aria-label={localization.exact('Demo tools')}>
      <button type="button" data-demo-reset="" hidden>{localization.exact('Reset demo')}</button>
      <a href={sourceHref(env, demo.sourcePath)} target="_blank" rel="noreferrer" data-demo-source="">{localization.exact('View source')}</a>
    </div>
  </>;
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
  });
  return <script type="module" src={source} data-demos-browser="" data-config={config} data-messages={messages} />;
}

export function DemosWorkbenchPage({ env }: Readonly<{ env: Env }>) {
  const localization = useRequestLocalization();
  const defaultDemo = demonstrations.find((demo) => demo.id === DEFAULT_DEMO_ID) ?? demonstrations[0];
  if (!defaultDemo) throw new Error('No demonstrations registered.');
  return <>
    <section className="page-header">
      <h1>{localization.exact('Architecture Demos')}</h1>
      <p className="lede">{localization.exact('Choose a capability, run one focused demonstration, and inspect what happened.')}</p>
    </section>
    <section className="demo-workbench-nav" aria-label={localization.exact('Architecture demo navigation')}>
      <CategoryTabs localization={localization} />
      <LocalSelectors localization={localization} />
    </section>
    <section id="demo-workbench" className="demo-workbench" data-demo-workbench="" data-demo-id={DEFAULT_DEMO_ID} aria-labelledby="demo-active-title">
      <header className="demo-active-header">
        <p className="demo-active-context" data-demo-active-context="">{localization.exact(defaultDemo.category)} / {localization.exact(defaultDemo.group)}</p>
        <div className="demo-active-heading">
          <h2 id="demo-active-title" data-demo-active-title="">{localization.exact(defaultDemo.label)}</h2>
          <div className="demo-statuses" data-demo-statuses="" hidden={!defaultDemo.status?.length}>
            {(defaultDemo.status ?? []).map((status) => <span key={status} className="demo-status-chip">{localization.exact(status)}</span>)}
          </div>
        </div>
        <p className="demo-active-purpose" data-demo-purpose="">{localization.exact(defaultDemo.summary)}</p>
        <p className="demo-try-this"><strong>{localization.exact('Try this:')}</strong><span data-demo-try="">{localization.exact(defaultDemo.tryThis)}</span></p>
      </header>
      <div className="demo-workbench-layout">
        <div className="demo-stage">
          <div className="demo-panel" data-demo-panel="" aria-busy="true">
            <div className="demo-panel-state" role="status"><span>{localization.exact('Loading D1 demonstration…')}</span></div>
          </div>
        </div>
        <DefaultInspector demo={defaultDemo} env={env} localization={localization} />
      </div>
    </section>
    <DemosBrowserModule env={env} localization={localization} />
  </>;
}

export function renderDemosWorkbench(env: Env): Response {
  return reactPageResponse(env, 'Architecture Demos', <DemosWorkbenchPage env={env} />, {
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
