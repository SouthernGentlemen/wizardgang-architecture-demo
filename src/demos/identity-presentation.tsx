import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';

function identityBrowserMessages(
  localization: LocalizationContext,
  identityPageUrl: string,
): Readonly<Record<string, string>> {
  const exact = (english: string) => localization.exact(english);
  return Object.freeze({
    identityPageUrl,
    providerUnconfigured: localization.t('client.provider_unconfigured', 'That provider is not configured in this environment yet. The implementation is ready for environment-owned credentials.'),
    authFailed: localization.t('client.auth_failed', 'Authentication could not be validated. No application session was created.'),
    authSuccess: localization.t('client.auth_success', 'Provider authentication validated. A short-lived WizardGang session is active.'),
    identityUnavailable: localization.t('client.identity_unavailable', 'The identity session service is temporarily unavailable.'),
    signoutSuccess: localization.t('client.signout_success', 'WizardGang application session ended.'),
    signoutFailed: localization.t('client.signout_failed', 'The session could not be ended.'),
    microsoft: exact('Microsoft Entra ID'),
    google: exact('Google'),
    github: exact('GitHub'),
    availableSignIn: exact('Available — Sign in'),
    notConfigured: exact('Not configured in this environment'),
    configurationFailed: exact('Configuration check failed'),
    evaluating: exact('EVALUATING'),
    unavailable: exact('UNAVAILABLE'),
    noDecision: exact('No decision returned'),
    decisionUnavailable: exact('The authorization decision could not be evaluated.'),
    authenticated: exact('AUTHENTICATED'),
  });
}

function IdentityPresentation({ env, localization }: Readonly<{ env: Env; localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const id = (value: string) => scope.id(value);
  const tabs = [
    ['provider', 'Provider payload'],
    ['normalized', 'Normalized identity'],
    ['authorization', 'Authorization'],
    ['protocol', 'Protocol'],
  ] as const;

  return <>
    <section className="page-header lab-page-header identity-page-header">
      <DemoHeading level={1}>{exact('Authentication & SSO')}</DemoHeading>
      <p className="lede">{exact('Authenticate against real identity providers, inspect the validated identity payload, and see how provider-specific claims become one application identity.')}</p>
      <div className="page-tools"><a className="text-link" href={sourceUrl(env, 'src/demos/identity-presentation.tsx')}>{exact('View source ↗')}</a></div>
    </section>

    <p className="identity-notice" role="status" aria-live="polite" data-identity-notice="" hidden />

    <section className="identity-signin" id={id('sso')} aria-labelledby={id('identity-signin-heading')}>
      <div className="identity-section-heading">
        <div><p className="eyebrow">{exact('Sign in')}</p><DemoHeading level={2} id={id('identity-signin-heading')}>{exact('Choose a trust relationship')}</DemoHeading></div>
        <p>{exact('Credentials and protocol secrets stay on the Worker.')}</p>
      </div>
      <p className="identity-boundary-note">{exact('Multiple identity protocols enter here. The application receives one normalized authorization identity.')}</p>
      <article className="identity-provider identity-enterprise" id={id('oauth')}>
        <div className="identity-provider-mark microsoft-mark" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="identity-provider-copy">
          <p className="identity-provider-kind">{exact('Enterprise SSO')}</p>
          <DemoHeading level={3}>Microsoft Entra ID</DemoHeading>
          <p>{exact('Modern enterprise authentication through OpenID Connect and the OAuth 2.0 authorization-code flow.')}</p>
          <div className="identity-provider-meta"><span>OIDC</span><span>OAuth 2.0</span><span data-config-status="microsoft">{exact('Checking configuration…')}</span></div>
        </div>
        <div className="identity-provider-actions">
          <a className="button button-primary" data-provider-href="/auth/microsoft" data-provider-action="microsoft" aria-disabled="true">{exact('Sign in with Microsoft')}</a>
          <a className="text-link" data-provider-href="/auth/saml" data-provider-action="saml" aria-disabled="true">{exact('Use SAML 2.0 instead →')}</a>
        </div>
      </article>

      <div className="identity-section-heading identity-secondary-heading">
        <div><p className="eyebrow">{exact('External identity providers')}</p><DemoHeading level={2}>{exact('One identity boundary')}</DemoHeading></div>
        <p>{exact('Common providers enter through the same normalization contract.')}</p>
      </div>
      <div className="identity-provider-grid">
        <article className="identity-provider">
          <div className="identity-provider-mark google-mark" aria-hidden="true">G</div>
          <div className="identity-provider-copy">
            <p className="identity-provider-kind">{exact('OpenID Connect')}</p><DemoHeading level={3}>Google</DemoHeading>
            <p>{exact('Standard Google-account authentication with no Workspace or organizational-domain assumption.')}</p>
            <div className="identity-provider-meta"><span>OIDC</span><span data-config-status="google">{exact('Checking configuration…')}</span></div>
          </div>
          <div className="identity-provider-actions"><a className="button" data-provider-href="/auth/google" data-provider-action="google" aria-disabled="true">{exact('Sign in with Google')}</a></div>
        </article>
        <article className="identity-provider">
          <div className="identity-provider-mark github-mark" aria-hidden="true">GH</div>
          <div className="identity-provider-copy">
            <p className="identity-provider-kind">{exact('Developer identity')}</p><DemoHeading level={3}>GitHub</DemoHeading>
            <p>{exact('OAuth authentication with minimal profile and verified-email scopes, followed by API identity revalidation.')}</p>
            <div className="identity-provider-meta"><span>OAuth 2.0</span><span data-config-status="github">{exact('Checking configuration…')}</span></div>
          </div>
          <div className="identity-provider-actions"><a className="button" data-provider-href="/auth/github" data-provider-action="github" aria-disabled="true">{exact('Sign in with GitHub')}</a></div>
        </article>
      </div>
    </section>

    <section className="identity-result" aria-labelledby={id('identity-result-heading')} data-identity-result="" hidden>
      <div className="identity-authenticated-heading">
        <div><p className="eyebrow">{exact('Authenticated')}</p><DemoHeading level={2} id={id('identity-result-heading')} data-identity-name="">{exact('Identity')}</DemoHeading><p data-identity-email="" /></div>
        <div className="identity-authenticated-state"><span className="badge badge-ok" data-identity-provider="">{exact('Provider')}</span><strong data-identity-badges="">{exact('Authenticated')}</strong><button type="button" data-identity-logout="">{exact('Sign out')}</button></div>
      </div>
      <div className="identity-tabs" role="tablist" aria-label={exact('Authentication result views')}>
        {tabs.map(([name, label], index) => <button
          key={name}
          type="button"
          role="tab"
          aria-selected={index === 0}
          aria-controls={id(`identity-${name}-panel`)}
          id={id(`identity-${name}-tab`)}
          tabIndex={index ? -1 : undefined}
          data-identity-tab={name}
        >{exact(label)}</button>)}
      </div>
      <section className="panel identity-inspector-panel" role="tabpanel" aria-labelledby={id('identity-provider-tab')} id={id('identity-provider-panel')} data-identity-panel="provider">
        <div className="identity-inspector-heading"><div><p className="eyebrow">{exact('Received → validated')}</p><DemoHeading level={3} data-payload-label="">{exact('Validated provider payload')}</DemoHeading></div><span className="badge badge-ok">{exact('Sanitized')}</span></div>
        <div className="identity-validation-grid" data-validation-list="" />
        <pre data-provider-payload="" />
      </section>
      <section className="panel identity-inspector-panel" role="tabpanel" aria-labelledby={id('identity-normalized-tab')} id={id('identity-normalized-panel')} data-identity-panel="normalized" hidden>
        <div className="identity-inspector-heading"><div><p className="eyebrow">{exact('Application contract')}</p><DemoHeading level={3}>{exact('Normalized identity')}</DemoHeading></div><span className="badge">{exact('Provider-neutral')}</span></div>
        <p className="subtle">{exact('Only fields legitimately derived from validated provider data cross this boundary.')}</p>
        <pre data-normalized-identity="" />
      </section>
      <section className="panel identity-inspector-panel" role="tabpanel" aria-labelledby={id('identity-authorization-tab')} id={id('identity-authorization-panel')} data-identity-panel="authorization" hidden>
        <div className="identity-inspector-heading"><div><p className="eyebrow">{exact('Application authorization')}</p><DemoHeading level={3}>{exact('What can this identity do?')}</DemoHeading></div><span className="badge">{exact('Independent policy')}</span></div>
        <div className="identity-policy-subject"><strong data-policy-name="">{exact('Authenticated identity')}</strong><span data-policy-context="" /></div>
        <div className="identity-policy-actions" role="group" aria-label={exact('Requested action')}><button type="button" data-authorize="demo:read">{exact('Evaluate demo:read')}</button><button type="button" data-authorize="demo:write">{exact('Evaluate demo:write')}</button></div>
        <div className="identity-decision" data-authorization-result="" hidden><strong data-decision="" /><p data-decision-detail="" /><small>demo:read → {exact('authenticated identity')}<br />demo:write → {exact('authenticated identity, visitor sandbox only')}<br />caller-selected namespaces → {exact('managed operator credential only')}</small></div>
      </section>
      <section className="panel identity-inspector-panel" role="tabpanel" aria-labelledby={id('identity-protocol-tab')} id={id('identity-protocol-panel')} data-identity-panel="protocol" hidden>
        <div className="identity-inspector-heading"><div><p className="eyebrow">{exact('Trust evidence')}</p><DemoHeading level={3} data-protocol-name="">{exact('Protocol')}</DemoHeading></div><span className="badge badge-ok">{exact('Validated')}</span></div>
        <ol className="identity-protocol-steps" data-protocol-steps="" />
        <details data-assertion-details="" hidden><summary>{exact('View sanitized assertion XML')}</summary><pre data-sanitized-assertion="" /></details>
      </section>
    </section>

    <section className="panel identity-federation" id={id('saml')} aria-labelledby={id('identity-federation-heading')}>
      <div>
        <p className="eyebrow">{exact('Enterprise federation')}</p>
        <DemoHeading level={2} id={id('identity-federation-heading')}>Microsoft Entra ID / SAML 2.0</DemoHeading>
        <p>{exact('Authenticate through an Entra enterprise application. The Worker validates the signed assertion before any claim reaches application policy.')}</p>
        <div className="identity-provider-meta"><span>{exact('Signed assertion')}</span><span>{exact('Audience')}</span><span>{exact('Time bounds')}</span><span>{exact('Replay protection')}</span><span data-config-status="saml">{exact('Checking configuration…')}</span></div>
      </div>
      <div className="identity-provider-actions"><a className="button" data-provider-href="/auth/saml" data-provider-action="saml" aria-disabled="true">{exact('Try SAML authentication')}</a><a className="text-link" href="/auth/saml/metadata">{exact('View SP metadata ↗')}</a></div>
    </section>
  </>;
}

export function identitySection(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const presentationPath = `${routeUrl('demos.index')}#identity`;
  const browserPresentationPath = options.presentationPath ?? presentationPath;
  return createReactDemoSection(env, {
    key: 'identity',
    title: 'Authentication & SSO',
    defaultPresentationPath: presentationPath,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.identity') }),
    browserMessages: identityBrowserMessages(localization, browserPresentationPath),
    children: <IdentityPresentation env={env} localization={localization} />,
  }, options);
}
