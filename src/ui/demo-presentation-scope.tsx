import {
  createContext,
  createElement,
  useContext,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import type { DemoHeadingLevel } from './demo-section';

const TOKEN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const REFERENCE_PROPERTIES = new Set([
  'htmlFor',
  'aria-controls',
  'aria-labelledby',
  'aria-describedby',
  'aria-owns',
  'aria-activedescendant',
  'headers',
  'list',
  'form',
  'data-copy-target',
]);

export interface DemoPresentationScopeValue {
  readonly name: string;
  readonly headingLevel: DemoHeadingLevel;
  id(localId: string): string;
  references(localIds: string): string;
  fragment(localId: string): string;
  attributes<T extends Record<string, unknown>>(attributes: T): T;
  heading(localLevel: DemoHeadingLevel): DemoHeadingLevel;
}

const ScopeContext = createContext<DemoPresentationScopeValue | null>(null);

function requireToken(value: string, label: string): string {
  if (!TOKEN.test(value)) throw new Error(`${label} must be a stable HTML token`);
  return value;
}

export function createDemoPresentationScope(name: string, headingLevel: DemoHeadingLevel = 2): DemoPresentationScopeValue {
  const prefix = requireToken(name, 'Demo presentation scope');
  const id = (localId: string) => `${prefix}-${requireToken(localId, 'Demo presentation ID')}`;
  const references = (localIds: string) => localIds
    .split(/\s+/)
    .filter(Boolean)
    .map(id)
    .join(' ');
  const attributeReferences = (localIds: string) => localIds
    .split(/\s+/)
    .filter(Boolean)
    .map((localId) => localId.startsWith('#') ? `#${id(localId.slice(1))}` : id(localId))
    .join(' ');
  const attributes = <T extends Record<string, unknown>>(input: T): T => {
    const output: Record<string, unknown> = { ...input };
    if (typeof output.id === 'string') output.id = id(output.id);
    for (const property of REFERENCE_PROPERTIES) {
      if (typeof output[property] === 'string') output[property] = attributeReferences(output[property] as string);
    }
    if (typeof output.href === 'string' && output.href.startsWith('#')) output.href = `#${id(output.href.slice(1))}`;
    return output as T;
  };
  const heading = (localLevel: DemoHeadingLevel): DemoHeadingLevel => (
    Math.min(6, headingLevel + localLevel - 1) as DemoHeadingLevel
  );
  return Object.freeze({
    name: prefix,
    headingLevel,
    id,
    references,
    fragment: (localId: string) => `#${id(localId)}`,
    attributes,
    heading,
  });
}

export function useDemoPresentationScope(): DemoPresentationScopeValue {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error('Demo presentation component rendered outside DemoPresentationScope.');
  return scope;
}

export function DemoPresentationScope({
  name,
  idPrefix = name,
  headingLevel = 2,
  browserModule,
  browserMessages,
  browserLocale,
  children,
}: Readonly<{
  name: string;
  idPrefix?: string;
  headingLevel?: DemoHeadingLevel;
  browserModule?: string;
  browserMessages?: Readonly<Record<string, string>>;
  browserLocale?: string;
  children: ReactNode;
}>) {
  const scope = createDemoPresentationScope(idPrefix, headingLevel);
  return <ScopeContext value={scope}>
    <div
      className="demo-presentation-section"
      data-demo-section={name}
      data-demo-browser-module={browserModule}
      data-config={browserMessages ? JSON.stringify({ locale: browserLocale, messages: browserMessages }) : undefined}
      style={{ display: 'contents' }}
    >{children}</div>
  </ScopeContext>;
}

export function DemoHeading({
  level,
  children,
  ...attributes
}: Readonly<HTMLAttributes<HTMLHeadingElement> & { level: DemoHeadingLevel }>) {
  const scope = useDemoPresentationScope();
  return createElement(`h${scope.heading(level)}`, attributes, children);
}
