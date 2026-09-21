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

function DurableObjectsPresentation({ env, localization }: Readonly<{ env: Env; localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const proofHeading = scope.id('proof-heading');
  return <>
    <section className="page-header lab-page-header">
      <DemoHeading level={1}>{exact('Durable Objects')}</DemoHeading>
      <p className="lede">{exact('Compare one increment with a burst of concurrent Worker requests coordinated through one state owner.')}</p>
      <div className="page-tools"><ReferenceDetails links={[
        routeSourceReference(env, 'src/demos/durable-objects-presentation.tsx'),
        { label: 'Durable Object API', href: sourceUrl(env, 'src/api/durable.ts') },
        { label: 'Coordinator class', href: sourceUrl(env, 'src/durable/demo-coordinator.ts') },
        { label: 'Binding configuration', href: sourceUrl(env, 'wrangler.jsonc') },
      ]} /></div>
    </section>
    <section className="panel" aria-labelledby={proofHeading}>
      <div className="lab-heading"><div><p className="eyebrow">{exact('Coordination proof')}</p><DemoHeading level={2} id={proofHeading}>{exact('Many requests, one state owner')}</DemoHeading></div><span className="badge" data-durable-current="">{exact('Loading counter')}</span></div>
      <div className="durable-flow" aria-label={exact('Ten requests enter one Durable Object and produce serialized state')}><strong>{exact('10 concurrent requests')}</strong><span aria-hidden="true">→</span><strong>{exact('One Durable Object')}</strong><span aria-hidden="true">→</span><strong>{exact('Serialized state')}</strong><span aria-hidden="true">→</span><strong>{exact('Final count')}</strong></div>
      <div className="button-row"><button type="button" data-durable-run="1">{exact('Increment once')}</button><button className="button-primary" type="button" data-durable-run="10">{exact('Send 10 concurrent increments')}</button></div>
      <p className="subtle" data-durable-status="" role="status" aria-live="polite">{exact('Reading the public coordinated counter…')}</p>
      <dl className="durable-results"><dt>{exact('Starting count')}</dt><dd data-durable-start="">—</dd><dt>{exact('Expected from this run')}</dt><dd data-durable-expected="">—</dd><dt>{exact('Final count')}</dt><dd data-durable-final="">—</dd><dt>{exact('Successful requests')}</dt><dd data-durable-success="">—</dd><dt>{exact('Duration')}</dt><dd data-durable-duration="">—</dd></dl>
      <details><summary>{exact('Inspect concurrent responses')}</summary><pre data-durable-raw="">{exact('No run yet.')}</pre></details>
    </section>
  </>;
}

export function durableObjectsSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  return createReactDemoSection(env, {
    key: 'durable-objects',
    title: 'Durable Objects',
    defaultPresentationPath: `${routeUrl('demos.index')}#durable-objects`,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.durableObjects') }),
    browserMessages: Object.freeze({
      unavailable: localization.exact('Unavailable'),
      ready: localization.exact('Ready to coordinate requests.'),
      dispatchingTen: localization.exact('Dispatching ten requests concurrently…'),
      sendingOne: localization.exact('Sending one request…'),
      incomplete: localization.exact('Some increments failed; the result is not presented as a complete coordination proof.'),
      otherActivity: localization.exact('requests succeeded. The shared public counter also changed during this run, so the final count includes other activity.'),
      complete: localization.exact('requests reached one object and produced the exact expected final count.'),
      runUnavailable: localization.exact('Coordination run unavailable.'),
      currentCount: localization.exact('Current count'),
      incrementFailed: localization.exact('Increment failed'),
      counterUnavailable: localization.exact('Counter unavailable'),
    }),
    children: <DurableObjectsPresentation env={env} localization={localization} />,
  }, options);
}
