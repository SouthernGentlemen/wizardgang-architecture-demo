import { defineAssuranceRouteCapability } from '../route-capability';

export const risksRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.risks',
  pattern: '/assurance/risks',
  html: {
    handler: async (request, env) => {
      const [{ risksContent }, { renderSharedReporting }, { renderPage }] = await Promise.all([
        import('../../demos/assurance-pages'),
        import('../../demos/assurance'),
        import('../../ui/page'),
      ]);
      const content = risksContent(request, env);
      const reporting = await renderSharedReporting(request, env, 'risks');
      return renderPage(env, { ...content, routeId: 'assurance.risks', body: `${content.body}\n${reporting}` });
    },
    source: {
      module: 'src/demos/assurance-pages.ts',
      exportName: 'risksContent',
      tests: ['tests/assurance-consolidation.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Risks',
      summary: 'Disclosure-safe public risk records with treatment direction, lifecycle state, and evidence relationships.',
      order: 4,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});
