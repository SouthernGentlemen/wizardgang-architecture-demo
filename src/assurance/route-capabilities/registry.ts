import { defineAssuranceRouteCapability } from '../route-capability';

export const assuranceRegistryRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.index',
  pattern: '/assurance',
  html: {
    handler: async (request, env) => {
      const [{ assuranceIndexContent, renderSharedReporting }, { renderPage }] = await Promise.all([
        import('../../demos/assurance'),
        import('../../ui/page'),
      ]);
      const content = assuranceIndexContent(env);
      const reporting = await renderSharedReporting(request, env, 'index');
      return renderPage(env, {
        ...content,
        routeId: 'assurance.index',
        body: `${content.body}\n${reporting}`,
      });
    },
    source: {
      module: 'src/demos/assurance.ts',
      exportName: 'assuranceIndexContent',
      tests: ['tests/assurance-consolidation.test.ts', 'tests/router.test.ts'],
    },
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Assurance',
      summary: 'Public assurance index for delivery evidence, governance, compliance, risks, incidents, concerns, and evidence records.',
      order: 3,
      navigation: 'primary',
      architectureMap: true,
    },
  },
});
