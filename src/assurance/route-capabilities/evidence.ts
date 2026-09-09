import { defineAssuranceRouteCapability } from '../route-capability';

export const evidenceRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.evidence',
  pattern: '/assurance/evidence',
  html: {
    handler: async (request, env) => {
      const [{ evidenceContent }, { renderPage }] = await Promise.all([
        import('../../demos/evidence-page'),
        import('../../ui/page'),
      ]);
      const content = evidenceContent(request, env);
      return renderPage(env, { ...content, routeId: 'assurance.evidence' });
    },
    source: {
      module: 'src/demos/evidence-page.ts',
      exportName: 'evidenceContent',
      tests: ['tests/assurance-consolidation.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Evidence',
      summary: 'Searchable public evidence with provenance, freshness, lifecycle state, and stable fragments.',
      order: 2,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});
