interface ShellMessages {
  theme: string;
}

function shellMessages(): ShellMessages | undefined {
  const script = document.querySelector<HTMLScriptElement>('script[data-shell-browser]');
  const serialized = script?.dataset.messages;
  if (!serialized) return undefined;
  try {
    return JSON.parse(serialized) as ShellMessages;
  } catch {
    return undefined;
  }
}

function enhanceThemeToggle(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button) return;
  const root = document.documentElement;
  const messages = shellMessages();
  if (messages?.theme) {
    button.setAttribute('aria-label', messages.theme);
    button.textContent = messages.theme;
  }
  const synchronize = () => {
    const isLight = root.dataset.theme === 'light';
    button.setAttribute('aria-pressed', String(!isLight));
  };
  synchronize();
  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('wg-theme', next);
    } catch {
      // A denied storage write must not prevent the in-page theme change.
    }
    synchronize();
  });
}

function enhanceLanguageSelector(): void {
  const form = document.querySelector<HTMLFormElement>('form[data-preserve-fragment]');
  const select = form?.querySelector<HTMLSelectElement>('select[name="lang"]');
  if (!form || !select) return;
  form.addEventListener('submit', () => {
    form.action = `${location.pathname}${location.hash}`;
  });
  select.addEventListener('change', () => form.requestSubmit());
}

enhanceThemeToggle();
enhanceLanguageSelector();
