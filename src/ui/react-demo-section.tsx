import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { localizationForEnv } from '../i18n/runtime';
import type { Env } from '../types';
import { DEFAULT_DESCRIPTION } from './document';
import {
  type DemoSection,
  type DemoSectionOptions,
} from './demo-section';
import { DemoPresentationScope } from './demo-presentation-scope';

export interface ReactDemoSectionDefinition {
  readonly key: string;
  readonly title: string;
  readonly defaultPresentationPath: string;
  readonly browserModule: string;
  readonly browserMessages: Readonly<Record<string, string>>;
  readonly children: ReactNode;
}

export function createReactDemoSection(
  env: Env,
  definition: ReactDemoSectionDefinition,
  options: DemoSectionOptions = {},
): DemoSection {
  const localization = localizationForEnv(env);
  const scope = options.scope ?? definition.key;
  const idPrefix = options.idPrefix ?? scope;
  const presentationPath = options.presentationPath ?? definition.defaultPresentationPath;
  const canonicalPath = options.canonicalPath ?? presentationPath;

  return {
    scope,
    body: renderToStaticMarkup(<DemoPresentationScope
      name={scope}
      idPrefix={idPrefix}
      headingLevel={options.headingLevel ?? 2}
      browserModule={definition.browserModule}
      browserMessages={definition.browserMessages}
      browserLocale={localization.locale}
    >{definition.children}</DemoPresentationScope>),
    page: {
      title: localization.exact(definition.title),
      description: localization.exact(DEFAULT_DESCRIPTION),
      cacheControl: 'no-store',
      canonicalPath,
    },
  };
}
