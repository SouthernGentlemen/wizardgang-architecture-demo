import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findCanonicalPageLiteral } from '../scripts/lint-rules.mjs';

describe('repository lint rules', () => {
  it('reports the canonical-page-literal failure for the fixture', () => {
    const fixture = fs.readFileSync('tests/fixtures/lint/canonical-page-literal.ts.txt', 'utf8');
    const file = 'src/lint-fixtures/canonical-page-literal.ts';

    expect(findCanonicalPageLiteral(file, fixture)).toBe(
      `${file}:2 canonical pathname literal outside a route declaration; use routeUrl(routeId) or move deliberate dead-route data under tests/fixtures/; rerun: npm run lint`,
    );
  });
});
