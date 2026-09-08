import { defineAssuranceRouteCapability } from '../route-capability';

export const deliveryRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.delivery',
  pattern: '/assurance/delivery',
  html: {
    handler: async (request, env) => {
      const [{ gitContent }, { renderSharedReporting }, { renderPage }] = await Promise.all([
        import('../../demos/git-page'),
        import('../../demos/assurance'),
        import('../../ui/page'),
      ]);
      const content = gitContent(env);
      const reporting = await renderSharedReporting(request, env, 'delivery');
      return renderPage(env, { ...content, routeId: 'assurance.delivery', body: `${content.body}\n${reporting}` });
    },
    source: {
      module: 'src/demos/git-page.ts',
      exportName: 'gitContent',
      tests: ['tests/assurance-consolidation.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Delivery',
      summary: 'Git delivery workflow, validation evidence, and release traceability.',
      order: 0,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});
