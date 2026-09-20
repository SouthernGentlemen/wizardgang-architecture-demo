interface AdminMessages {
  emptyMessage: string;
  confirm: string;
}

function adminMessages(): AdminMessages | undefined {
  const script = document.querySelector<HTMLScriptElement>('script[data-admin-browser]');
  const serialized = script?.dataset.messages;
  if (!serialized) return undefined;
  try {
    return JSON.parse(serialized) as AdminMessages;
  } catch {
    return undefined;
  }
}

function enhanceOfflineMessagePreview(messages: AdminMessages | undefined): void {
  const message = document.querySelector<HTMLTextAreaElement>('#message');
  const preview = document.querySelector<HTMLElement>('[data-offline-message-preview]');
  if (!message || !preview) return;
  message.addEventListener('input', () => {
    preview.textContent = message.value || messages?.emptyMessage || 'No public message supplied.';
  });
}

function enhanceChangeConfirmations(messages: AdminMessages | undefined): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-confirm-change]')) {
    button.addEventListener('click', (event) => {
      if (!window.confirm(button.dataset.confirmChange || messages?.confirm || 'Continue?')) event.preventDefault();
    });
  }
}

const messages = adminMessages();
enhanceOfflineMessagePreview(messages);
enhanceChangeConfirmations(messages);
