import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';

export function renderIdentityDemo(env: Env): Response {
  const sources = [
    ['Route definition', 'src/demos/identity.ts'],
    ['Identity console', 'src/demos/identity-page.ts'],
    ['Provider boundary', 'src/api/identity.ts'],
    ['Session protection', 'src/lib/identity-session.ts'],
    ['Identity design', 'docs/IDENTITY.md'],
    ['Session schema', 'migrations/0010_identity_sessions.sql'],
    ['Tests', 'tests/identity.test.ts'],
  ];
  return shell(env, 'Authentication & SSO', `
<section class="page-header lab-page-header identity-page-header">
  <p class="eyebrow">Interfaces / Identity</p>
  <h1>Authentication &amp; SSO</h1>
  <p class="lede">Authenticate against real identity providers, inspect the validated identity payload, and see how provider-specific claims become one application identity.</p>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/identity-page.ts'))}">View source ↗</a></div>
</section>

<p class="identity-notice" role="status" aria-live="polite" data-identity-notice hidden></p>

<section class="identity-signin" id="sso" aria-labelledby="identity-signin-heading">
  <div class="identity-section-heading"><div><p class="eyebrow">Sign in</p><h2 id="identity-signin-heading">Choose a trust relationship</h2></div><p>Credentials and protocol secrets stay on the Worker.</p></div>
  <article class="identity-provider identity-enterprise" id="oauth">
    <div class="identity-provider-mark microsoft-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div class="identity-provider-copy">
      <p class="identity-provider-kind">Enterprise SSO</p>
      <h3>Microsoft Entra ID</h3>
      <p>Modern enterprise authentication through OpenID Connect and the OAuth 2.0 authorization-code flow.</p>
      <div class="identity-provider-meta"><span>OIDC</span><span>OAuth 2.0</span><span data-config-status="microsoft">Checking configuration…</span></div>
    </div>
    <div class="identity-provider-actions">
      <a class="button button-primary" href="/identity/microsoft" data-provider-action="microsoft">Sign in with Microsoft</a>
      <a class="text-link" href="/identity/saml" data-provider-action="saml">Use SAML 2.0 instead →</a>
    </div>
  </article>

  <div class="identity-section-heading identity-secondary-heading"><div><p class="eyebrow">External identity providers</p><h2>One identity boundary</h2></div><p>Common providers enter through the same normalization contract.</p></div>
  <div class="identity-provider-grid">
    <article class="identity-provider">
      <div class="identity-provider-mark google-mark" aria-hidden="true">G</div>
      <div class="identity-provider-copy"><p class="identity-provider-kind">OpenID Connect</p><h3>Google</h3><p>Standard Google-account authentication with no Workspace or organizational-domain assumption.</p><div class="identity-provider-meta"><span>OIDC</span><span data-config-status="google">Checking configuration…</span></div></div>
      <div class="identity-provider-actions"><a class="button" href="/identity/google" data-provider-action="google">Sign in with Google</a></div>
    </article>
    <article class="identity-provider">
      <div class="identity-provider-mark github-mark" aria-hidden="true">GH</div>
      <div class="identity-provider-copy"><p class="identity-provider-kind">Developer identity</p><h3>GitHub</h3><p>OAuth authentication with minimal profile and verified-email scopes, followed by API identity revalidation.</p><div class="identity-provider-meta"><span>OAuth 2.0</span><span data-config-status="github">Checking configuration…</span></div></div>
      <div class="identity-provider-actions"><a class="button" href="/identity/github" data-provider-action="github">Sign in with GitHub</a></div>
    </article>
  </div>
</section>

<section class="identity-result" aria-labelledby="identity-result-heading" data-identity-result hidden>
  <div class="identity-authenticated-heading">
    <div><p class="eyebrow">Authenticated</p><h2 id="identity-result-heading" data-identity-name>Identity</h2><p data-identity-email></p></div>
    <div class="identity-authenticated-state"><span class="badge badge-ok" data-identity-provider>Provider</span><strong data-identity-badges>Authenticated</strong><button type="button" data-identity-logout>Sign out</button></div>
  </div>
  <div class="identity-tabs" role="tablist" aria-label="Authentication result views">
    <button type="button" role="tab" aria-selected="true" aria-controls="identity-provider-panel" id="identity-provider-tab" data-identity-tab="provider">Provider payload</button>
    <button type="button" role="tab" aria-selected="false" aria-controls="identity-normalized-panel" id="identity-normalized-tab" tabindex="-1" data-identity-tab="normalized">Normalized identity</button>
    <button type="button" role="tab" aria-selected="false" aria-controls="identity-authorization-panel" id="identity-authorization-tab" tabindex="-1" data-identity-tab="authorization">Authorization</button>
    <button type="button" role="tab" aria-selected="false" aria-controls="identity-protocol-panel" id="identity-protocol-tab" tabindex="-1" data-identity-tab="protocol">Protocol</button>
  </div>
  <section class="panel identity-inspector-panel" role="tabpanel" aria-labelledby="identity-provider-tab" id="identity-provider-panel" data-identity-panel="provider">
    <div class="identity-inspector-heading"><div><p class="eyebrow">Received → validated</p><h3 data-payload-label>Validated provider payload</h3></div><span class="badge badge-ok">Sanitized</span></div>
    <div class="identity-validation-grid" data-validation-list></div>
    <pre data-provider-payload></pre>
  </section>
  <section class="panel identity-inspector-panel" role="tabpanel" aria-labelledby="identity-normalized-tab" id="identity-normalized-panel" data-identity-panel="normalized" hidden>
    <div class="identity-inspector-heading"><div><p class="eyebrow">Application contract</p><h3>Normalized identity</h3></div><span class="badge">Provider-neutral</span></div>
    <p class="subtle">Only fields legitimately derived from validated provider data cross this boundary.</p>
    <pre data-normalized-identity></pre>
  </section>
  <section class="panel identity-inspector-panel" role="tabpanel" aria-labelledby="identity-authorization-tab" id="identity-authorization-panel" data-identity-panel="authorization" hidden>
    <div class="identity-inspector-heading"><div><p class="eyebrow">Application authorization</p><h3>What can this identity do?</h3></div><span class="badge">Independent policy</span></div>
    <div class="identity-policy-subject"><strong data-policy-name>Authenticated identity</strong><span data-policy-context></span></div>
    <div class="identity-policy-actions" role="group" aria-label="Requested action"><button type="button" data-authorize="demo:read">Evaluate demo:read</button><button type="button" data-authorize="demo:write">Evaluate demo:write</button></div>
    <div class="identity-decision" data-authorization-result hidden><strong data-decision></strong><p data-decision-detail></p><small>demo:read → authenticated identity<br>demo:write → authenticated identity, visitor sandbox only<br>caller-selected namespaces → managed operator credential only</small></div>
  </section>
  <section class="panel identity-inspector-panel" role="tabpanel" aria-labelledby="identity-protocol-tab" id="identity-protocol-panel" data-identity-panel="protocol" hidden>
    <div class="identity-inspector-heading"><div><p class="eyebrow">Trust evidence</p><h3 data-protocol-name>Protocol</h3></div><span class="badge badge-ok">Validated</span></div>
    <ol class="identity-protocol-steps" data-protocol-steps></ol>
    <details data-assertion-details hidden><summary>View sanitized assertion XML</summary><pre data-sanitized-assertion></pre></details>
  </section>
</section>

<section class="identity-architecture" aria-labelledby="identity-architecture-heading">
  <div class="identity-section-heading"><div><p class="eyebrow">Trust boundary</p><h2 id="identity-architecture-heading">Many providers. One application identity.</h2></div></div>
  <div class="identity-architecture-map">
    <div class="identity-source-stack"><span>Microsoft <small>OIDC</small></span><span>Microsoft <small>SAML 2.0</small></span><span>Google <small>OIDC</small></span><span>GitHub <small>OAuth 2.0</small></span></div>
    <span class="identity-arrow" aria-hidden="true">→</span><strong>Protocol<br>validation</strong><span class="identity-arrow" aria-hidden="true">→</span><strong>Normalized<br>identity</strong><span class="identity-arrow" aria-hidden="true">→</span><strong>Authorization<br>policy</strong><span class="identity-arrow" aria-hidden="true">→</span><strong>WizardGang<br>session</strong>
  </div>
</section>

<section class="panel identity-federation" id="saml" aria-labelledby="identity-federation-heading">
  <div><p class="eyebrow">Enterprise federation</p><h2 id="identity-federation-heading">Microsoft Entra ID / SAML 2.0</h2><p>Authenticate through an Entra enterprise application. The Worker validates the signed assertion before any claim reaches application policy.</p><div class="identity-provider-meta"><span>Signed assertion</span><span>Audience</span><span>Time bounds</span><span>Replay protection</span><span data-config-status="saml">Checking configuration…</span></div></div>
  <div class="identity-provider-actions"><a class="button" href="/identity/saml" data-provider-action="saml">Try SAML authentication</a><a class="text-link" href="/identity/saml/metadata">View SP metadata ↗</a></div>
</section>

<details class="panel identity-implementation">
  <summary><span>Implementation details</span><span>Provider → validation → identity → policy → session</span></summary>
  <div class="identity-implementation-body"><div><p class="eyebrow">Security boundary</p><h2>No protocol secrets in the inspector</h2><p>Access tokens, authorization codes, PKCE verifiers, client secrets, signing keys, raw cookies, and unsanitized assertions are never returned to the browser or written to public logs.</p></div><nav class="reference-links" aria-label="Identity implementation sources">${sources.map(([label, path]) => `<a href="${escapeHtml(sourceUrl(env, path))}">${escapeHtml(label)}</a>`).join('')}</nav></div>
</details>

<script>
(() => {
  const notice = document.querySelector('[data-identity-notice]');
  const result = document.querySelector('[data-identity-result]');
  const providerLabels = { microsoft: 'Microsoft Entra ID', google: 'Google', github: 'GitHub' };
  const showNotice = (message, tone) => { notice.hidden = !message; notice.textContent = message || ''; notice.dataset.tone = tone || ''; };
  const params = new URLSearchParams(location.search);
  if (params.get('error') === 'provider_unconfigured') showNotice('That provider is not configured in this environment yet. The implementation is ready for environment-owned credentials.', 'warning');
  else if (params.get('error') === 'authentication_failed') showNotice('Authentication could not be validated. No application session was created.', 'error');
  else if (params.has('authenticated')) showNotice('Provider authentication validated. A short-lived WizardGang session is active.', 'success');
  if (params.has('error') || params.has('authenticated')) history.replaceState({}, '', '/interfaces?view=identity' + location.hash);

  const selectTab = (name) => {
    document.querySelectorAll('[data-identity-tab]').forEach((tab) => { const selected = tab.dataset.identityTab === name; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    document.querySelectorAll('[data-identity-panel]').forEach((panel) => { panel.hidden = panel.dataset.identityPanel !== name; });
  };
  const tabs = Array.from(document.querySelectorAll('[data-identity-tab]'));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.identityTab));
    tab.addEventListener('keydown', (event) => { if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return; event.preventDefault(); const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; selectTab(next.dataset.identityTab); next.focus(); });
  });

  const load = async () => {
    const response = await fetch('/identity/session', { headers: { accept: 'application/json' }, credentials: 'same-origin' });
    if (!response.ok) throw new Error('session unavailable');
    const body = await response.json();
    Object.entries(body.providers || {}).forEach(([key, provider]) => {
      document.querySelectorAll('[data-config-status="' + key + '"]').forEach((slot) => { slot.textContent = provider.configured ? 'Available' : 'Needs configuration'; slot.dataset.configured = String(provider.configured); });
    });
    if (!body.authenticated || !body.session) return;
    const session = body.session;
    const identity = session.identity;
    result.hidden = false;
    document.querySelector('[data-identity-name]').textContent = identity.displayName;
    document.querySelector('[data-identity-email]').textContent = identity.email || identity.username || identity.subject;
    document.querySelector('[data-identity-provider]').textContent = providerLabels[identity.provider] || identity.provider;
    document.querySelector('[data-identity-badges]').textContent = identity.protocol.toUpperCase() + ' · AUTHENTICATED · ' + identity.assurance.toUpperCase().replace('-', ' ');
    document.querySelector('[data-payload-label]').textContent = session.providerPayloadLabel;
    document.querySelector('[data-provider-payload]').textContent = JSON.stringify(session.providerPayload, null, 2);
    document.querySelector('[data-normalized-identity]').textContent = JSON.stringify(identity, null, 2);
    document.querySelector('[data-policy-name]').textContent = (providerLabels[identity.provider] || identity.provider) + ' · ' + identity.displayName;
    document.querySelector('[data-policy-context]').textContent = identity.role + ' · ' + identity.assurance;
    document.querySelector('[data-protocol-name]').textContent = session.protocol.name;
    const validation = document.querySelector('[data-validation-list]');
    session.validation.forEach((check) => { const item = document.createElement('div'); item.dataset.status = check.status; const name = document.createElement('strong'); name.textContent = check.label + (check.status === 'valid' ? ' ✓' : ' —'); const detail = document.createElement('span'); detail.textContent = check.detail; item.append(name, detail); validation.append(item); });
    const steps = document.querySelector('[data-protocol-steps]');
    session.protocol.steps.forEach((step) => { const item = document.createElement('li'); item.textContent = step; steps.append(item); });
    if (session.protocol.sanitizedAssertion) { const details = document.querySelector('[data-assertion-details]'); details.hidden = false; document.querySelector('[data-sanitized-assertion]').textContent = session.protocol.sanitizedAssertion; }
    result.scrollIntoView({ block: 'start', behavior: params.has('authenticated') && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  };
  load().catch(() => showNotice('The identity session service is temporarily unavailable.', 'error'));

  document.querySelectorAll('[data-authorize]').forEach((button) => button.addEventListener('click', async () => {
    const output = document.querySelector('[data-authorization-result]');
    const decision = document.querySelector('[data-decision]');
    const detail = document.querySelector('[data-decision-detail]');
    output.hidden = false; decision.textContent = 'EVALUATING'; output.dataset.decision = '';
    try {
      const response = await fetch('/__api/identity/authorize', { method: 'POST', credentials: 'same-origin', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ requestedAction: button.dataset.authorize }) });
      const body = await response.json();
      if (!body.authorization) throw new Error('No decision returned');
      const value = body.authorization.decision.toUpperCase(); decision.textContent = value; output.dataset.decision = value.toLowerCase(); detail.textContent = body.authorization.policy;
    } catch { decision.textContent = 'UNAVAILABLE'; output.dataset.decision = 'deny'; detail.textContent = 'The authorization decision could not be evaluated.'; }
  }));

  document.querySelector('[data-identity-logout]').addEventListener('click', async () => {
    const response = await fetch('/identity/logout', { method: 'POST', credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (response.ok) { result.hidden = true; showNotice('WizardGang application session ended.', 'success'); }
    else showNotice('The session could not be ended.', 'error');
  });
})();
</script>`, { activeRoute: '/interfaces', description: 'Authenticate with Microsoft Entra ID, Google, or GitHub and inspect the validated provider-to-application identity boundary.', cacheControl: 'no-store' });
}
