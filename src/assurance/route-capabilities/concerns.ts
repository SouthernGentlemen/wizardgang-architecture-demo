import { defineAssuranceRouteCapability } from '../route-capability';

export const concernsRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.concerns',
  pattern: '/assurance/concerns',
  html: {
    handler: async (_request, env) => {
      const [{ concernsContent }, { renderPage }] = await Promise.all([
        import('../../demos/concerns-page'),
        import('../../ui/page'),
      ]);
      const content = concernsContent(env);
      return renderPage(env, { ...content, routeId: 'assurance.concerns' });
    },
    source: {
      module: 'src/demos/concerns-page.ts',
      exportName: 'concernsContent',
      tests: ['tests/concerns-page.test.ts', 'tests/security-intake.test.ts'],
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