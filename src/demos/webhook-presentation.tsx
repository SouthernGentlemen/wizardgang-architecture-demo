import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';

function repositoryName(env: Env): string {
  try {
    const url = new URL(env.GITHUB_REPO_URL);
    return url.hostname === 'github.com'
      ? url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '')
      : 'Configured GitHub repository';
  } catch {
    return 'Configured GitHub repository';
  }
}

function webhookBrowserMessages(localization: LocalizationContext): Readonly<Record<string, string>> {
  const exact = (english: string) => localization.exact(english);
  return Object.freeze({
    noDeliveries: exact('No release deliveries yet'),
    noDeliveriesHelp: exact('Simulate a signed release webhook to run the complete validation path.'),
    verified: exact('Verified'),
    unknown: exact('unknown'),
    signatureValid: exact('Signature valid'),
    repositoryAllowed: exact('Repository allowed'),
    deliveryUnique: exact('Delivery unique'),
    eventAllowed: exact('Event allowed'),
    sanitized: exact('Sanitized'),
    sanitizedSummary: exact('Sanitized event summary'),
    connected: exact('Connected'),
    unavailable: exact('Unavailable'),
    evidenceUnavailable: localization.t('client.webhook_unavailable', 'Verified delivery evidence is unavailable.'),
    working: exact('Working'),
    failed: exact('Failed'),
    verifiedDelivery: exact('verified delivery'),
    verifiedDeliveries: exact('verified deliveries'),
    pollingEvery: exact('polling every'),
    liveUnavailable: exact('Live GitHub data is unavailable.'),
    liveReadOnly: exact('Live feed is read-only. Sign in as a demo admin to start a release.'),
    liveReady: exact('All required CI checks passed on this pull request.'),
    liveWaiting: exact('Merge & Release is available after all required CI checks pass.'),
  });
}

function WebhookPresentation({ env, localization }: Readonly<{ env: Env; localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const connectionHeading = scope.id('webhook-connection-heading');
  const testHeading = scope.id('webhook-test-heading');
  const deliveriesHeading = scope.id('webhook-deliveries-heading');
  const liveHeading = scope.id('webhook-live-heading');
  const repository = repositoryName(env);
  const stages = [
    'Payload received',
    'Signature valid',
    'Repository allowed',
    'Delivery unique',
    'Event allowed',
    'Summary stored',
  ] as const;

  return <>
    <section className="page-header lab-page-header webhook-page-header" id={scope.id('webhooks')}>
      <DemoHeading level={1}>{exact('Signed Webhooks')}</DemoHeading>
      <p className="lede">{exact('Receive a release notification, verify it like a GitHub delivery, and inspect the sanitized result.')}</p>
    </section>
    <section className="webhook-connection" aria-labelledby={connectionHeading}>
      <div><p className="eyebrow">{exact('GitHub webhooks')}</p><DemoHeading level={2} id={connectionHeading}>{exact('Connected receiver')}</DemoHeading></div>
      <span className="badge badge-ok" data-webhook-state="">{exact('Connecting')}</span>
      <dl>
        <dt>{exact('Endpoint')}</dt><dd><code>https://demo.wizardgang.ai/webhooks/github</code></dd>
        <dt>{exact('Repository')}</dt><dd><a href={env.GITHUB_REPO_URL}>{repository}</a></dd>
        <dt>{exact('Supported')}</dt><dd className="webhook-tags"><span>push</span><span>pull_request</span><span>workflow_run</span><span>release</span><span>ping</span></dd>
      </dl>
    </section>
    <section className="webhook-live panel" aria-labelledby={liveHeading} data-live-git="">
      <div className="webhook-section-heading">
        <div>
          <p className="eyebrow">{exact('Live Git delivery')}</p>
          <DemoHeading level={2} id={liveHeading}>{exact('Hotfix release lifecycle')}</DemoHeading>
          <p>{exact('Follow actual GitHub checks, jobs, steps, and signed webhook deliveries. Release controls require demo admin authentication.')}</p>
        </div>
        <span className="badge" data-live-state="">{exact('Loading live GitHub data…')}</span>
      </div>
      <p className="subtle" data-live-message="" role="status" aria-live="polite">{exact('Live feed is read-only. Sign in as a demo admin to start a release.')}</p>
      <div className="webhook-live-actions">
        <form data-live-auth="" className="webhook-live-auth">
          <label>{exact('Admin user')}<input name="username" autoComplete="username" required /></label>
          <label>{exact('Admin password')}<input name="password" type="password" autoComplete="current-password" required /></label>
          <button type="submit" className="button">{exact('Unlock release controls')}</button>
        </form>
        <div data-live-controls="" hidden>
          <label>{exact('Version bump')}<select data-live-bump=""><option value="patch">{exact('Patch hotfix')}</option><option value="minor">{exact('Minor')}</option><option value="major">{exact('Major')}</option></select></label>
          <button type="button" className="button" data-live-preflight="">{exact('Review release preflight')}</button>
          <button type="button" className="button-primary" data-live-start="" disabled>{exact('Start live release')}</button>
          <button type="button" className="button-primary" data-live-release="" disabled>{exact('Merge & Release')}</button>
        </div>
      </div>
      <div data-live-preflight-panel="" className="webhook-live-preflight" hidden>
        <h3>{exact('Release preflight')}</h3>
        <p data-live-target="" />
        <ol data-live-commits="" />
        <label className="webhook-live-confirm"><input type="checkbox" data-live-confirm="" />{exact('I reviewed the target version and commit range')}</label>
        <p className="subtle">{exact('Confirm only after reviewing the target version and every commit since the last published release.')}</p>
      </div>
      <ol className="webhook-live-lifecycle" aria-label={exact('Live release lifecycle')} data-live-lifecycle="">
        {['Branch', 'Pull request', 'CI', 'Merge', 'Tag', 'Release', 'Deploy', 'Health'].map((label) => <li key={label} data-state="queued"><span>{exact(label)}</span><strong>{exact('Waiting')}</strong></li>)}
      </ol>
      <div className="webhook-live-feed" data-live-feed="" aria-label={exact('Live GitHub Actions feed')}>
        <p data-live-empty="">{exact('Live GitHub data is unavailable.')}</p>
      </div>
    </section>
    <section className="webhook-test panel" aria-labelledby={testHeading}>
      <div className="webhook-section-heading">
        <div>
          <p className="eyebrow">{exact('Executable proof')}</p>
          <DemoHeading level={2} id={testHeading}>{exact('Simulate a signed release webhook')}</DemoHeading>
          <p>{exact('Uses the current release as realistic')} <code>release.published</code> {exact('event data. The Worker signs it, then sends it through the same verifier and persistence path as a configured GitHub delivery.')}</p>
        </div>
        <button className="button-primary" type="button" data-webhook-send="">{exact('Simulate signed release webhook')}</button>
      </div>
      <ol className="webhook-pipeline" aria-label={exact('Webhook verification stages')}>
        {stages.map((stage, index) => <li key={stage} data-webhook-stage="" data-state="idle"><span>{index + 1}</span><strong>{exact(stage)}</strong></li>)}
      </ol>
    </section>
    <section className="webhook-deliveries" aria-labelledby={deliveriesHeading}>
      <div className="webhook-section-heading">
        <div>
          <p className="eyebrow">{exact('Sanitized D1 history')}</p>
          <DemoHeading level={2} id={deliveriesHeading}>{exact('Verified deliveries')}</DemoHeading>
          <p className="subtle" data-webhook-meta="" aria-live="polite">{exact('Loading verified deliveries…')}</p>
        </div>
      </div>
      <div className="webhook-events" data-webhook-events="" />
    </section>
  </>;
}

export function webhooksSection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const presentationPath = `${routeUrl('demos.index')}#webhooks`;
  return createReactDemoSection(env, {
    key: 'webhooks',
    title: 'Signed Webhooks',
    defaultPresentationPath: presentationPath,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.webhooks') }),
    browserMessages: webhookBrowserMessages(localization),
    children: <WebhookPresentation env={env} localization={localization} />,
  }, options);
}
