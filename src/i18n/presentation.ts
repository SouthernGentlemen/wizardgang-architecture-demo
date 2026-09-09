import catalog from './presentation.json';
import { escapeHtml } from '../lib/html';
import { localeQueryParameter, type LocalizationContext, type SupportedLocale } from './runtime';

interface LocalizedPresentation {
  title: string;
  description: string;
  body: string;
}

type CatalogEntry = Readonly<Record<SupportedLocale, string>>;
type Catalog = Readonly<Record<string, CatalogEntry>>;

const messages = catalog as Catalog;
const exactEnglish = new Map<string, string>(Object.entries(messages).map(([key, value]) => [value.en, key]));
const clientEntries = Object.entries(messages).filter(([key]) => key.startsWith('client.'));
const MACHINE_PATH_PREFIXES = ['/api/', '/auth/', '/graphql', '/mcp', '/webhooks', '/assets/', '/.well-known/', '/robots', '/sitemap'];
const TECHNICAL_BLOCK = /<(pre|code|samp|kbd|bdi)\b[^>]*>[\s\S]*?<\/\1>/gi;
const SCRIPT_BLOCK = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const HUMAN_ATTRIBUTE = /\b(aria-label|aria-description|title|placeholder|alt)=("([^"]*)"|'([^']*)')/gi;

function surroundingWhitespace(value: string, localized: string): string {
  const lead = value.match(/^\s*/)?.[0] ?? '';
  const tail = value.match(/\s*$/)?.[0] ?? '';
  return `${lead}${localized}${tail}`;
}
function localizedNumber(localization: LocalizationContext, value: string): string {
  const numeric = Number(value.replaceAll(',', ''));
  if (!Number.isFinite(numeric)) return value;
  const decimals = value.includes('.') ? value.split('.')[1]?.length ?? 0 : 0;
  return localization.number(numeric, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function localizeDynamicText(value: string, localization: LocalizationContext): string {
  const trimmed = value.trim();
  const relative = trimmed.match(/^(\d+)(s|m|h|d) ago$/);
  if (relative) {
    const unit = relative[2] === 's' ? 'second' : relative[2] === 'm' ? 'minute' : relative[2] === 'h' ? 'hour' : 'day';
    return surroundingWhitespace(value, new Intl.RelativeTimeFormat(localization.locale, { numeric: 'always' }).format(-Number(relative[1]), unit));
  }
  const recordsOnPage = trimmed.match(/^(\d+) records? on this page$/);
  if (recordsOnPage) {
    const count = Number(recordsOnPage[1]);
    return surroundingWhitespace(value, localization.t(count === 1 ? 'reporting.record_one' : 'reporting.record_other', trimmed, { count: localization.number(count) }));
  }
  const shown = trimmed.match(/^(\d+) records shown · (\d+) available in the authorized selection\.$/);
  if (shown) return surroundingWhitespace(value, localization.t('reporting.shown', trimmed, { count: localization.number(Number(shown[1])), total: localization.number(Number(shown[2])) }));
  const showing = trimmed.match(/^Showing (\d+) of (\d+)$/);
  if (showing) return surroundingWhitespace(value, localization.t('reporting.showing', trimmed, { count: localization.number(Number(showing[1])), total: localization.number(Number(showing[2])) }));
  const relationships = trimmed.match(/^(\d+) authorized relationships?$/);
  if (relationships) {
    const count = Number(relationships[1]);
    return surroundingWhitespace(value, localization.t(count === 1 ? 'reporting.relationship_one' : 'reporting.relationship_other', trimmed, { count: localization.number(count) }));
  }
  let localized = value.replace(/(?<![\w./-])\d+(?:,\d{3})*(?:\.\d+)?%(?![\w.-])/g, (match: string) => {
    const number = match.slice(0, -1);
    const numeric = Number(number.replaceAll(',', '')) / 100;
    const decimals = number.includes('.') ? number.split('.')[1]?.length ?? 0 : 0;
    return localization.number(numeric, { style: 'percent', maximumFractionDigits: decimals });
  });
  localized = localized.replace(/\$\d+(?:,\d{3})*(?:\.\d+)?/g, (match: string) => localization.currency(Number(match.slice(1).replaceAll(',', ''))));
  localized = localized.replace(/(?<![\w./-])(\d+(?:,\d{3})*(?:\.\d+)?)(?![\w./-])/g, (match) => localizedNumber(localization, match));
  return localized;
}
function localizeText(value: string, localization: LocalizationContext): string {
  if (localization.locale === 'en') return value;
  const trimmed = value.trim();
  const key = exactEnglish.get(trimmed);
  if (key) return surroundingWhitespace(value, localization.t(key, trimmed));
  return localizeDynamicText(value, localization);
}
function localizeAttributes(tag: string, localization: LocalizationContext): string {
  return tag.replace(HUMAN_ATTRIBUTE, (match, name: string, quoted: string, doubleValue: string, singleValue: string) => {
    const value = doubleValue ?? singleValue ?? '';
    const translated = localizeText(value, localization);
    if (translated === value) return match;
    const quote = quoted[0];
    return `${name}=${quote}${translated.replaceAll(quote, quote === '"' ? '&quot;' : '&#39;')}${quote}`;
  });
}
function localizeClientScript(script: string, localization: LocalizationContext): string {
  if (localization.locale === 'en') return script;
  let localized = script;
  for (const [key, entry] of clientEntries) {
    const translated = localization.t(key, entry.en);
    localized = localized.replaceAll(JSON.stringify(entry.en), JSON.stringify(translated));
    if (!entry.en.includes("'") && !entry.en.includes('\\')) localized = localized.replaceAll(`'${entry.en}'`, `'${translated.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`);
  }
  return localized;
}
function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&(?:amp|#0*38|#x0*26);/gi, '&')
    .replace(/&(?:quot|#0*34|#x0*22);/gi, '"')
    .replace(/&(?:apos|#0*39|#x0*27);/gi, "'");
}
function humanInternalHref(href: string, localization: LocalizationContext): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  let url: URL;
  try { url = new URL(href, localization.currentUrl); } catch { return false; }
  if (url.origin !== localization.currentUrl.origin) return false;
  if (MACHINE_PATH_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix))) return false;
  if (/\.(?:json|ya?ml|xml|txt|csv|svg|png|jpg|webp)$/i.test(url.pathname)) return false;
  return true;
}
function hasExplicitLocale(href: string, localization: LocalizationContext): boolean {
  try {
    return new URL(href, localization.currentUrl).searchParams.has(localeQueryParameter());
  } catch {
    return false;
  }
}
function localizeLinks(body: string, localization: LocalizationContext): string {
  if (localization.locale === localization.defaultLocale) return body;
  return body.replace(/<a\b([^>]*?)\bhref=("([^"]*)"|'([^']*)')([^>]*)>/gi, (match, before: string, quoted: string, doubleHref: string, singleHref: string, after: string) => {
    const href = decodeHtmlAttribute(doubleHref ?? singleHref ?? '');
    if (!humanInternalHref(href, localization) || hasExplicitLocale(href, localization)) return match;
    const quote = quoted[0];
    return `<a${before}href=${quote}${escapeHtml(localization.href(href))}${quote}${after}>`;
  });
}
function preserveLocaleInGetForms(body: string, localization: LocalizationContext): string {
  if (localization.locale === localization.defaultLocale) return body;
  const parameter = localeQueryParameter();
  return body.replace(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi, (match, attributes: string, contents: string) => {
    if (!/\bmethod\s*=\s*(["'])?get\1?/i.test(attributes)) return match;
    if (new RegExp(`\\bname\\s*=\\s*(["'])${parameter}\\1`, 'i').test(contents)) return match;
    return `<form${attributes}><input type="hidden" name="${parameter}" value="${localization.locale}">${contents}</form>`;
  });
}
function localizeBody(body: string, localization: LocalizationContext): string {
  const protectedBlocks: string[] = [];
  const protect = (value: string) => `@@WG_I18N_BLOCK_${protectedBlocks.push(value) - 1}@@`;
  let localized = body.replace(TECHNICAL_BLOCK, protect);
  localized = localized.replace(SCRIPT_BLOCK, (script) => protect(localizeClientScript(script, localization)));
  localized = localized.split(/(<[^>]+>)/g).map((part) => part.startsWith('<') ? localizeAttributes(part, localization) : localizeText(part, localization)).join('');
  localized = localizeLinks(localized, localization);
  localized = preserveLocaleInGetForms(localized, localization);
  return localized.replace(/@@WG_I18N_BLOCK_(\d+)@@/g, (_match, rawIndex: string) => protectedBlocks[Number(rawIndex)] ?? '');
}
export function localizePresentation(title: string, description: string, body: string, localization: LocalizationContext): LocalizedPresentation {
  return { title: localizeText(title, localization), description: localizeText(description, localization), body: localizeBody(body, localization) };
}
export function presentationCatalog(): Catalog { return messages; }
