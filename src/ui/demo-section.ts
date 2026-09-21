import type { ReactPageContent } from './document';

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
  readonly page: Omit<ReactPageContent, 'body' | 'canonicalPath'> & { canonicalPath: string };
}
