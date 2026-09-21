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

function WorkersPresentation({ env, localization }: Readonly<{ env: Env; localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const policyHeading = scope.id('policy-heading');
  return <>
    <section className="page-header lab-page-header">
      <DemoHeading level={1}>{exact('Cloudflare Workers')}</DemoHeading>
      <p className="lede">{exact('Change a request and let the live Worker explain its routing, caching, and origin-work decision.')}</p>
      <div className="page-tools"><ReferenceDetails links={[
        routeSourceReference(env, 'src/demos/workers-presentation.tsx'),
        { label: 'Runtime policy', href: sourceUrl(env, 'src/api/runtime.ts') },
        { label: 'Worker entry point', href: sourceUrl(env, 'src/index.ts') },
      ]} /></div>
    </section>
    <section className="panel" aria-labelledby={policyHeading}>
      <p className="eyebrow">{exact('Interactive policy explorer')}</p><DemoHeading level={2} id={policyHeading}>{exact('Compose a request')}</DemoHeading>
      <form className="lab-form worker-policy-form" data-worker-policy="">
        <label>{exact('Method')}<select name="method"><option>GET</option><option>POST</option></select></label>{' '}
        <label>{exact('Resource')}<select name="resource"><option value="asset">{exact('Static asset')}</option><option value="dynamic">{exact('Dynamic route')}</option></select></label>{' '}
        <label className="worker-policy-check"><input type="checkbox" name="cookie" /> {exact('Cookie present')}</label>{' '}
        <label className="worker-policy-check"><input type="checkbox" name="authorization" /> {exact('Authorization present')}</label>{' '}
        <div className="button-row"><button className="button-primary" type="submit">{exact('Apply edge request policy')}</button></div>
      </form>
      <p className="subtle" data-worker-status="" role="status" aria-live="polite">{exact('Choose request properties, then run the real policy.')}</p>
      <div className="worker-decision-grid" data-worker-result="" hidden>
        <article><span>{exact('Cacheable?')}</span><strong data-worker-cacheable="">—</strong></article>
        <article><span>{exact('Route')}</span><strong data-worker-route="">—</strong></article>
        <article><span>{exact('Origin work')}</span><strong data-worker-origin="">—</strong></article>
      </div>
      <p data-worker-reason="" />
      <details><summary>{exact('Inspect request and response')}</summary><pre data-worker-raw="">{exact('No response yet.')}</pre></details>
    </section>
  </>;
}

export function workersSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  return createReactDemoSection(env, {
    key: 'workers',
    title: 'Cloudflare Workers',
    defaultPresentationPath: `${routeUrl('demos.index')}#workers`,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.workers') }),
    browserMessages: Object.freeze({
      applying: localization.exact('Applying the edge policy…'),
      unavailable: localization.exact('Policy unavailable.'),
      yes: localization.exact('YES'),
      no: localization.exact('NO'),
      required: localization.exact('REQUIRED'),
      skipped: localization.exact('SKIPPED'),
      complete: localization.exact('The stateless Worker returned its decision.'),
    }),
    children: <WorkersPresentation env={env} localization={localization} />,
  }, options);
}
