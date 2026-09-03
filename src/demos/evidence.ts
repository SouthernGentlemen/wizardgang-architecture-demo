import type { DemoDefinition } from '../types';
import { assuranceCollectionApiRoute, assuranceHtmlRoute, assuranceRegistryApiRoute } from '../assurance/routes';

const demo: DemoDefinition = {
  id: 'evidence',
  route: assuranceHtmlRoute('evidence'),
  title: 'Assurance Evidence',
  group: 'Delivery & Governance',
  sourcePath: 'src/demos/evidence.ts',
  summary: 'Search the public assurance evidence registry, inspect reverse usage, and follow repository evidence to the exact deployed source revision.',
  notice: 'Evidence is disclosure-safe engineering assurance. Freshness is explicit and no certification is claimed.',
  proves: [
    'Canonical assurance JSON stores stable IDs and locators while counts, URLs, and reverse usedBy relationships are derived',
    'Repository evidence resolves against the exact deployed commit instead of a moving branch',
    'Release-bound, event-driven, and observation-bound evidence expose distinct freshness semantics',
    'The human route and public assurance APIs consume the same derived evidence projection',
  ],
  status: 'working',
  supportingSources: [
    { label: 'View assurance registry', path: 'assurance/registry.json' },
    { label: 'View evidence dataset', path: 'assurance/evidence/evidence.json' },
    { label: 'View assurance guide', path: 'docs/ASSURANCE.md' },
    { label: 'View assurance validation', path: 'scripts/validate-assurance-projection.mjs' },
  ],
  interfaces: [
    { method: 'GET', path: assuranceRegistryApiRoute(), description: 'Derived public assurance registry with exact-deployment evidence resolution.' },
    { method: 'GET', path: assuranceCollectionApiRoute('evidence'), description: 'Derived public evidence records with usedBy and freshness semantics.' },
  ],
};

export default demo;
