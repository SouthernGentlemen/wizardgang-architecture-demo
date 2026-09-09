import { defineAssuranceRouteCapability } from '../route-capability';

export const governanceRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.governance',
  pattern: '/assurance/governance',
  html: {
    handler: async (request, env) => {
      const [{ governanceContent }, { renderPage }] = await Promise.all([
        import('../../demos/governance'),
        import('../../ui/page'),
      ]);
      const content = await governanceContent(request, env, []);
      return renderPage(env, { ...content, routeId: 'assurance.governance' });
    },
    source: {
      module: 'src/demos/governance.ts',
      exportName: 'governanceContent',
      tests: ['tests/assurance-consolidation.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Governance',
      summary: 'Governance records, control mappings, AI boundary evaluation, and traceability.',
      order: 1,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});
