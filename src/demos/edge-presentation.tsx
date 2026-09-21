import { sourceUrl } from '../lib/github';
import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { routeSourceReference } from '../ui/page';
import { createReactDemoSection } from '../ui/react-demo-section';
import { ReferenceDetails } from '../ui/reference-details';

function EdgePresentation({ env, localization }: Readonly<{ env: Env; localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const flowHeading = scope.id('flow-heading');
  return <>
    <section className="page-header lab-page-header">
      <DemoHeading level={1}>{exact('Cloudflare Edge')}</DemoHeading>
      <p className="lede">{exact('Follow one request into the Worker and separate received values from edge-derived context and deliberately excluded private data.')}</p>
      <div className="page-tools"><ReferenceDetails links={[
        routeSourceReference(env, 'src/demos/edge-presentation.tsx'),
        { label: 'Runtime API', href: sourceUrl(env, 'src/api/runtime.ts') },
        { label: 'Cloudflare configuration', href: sourceUrl(env, 'wrangler.jsonc') },
      ]} /></div>
    </section>
    <section className="panel edge-request-flow" aria-labelledby={flowHeading}>
      <div className="lab-heading"><div><p className="eyebrow">{exact('Executable proof')}</p><DemoHeading level={2} id={flowHeading}>{exact('Request → Cloudflare edge → Worker')}</DemoHeading></div><button className="button-primary" type="button" data-edge-run="">{exact('Inspect this edge request')}</button></div>
      <p className="subtle" data-edge-status="" role="status" aria-live="polite">{exact('Run the inspection to categorize the public-safe response.')}</p>
      <div className="edge-evidence-grid">
        <article><p className="eyebrow">{exact('Received')}</p><DemoHeading level={3}>{exact('Request supplied')}</DemoHeading><dl data-edge-received=""><dt>{exact('Status')}</dt><dd>{exact('Waiting')}</dd></dl></article>
        <article><p className="eyebrow">{exact('Edge-derived')}</p><DemoHeading level={3}>{exact('Cloudflare supplied')}</DemoHeading><dl data-edge-derived=""><dt>{exact('Status')}</dt><dd>{exact('Waiting')}</dd></dl></article>
        <article><p className="eyebrow">{exact('Intentionally excluded')}</p><DemoHeading level={3}>{exact('Privacy boundary')}</DemoHeading><ul><li>{exact('Client IP address')}</li><li>{exact('Cookies')}</li><li>{exact('Authorization')}</li><li>{exact('Raw request headers')}</li></ul></article>
      </div>
      <details><summary>{exact('Inspect response')}</summary><pre data-edge-raw="">{exact('No response yet.')}</pre></details>
    </section>
  </>;
}

export function edgeSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  return createReactDemoSection(env, {
    key: 'edge',
    title: 'Cloudflare Edge',
    defaultPresentationPath: `${routeUrl('demos.index')}#edge`,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.edge') }),
    browserMessages: Object.freeze({
      notSupplied: localization.exact('Not supplied'),
      inspecting: localization.exact('Inspecting the current request…'),
      failed: localization.exact('Inspection failed'),
      method: localization.exact('Method'),
      protocol: localization.exact('Protocol'),
      host: localization.exact('Host'),
      accepts: localization.exact('Accepts'),
      cachePolicy: localization.exact('Cache policy'),
      categorized: localization.exact('Categorized the allowlisted response. Private request data remained excluded.'),
      unavailable: localization.exact('Inspection unavailable.'),
    }),
    children: <EdgePresentation env={env} localization={localization} />,
  }, options);
}
