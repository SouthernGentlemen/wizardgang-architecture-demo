import { defineAssuranceRouteCapability } from '../route-capability';

export const complianceRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.compliance',
  pattern: '/assurance/compliance',
  html: {
    handler: async (request, env) => {
      const [{ complianceContent }, { renderPage }] = await Promise.all([
        import('../../demos/compliance-page'),
        import('../../ui/page'),
      ]);
      const content = complianceContent(request, env);
      return renderPage(env, { ...content, routeId: 'assurance.compliance' });
    },
    source: {
      module: 'src/demos/compliance-page.ts',
      exportName: 'complianceContent',
      tests: ['tests/assurance-consolidation.test.ts', 'tests/route-contract.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Compliance',
      summary: 'Filterable WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 engineering-evidence mappings.',
      order: 3,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});
