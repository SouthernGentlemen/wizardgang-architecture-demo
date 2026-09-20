interface LegacyBodyProps {
  html: string;
}

/**
 * Temporary audited boundary for page bodies that have not moved to React yet.
 * DEMO-333 removes this component after the remaining full-page presentations move.
 */
export function LegacyBody({ html }: LegacyBodyProps) {
  return <main className="site-main" id="main" dangerouslySetInnerHTML={{ __html: html }} />;
}
