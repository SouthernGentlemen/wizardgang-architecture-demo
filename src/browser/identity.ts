type ProviderKey = 'microsoft' | 'saml' | 'google' | 'github';

interface ProviderConfiguration {
  configured?: unknown;
}

interface Identity {
  provider: string;
  protocol: string;
  subject: string;
  email?: string;
  username?: string;
  displayName: string;
  assurance: string;
  role: string;
  [key: string]: unknown;
}

interface IdentitySession {
  identity: Identity;
  providerPayloadLabel: string;
  providerPayload: unknown;
  validation: Array<{ status: string; label: string; detail: string }>;
  protocol: { name: string; steps: string[]; sanitizedAssertion?: string };
}

interface SessionResponse {
  authenticated?: unknown;
  providers?: Partial<Record<ProviderKey, ProviderConfiguration>>;
  session?: IdentitySession;
}

interface AuthorizationResponse {
  authorization?: { decision: string; policy: string };
}

function parseConfig(root: HTMLElement): { messages?: Readonly<Record<string, string>> } {
  try {
    return JSON.parse(root.dataset.config ?? '{}') as { messages?: Readonly<Record<string, string>> };
  } catch {
    return {};
  }
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Identity presentation is missing ${selector}`);
  return element;
}

export async function mount(root: HTMLElement): Promise<void> {
  const messages = parseConfig(root).messages ?? {};
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const document = root.ownerDocument;
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });

  const notice = required<HTMLElement>(root, '[data-identity-notice]');
  const result = required<HTMLElement>(root, '[data-identity-result]');
  const providerLabels: Readonly<Record<string, string>> = {
    microsoft: message('microsoft', 'Microsoft Entra ID'),
    google: message('google', 'Google'),
    github: message('github', 'GitHub'),
  };
  const showNotice = (value: string, tone = '') => {
    notice.hidden = !value;
    notice.textContent = value;
    notice.dataset.tone = tone;
  };

  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === 'provider_unconfigured') {
    showNotice(message('providerUnconfigured', 'That provider is not configured in this environment yet. The implementation is ready for environment-owned credentials.'), 'warning');
  } else if (params.get('error') === 'authentication_failed') {
    showNotice(message('authFailed', 'Authentication could not be validated. No application session was created.'), 'error');
  } else if (params.has('authenticated')) {
    showNotice(message('authSuccess', 'Provider authentication validated. A short-lived WizardGang session is active.'), 'success');
  }
  if (params.has('error') || params.has('authenticated')) {
    const identityPageUrl = message('identityPageUrl', `${window.location.pathname}#identity`);
    window.history.replaceState({}, '', `${identityPageUrl}${window.location.hash}`);
  }

  const selectTab = (name: string) => {
    root.querySelectorAll<HTMLElement>('[data-identity-tab]').forEach((tab) => {
      const selected = tab.dataset.identityTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll<HTMLElement>('[data-identity-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.identityPanel !== name;
    });
  };
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-identity-tab]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.identityTab ?? ''), { signal: lifecycle.signal });
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next.dataset.identityTab ?? '');
      next.focus();
    }, { signal: lifecycle.signal });
  });

  const load = async () => {
    const response = await fetch('/auth/session', {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      signal: lifecycle.signal,
    });
    if (!response.ok) throw new Error('session unavailable');
    const body = await response.json() as SessionResponse;
    Object.entries(body.providers ?? {}).forEach(([key, provider]) => {
      root.querySelectorAll<HTMLElement>(`[data-config-status="${key}"]`).forEach((slot) => {
        slot.textContent = provider.configured
          ? message('availableSignIn', 'Available — Sign in')
          : message('notConfigured', 'Not configured in this environment');
        slot.dataset.configured = String(Boolean(provider.configured));
      });
      root.querySelectorAll<HTMLAnchorElement>(`[data-provider-action="${key}"]`).forEach((action) => {
        if (provider.configured) {
          const href = action.dataset.providerHref;
          if (href) action.href = href;
          action.setAttribute('aria-disabled', 'false');
        } else {
          action.removeAttribute('href');
          action.setAttribute('aria-disabled', 'true');
        }
      });
    });
    if (!body.authenticated || !body.session) return;

    const session = body.session;
    const identity = session.identity;
    result.hidden = false;
    required<HTMLElement>(root, '[data-identity-name]').textContent = identity.displayName;
    required<HTMLElement>(root, '[data-identity-email]').textContent = identity.email || identity.username || identity.subject;
    required<HTMLElement>(root, '[data-identity-provider]').textContent = providerLabels[identity.provider] || identity.provider;
    required<HTMLElement>(root, '[data-identity-badges]').textContent = `${identity.protocol.toUpperCase()} · ${message('authenticated', 'AUTHENTICATED')} · ${identity.assurance.toUpperCase().replace('-', ' ')}`;
    required<HTMLElement>(root, '[data-payload-label]').textContent = session.providerPayloadLabel;
    required<HTMLElement>(root, '[data-provider-payload]').textContent = JSON.stringify(session.providerPayload, null, 2);
    required<HTMLElement>(root, '[data-normalized-identity]').textContent = JSON.stringify(identity, null, 2);
    required<HTMLElement>(root, '[data-policy-name]').textContent = `${providerLabels[identity.provider] || identity.provider} · ${identity.displayName}`;
    required<HTMLElement>(root, '[data-policy-context]').textContent = `${identity.role} · ${identity.assurance}`;
    required<HTMLElement>(root, '[data-protocol-name]').textContent = session.protocol.name;

    const validation = required<HTMLElement>(root, '[data-validation-list]');
    validation.replaceChildren();
    for (const check of session.validation) {
      const item = document.createElement('div');
      item.dataset.status = check.status;
      const name = document.createElement('strong');
      name.textContent = `${check.label}${check.status === 'valid' ? ' ✓' : ' —'}`;
      const detail = document.createElement('span');
      detail.textContent = check.detail;
      item.append(name, detail);
      validation.append(item);
    }
    const steps = required<HTMLElement>(root, '[data-protocol-steps]');
    steps.replaceChildren();
    for (const step of session.protocol.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    if (session.protocol.sanitizedAssertion) {
      required<HTMLElement>(root, '[data-assertion-details]').hidden = false;
      required<HTMLElement>(root, '[data-sanitized-assertion]').textContent = session.protocol.sanitizedAssertion;
    }
    result.scrollIntoView({
      block: 'start',
      behavior: params.has('authenticated') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto',
    });
  };

  try {
    await load();
  } catch {
    if (!lifecycle.signal.aborted) {
      root.querySelectorAll<HTMLElement>('[data-config-status]').forEach((slot) => {
        slot.textContent = message('configurationFailed', 'Configuration check failed');
        delete slot.dataset.configured;
      });
      showNotice(message('identityUnavailable', 'The identity session service is temporarily unavailable.'), 'error');
    }
  }

  root.querySelectorAll<HTMLButtonElement>('[data-authorize]').forEach((button) => button.addEventListener('click', async () => {
    const output = required<HTMLElement>(root, '[data-authorization-result]');
    const decision = required<HTMLElement>(root, 'strong[data-decision]');
    const detail = required<HTMLElement>(root, '[data-decision-detail]');
    output.hidden = false;
    decision.textContent = message('evaluating', 'EVALUATING');
    output.dataset.decision = '';
    try {
      const response = await fetch('/auth/authorize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ requestedAction: button.dataset.authorize }),
        signal: lifecycle.signal,
      });
      const body = await response.json() as AuthorizationResponse;
      if (!body.authorization) throw new Error(message('noDecision', 'No decision returned'));
      const value = body.authorization.decision.toUpperCase();
      decision.textContent = value;
      output.dataset.decision = value.toLowerCase();
      detail.textContent = body.authorization.policy;
    } catch {
      if (lifecycle.signal.aborted) return;
      decision.textContent = message('unavailable', 'UNAVAILABLE');
      output.dataset.decision = 'deny';
      detail.textContent = message('decisionUnavailable', 'The authorization decision could not be evaluated.');
    }
  }, { signal: lifecycle.signal }));

  required<HTMLButtonElement>(root, '[data-identity-logout]').addEventListener('click', async () => {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
        signal: lifecycle.signal,
      });
      if (response.ok) {
        result.hidden = true;
        showNotice(message('signoutSuccess', 'WizardGang application session ended.'), 'success');
      } else {
        showNotice(message('signoutFailed', 'The session could not be ended.'), 'error');
      }
    } catch {
      if (!lifecycle.signal.aborted) showNotice(message('signoutFailed', 'The session could not be ended.'), 'error');
    }
  }, { signal: lifecycle.signal });
}
