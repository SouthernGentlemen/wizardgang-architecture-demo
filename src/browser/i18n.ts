export function mount(root: HTMLElement): void {
  const output = root.querySelector<HTMLElement>('[data-resource-excerpt]');
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });
  root.querySelectorAll<HTMLButtonElement>('[data-inspect-target]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!output) return;
      const key = button.dataset.inspectTarget;
      const node = [...root.querySelectorAll<HTMLElement>('[data-inspect-value]')]
        .find((candidate) => candidate.dataset.inspectValue === key);
      output.textContent = JSON.stringify({ key, value: node?.textContent || '' }, null, 2);
    }, { signal: lifecycle.signal });
  });
}
