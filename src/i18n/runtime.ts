import config from '../../config/i18n.json';
import type { Env } from '../types';
import ar from './locales/ar.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';

export const localeResources = Object.freeze({ en, es, fr, de, ja, ar });
export type SupportedLocale = keyof typeof localeResources;

export const localeNames: Readonly<Record<SupportedLocale, string>> = Object.freeze({
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ar: 'العربية',
});

const LOCALE_QUERY_PARAMETER = 'lang';
const LOCALE_COOKIE = 'wg-lang';
const DEFAULT_ORIGIN = 'https://demo.wizardgang.ai';
const LOCALIZATION_CONTEXT = Symbol.for('wizardgang.localization-context');

type MessageMap = Readonly<Record<string, string>>;
type TemplateValues = Readonly<Record<string, string | number>>;
type LocalizedEnv = Env & { [LOCALIZATION_CONTEXT]?: LocalizationContext };

function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return Boolean(value && Object.hasOwn(localeResources, value));
}

function configuredLocale(value: string, fallback: SupportedLocale): SupportedLocale {
  return isSupportedLocale(value) ? value : fallback;
}

export const defaultLocale = configuredLocale(config.defaultLocale, 'en');
export const fallbackLocale = configuredLocale(config.fallbackLocale, defaultLocale);
export const supportedLocales = Object.freeze(
  config.supportedLocales.filter(isSupportedLocale),
) as readonly SupportedLocale[];
const rtlLocales = new Set(config.rtlLocales.filter(isSupportedLocale));

function template(message: string, values: TemplateValues = {}): string {
  return message.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

function internalUrl(href: string, base: URL): URL | null {
  if (!href || href.startsWith('#')) return null;
  try {
    const url = new URL(href, base);
    return url.origin === base.origin ? url : null;
  } catch {
    return null;
  }
}

function cookieLocale(request: Request): SupportedLocale | undefined {
  const cookie = request.headers.get('cookie');
  if (!cookie) return undefined;
  for (const item of cookie.split(';')) {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (rawName !== LOCALE_COOKIE) continue;
    try {
      const value = decodeURIComponent(rawValue.join('='));
      return isSupportedLocale(value) ? value : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export interface LocalizationContext {
  locale: SupportedLocale;
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  lang: SupportedLocale;
  dir: 'ltr' | 'rtl';
  currentUrl: URL;
  t(key: string, fallback?: string, values?: TemplateValues): string;
  pluralCategory(count: number): Intl.LDMLPluralRule;
  plural(keyPrefix: string, count: number, values?: TemplateValues): string;
  number(value: number, options?: Intl.NumberFormatOptions): string;
  dateTime(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  currency(value: number, currency?: string, options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>): string;
  list(values: readonly string[], options?: Intl.ListFormatOptions): string;
  href(href: string, locale?: SupportedLocale): string;
}

function createLocalization(locale: SupportedLocale, currentUrl: URL): LocalizationContext {
  const selected = localeResources[locale] as MessageMap;
  const fallback = localeResources[fallbackLocale] as MessageMap;
  const t: LocalizationContext['t'] = (key, fallbackText = key, values = {}) => {
    const raw = selected[key] ?? fallback[key] ?? fallbackText;
    return template(raw, values);
  };

  const context: LocalizationContext = {
    locale,
    defaultLocale,
    fallbackLocale,
    lang: locale,
    dir: rtlLocales.has(locale) ? 'rtl' : 'ltr',
    currentUrl: new URL(currentUrl.toString()),
    t,
    pluralCategory: (count: number) => new Intl.PluralRules(locale).select(count),
    plural: (keyPrefix: string, count: number, values: TemplateValues = {}) => {
      const category = new Intl.PluralRules(locale).select(count);
      return t(`${keyPrefix}_${category}`, `${keyPrefix}_${category}`, { count, ...values });
    },
    number: (value: number, options: Intl.NumberFormatOptions = {}) => new Intl.NumberFormat(locale, options).format(value),
    dateTime: (value: Date | number, options: Intl.DateTimeFormatOptions = {}) => new Intl.DateTimeFormat(locale, options).format(value),
    currency: (
      value: number,
      currency: string = 'USD',
      options: Omit<Intl.NumberFormatOptions, 'style' | 'currency'> = {},
    ) => new Intl.NumberFormat(locale, {
      ...options,
      style: 'currency',
      currency,
    }).format(value),
    list: (values: readonly string[], options: Intl.ListFormatOptions = {}) => new Intl.ListFormat(locale, options).format(values),
    href: (href: string, targetLocale: SupportedLocale = locale) => {
      const resolved = internalUrl(href, currentUrl);
      if (!resolved) return href;
      if (targetLocale === defaultLocale) resolved.searchParams.delete(LOCALE_QUERY_PARAMETER);
      else resolved.searchParams.set(LOCALE_QUERY_PARAMETER, targetLocale);
      return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    },
  };
  return Object.freeze(context);
}

export function resolveLocalization(request: Request): LocalizationContext {
  const url = new URL(request.url);
  const requested = url.searchParams.get(LOCALE_QUERY_PARAMETER);
  const locale = requested === null
    ? (cookieLocale(request) ?? defaultLocale)
    : (isSupportedLocale(requested) ? requested : defaultLocale);
  return createLocalization(locale, url);
}

export function localeNormalizationRedirect(request: Request): string | null {
  if (request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (!url.searchParams.has(LOCALE_QUERY_PARAMETER)) return null;
  const requested = url.searchParams.get(LOCALE_QUERY_PARAMETER);
  if (isSupportedLocale(requested) && requested !== defaultLocale) return null;
  url.searchParams.delete(LOCALE_QUERY_PARAMETER);
  return url.toString();
}

export function shouldPersistLocale(request: Request): boolean {
  return request.method === 'GET' && new URL(request.url).searchParams.has(LOCALE_QUERY_PARAMETER);
}

export function localePreferenceCookie(localization: LocalizationContext): string {
  return `${LOCALE_COOKIE}=${encodeURIComponent(localization.locale)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}

export function bindLocalization(env: Env, localization: LocalizationContext): Env {
  const scoped = Object.create(env) as LocalizedEnv;
  Object.defineProperty(scoped, LOCALIZATION_CONTEXT, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: localization,
  });
  return scoped;
}

export function localizationForEnv(env: Env): LocalizationContext {
  return (env as LocalizedEnv)[LOCALIZATION_CONTEXT]
    ?? createLocalization(defaultLocale, new URL(`${DEFAULT_ORIGIN}/`));
}

export function localeQueryParameter(): string {
  return LOCALE_QUERY_PARAMETER;
}
