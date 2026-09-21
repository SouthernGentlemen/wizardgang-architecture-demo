import { localeResources, localizationForEnv, type LocalizationContext } from '../i18n/runtime';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';
import { ReferenceDetails } from '../ui/reference-details';

function I18nPresentation({
  env,
  localization,
  count,
  presentationPath,
}: Readonly<{ env: Env; localization: LocalizationContext; count: number; presentationPath: string }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const locale = localization.locale;
  const selectedPluralKey = `items_${localization.pluralCategory(count)}`;
  const formattedItems = localization.t(selectedPluralKey).replace('{count}', localization.number(count));
  const fixedDate = new Date('2026-09-01T12:00:00Z');
  const resourceHref = sourceUrl(env, `src/i18n/locales/${locale}.json`);
  const resolvedResource = localeResources[locale] as Readonly<Record<string, string>>;
  const controlsTitle = scope.id('i18n-controls-title');
  const countId = scope.id('count');
  const cardTitle = scope.id('localized-card-title');
  const form = localization.getForm(presentationPath);
  const inspectTargets = [
    ['card.title', 'Title'],
    [selectedPluralKey, 'Items'],
    ['Intl.NumberFormat', 'Number'],
    ['Intl.DateTimeFormat', 'Date'],
    ['Intl.NumberFormat.currency', 'Currency'],
    ['card.action', 'Action'],
  ] as const;

  return <>
    <section className="page-header">
      <DemoHeading level={1}>{localization.t('demo.title')}</DemoHeading>
      <p>{localization.t('demo.summary')}</p>
      <p className="subtle">{exact('This page inspects the same request-scoped localization context used by the global shell. Changing language reloads the route so the document language, direction, navigation, controls, and this demonstration resolve together.')}</p>
      <div className="page-tools">
        <a className="text-link" href={sourceUrl(env, 'src/i18n/runtime.ts')}>{exact('Global runtime source')}</a>
        <ReferenceDetails links={[
          { label: localization.t('source'), href: sourceUrl(env, 'src/demos/i18n-presentation.tsx') },
          { label: localization.t('resource'), href: resourceHref },
          { label: 'Locale configuration', href: sourceUrl(env, 'config/i18n.json') },
        ]} />
      </div>
    </section>
    <section className="panel i18n-controls" aria-labelledby={controlsTitle}>
      <div className="lab-heading"><div><p className="eyebrow">{exact('Shared application capability')}</p><DemoHeading level={2} id={controlsTitle}>{localization.t('controls')}</DemoHeading></div><code data-direction="">{localization.dir}</code></div>
      <p>{exact('Use the language control in the global header to change the document language and direction. This control only changes the count used to demonstrate plural rules.')}</p>
      <form method="get" action={form.action} className="filters" data-i18n-form="">
        {form.fields.map((field) => <input key={field.name} type="hidden" name={field.name} value={field.value} />)}
        <label htmlFor={countId}><span>{localization.t('count')}</span><input id={countId} name="count" type="number" min={0} max={9999} defaultValue={count} /></label>{' '}
        <button type="submit">{localization.t('apply')}</button>
      </form>
    </section>
    <div className="lab-grid i18n-lab">
      <section className="panel locale-app" dir={localization.dir} aria-labelledby={cardTitle}>
        <p className="eyebrow">{localization.t('card.kicker')}</p>
        <DemoHeading level={2} id={cardTitle} data-inspect-value="card.title">{localization.t('card.title')}</DemoHeading>
        <p data-inspect-value="card.body">{localization.t('card.body')}</p>
        <p className="stat" data-inspect-value={selectedPluralKey}>{formattedItems}</p>
        <dl>
          <dt>{localization.t('format.number')}</dt><dd data-inspect-value="Intl.NumberFormat">{localization.number(1234567.89)}</dd>
          <dt>{localization.t('date')}</dt><dd data-inspect-value="Intl.DateTimeFormat">{localization.dateTime(fixedDate, { dateStyle: 'full', timeZone: 'UTC' })}</dd>
          <dt>{localization.t('currency')}</dt><dd data-inspect-value="Intl.NumberFormat.currency">{localization.currency(1234.56, 'USD')}</dd>
        </dl>
        <button className="button-primary" type="button" data-inspect-value="card.action">{localization.t('card.action')}</button>
      </section>
      <aside className="panel technical-state" aria-live="polite">
        <p className="eyebrow">{exact('Global context inspector')}</p>{' '}
        <DemoHeading level={2}>{localization.t('inspector.title')}</DemoHeading>{' '}
        <dl>
          <dt>locale</dt><dd><code>{locale}</code></dd>{' '}
          <dt>default</dt><dd><code>{localization.defaultLocale}</code></dd>{' '}
          <dt>fallback</dt><dd><code>{localization.fallbackLocale}</code></dd>{' '}
          <dt>direction</dt><dd><code>{localization.dir}</code></dd>{' '}
          <dt>plural category</dt><dd><code>{localization.pluralCategory(count)}</code></dd>
        </dl>{' '}
        <fieldset className="i18n-inspect-controls"><legend>{exact('Inspect a value')}</legend>{inspectTargets.map(([key, label]) => <button key={key} type="button" data-inspect-target={key}>{exact(label)}</button>)}</fieldset>{' '}
        <pre data-resource-excerpt="">{JSON.stringify({ [selectedPluralKey]: resolvedResource[selectedPluralKey] }, null, 2)}</pre>{' '}
        <a className="text-link" href={resourceHref}>{localization.t('resource')}</a>
      </aside>
    </div>
  </>;
}

export function i18nSection(request: Request, env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const url = new URL(request.url);
  const count = Math.max(0, Math.min(Number(url.searchParams.get('count') || '3') || 0, 9999));
  const defaultPresentationPath = `${routeUrl('demos.index')}#i18n`;
  const presentationPath = options.presentationPath ?? defaultPresentationPath;
  return createReactDemoSection(env, {
    key: 'i18n',
    title: localization.t('demo.title'),
    defaultPresentationPath,
    browserModule: routeUrl('operations.assets', { asset: browserAssetName('scripts.i18n') }),
    browserMessages: Object.freeze({}),
    children: <I18nPresentation env={env} localization={localization} count={count} presentationPath={presentationPath} />,
  }, options);
}
