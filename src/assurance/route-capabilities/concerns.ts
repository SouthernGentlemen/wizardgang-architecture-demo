import { defineAssuranceRouteCapability } from '../route-capability';

export const concernsRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.concerns',
  pattern: '/assurance/concerns',
  html: {
    handler: async (request, env) => {
      const [{ concernsContent }, { renderSharedReporting }, { renderPage }] = await Promise.all([
        import('../../demos/assurance-pages'),
        import('../../demos/assurance'),
        import('../../ui/page'),
      ]);
      const content = concernsContent(env);
      const reporting = await renderSharedReporting(request, env, 'concerns');
      return renderPage(env, { ...content, routeId: 'assurance.concerns', body: `${content.body}\n${reporting}` });
    },
    source: {
      module: 'src/demos/assurance-pages.ts',
      exportName: 'concernsContent',
      tests: ['tests/assurance-consolidation.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Concerns',
      summary: 'Structured public intake for non-sensitive bugs, features, accessibility, AI/MCP, and governance concerns.',
      order: 6,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});
