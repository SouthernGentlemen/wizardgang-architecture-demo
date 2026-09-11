import { escapeHtml } from '../lib/html';
import type { PageContent } from './page';

export type DemoHeadingLevel = 1 | 2 | 3;

export interface DemoSectionOptions {
  /** Unique instance key used to isolate client behavior when sections share a document. */
  scope?: string;
  /** Prefix for DOM IDs. An empty string disables ID namespacing. */
  idPrefix?: string;
  /** Root heading level for the presentation. Reusable sections default to h2. */
  headingLevel?: DemoHeadingLevel;
  /** Canonical target for the page that ultimately owns this presentation. */
  canonicalPath?: string;
  /** Browser presentation target used by links/forms/history owned by the presentation. */
  presentationPath?: string;
}

export interface DemoSection {
  readonly scope: string;
  readonly body: string;
  readonly page: Omit<PageContent, 'body' | 'canonicalPath'> & { canonicalPath: string };
}

const TOKEN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const REFERENCE_ATTRIBUTES = [
  'for',
  'aria-controls',
  'aria-labelledby',
  'aria-describedby',
  'aria-owns',
  'aria-activedescendant',
  'headers',
  'list',
  'form',
  'data-copy-target',
] as const;

function requireToken(value: string, label: string, allowEmpty = false): string {
  if (allowEmpty && value === '') return value;
  if (!TOKEN.test(value)) throw new Error(`${label} must be a stable HTML token`);
  return value;
}

function namespaceIds(html: string, prefix: string): string {
  if (!prefix) return html;
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const mapping = new Map<string, string>();
  for (const id of ids) {
    if (!mapping.has(id)) mapping.set(id, `${prefix}-${id}`);
  }

  let namespaced = html;
  for (const [id, replacement] of mapping) {
    namespaced = namespaced.replaceAll(`id="${id}"`, `id="${replacement}"`);
  }

  const referencePattern = new RegExp(`(\\s)(${REFERENCE_ATTRIBUTES.join('|')})="([^"]+)"`, 'g');
  namespaced = namespaced.replace(referencePattern, (_match, whitespace: string, attribute: string, value: string) => {
    const rewritten = value
      .split(/\s+/)
      .map((token) => mapping.get(token) ?? token)
      .join(' ');
    return `${whitespace}${attribute}="${rewritten}"`;
  });

  for (const [id, replacement] of mapping) {
    namespaced = namespaced.replaceAll(`href="#${id}"`, `href="#${replacement}"`);
    namespaced = namespaced.replaceAll(`#${id}`, `#${replacement}`);
  }
  return namespaced;
}

function replacePresentationPath(html: string, currentPath: string, presentationPath: string): string {
  if (currentPath === presentationPath) return html;
  const escaped = currentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`${escaped}(?=$|["'?#\\s<])`, 'g'), presentationPath);
}

function shiftHeadings(html: string, headingLevel: DemoHeadingLevel): string {
  const delta = headingLevel - 1;
  if (!delta) return html;
  return html.replace(/<(\/?)h([1-6])(?=[\s>])/gi, (_match, closing: string, level: string) => {
    return `<${closing}h${Math.min(6, Number(level) + delta)}`;
  });
}

function scopeInlineScripts(html: string, scope: string): string {
  return html.replace(/(<script(?:\s[^>]*)?>)([\s\S]*?)<\/script>/gi, (whole, opening: string, source: string) => {
    if (/\bsrc\s*=/.test(opening)) return whole;
    return `${opening}
(() => {
  const sectionRoot = document.querySelector('[data-demo-section="${scope}"]');
  if (!sectionRoot) return;
  const pageDocument = document;
  const pageDocumentProperties = new Set(['activeElement', 'body', 'cookie', 'defaultView', 'documentElement', 'hidden', 'location', 'title', 'visibilityState']);
  const sectionDocument = new Proxy(sectionRoot, {
    get(target, property) {
      const owner = pageDocumentProperties.has(property) ? pageDocument : (property in target ? target : pageDocument);
      const value = owner[property];
      return typeof value === 'function' ? value.bind(owner) : value;
    },
  });
  ((document) => {
${source}
  })(sectionDocument);
})();
</script>`;
  });
}

export function createDemoSection(
  content: PageContent,
  demoKey: string,
  defaultPresentationPath: string,
  options: DemoSectionOptions = {},
): DemoSection {
  const scope = requireToken(options.scope ?? demoKey, 'Demo section scope');
  const idPrefix = requireToken(options.idPrefix ?? scope, 'Demo section ID prefix', true);
  const headingLevel = options.headingLevel ?? 2;
  const presentationPath = options.presentationPath ?? defaultPresentationPath;
  const canonicalPath = options.canonicalPath ?? presentationPath;

  let body = replacePresentationPath(content.body, defaultPresentationPath, presentationPath);
  body = namespaceIds(body, idPrefix);
  body = shiftHeadings(body, headingLevel);
  body = scopeInlineScripts(body, scope);

  const { body: _body, canonicalPath: _canonicalPath, ...page } = content;
  return {
    scope,
    body: `<div class="demo-presentation-section" data-demo-section="${escapeHtml(scope)}" style="display: contents">${body}</div>`,
    page: { ...page, canonicalPath },
  };
}
