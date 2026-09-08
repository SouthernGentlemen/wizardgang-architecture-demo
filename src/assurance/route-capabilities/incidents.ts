import { defineAssuranceRouteCapability } from '../route-capability';

export const incidentsRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.incidents',
  pattern: '/assurance/incidents',
  html: {
    handler: async (request, env) => {
      const [{ incidentsContent }, { renderSharedReporting }, { renderPage }] = await Promise.all([
        import('../../demos/assurance-pages'),
        import('../../demos/assurance'),
        import('../../ui/page'),
      ]);
      const content = incidentsContent(env);
      const reporting = await renderSharedReporting(request, env, 'incidents');
      return renderPage(env, { ...content, routeId: 'assurance.incidents', body: `${content.body}\n${reporting}` });
    },
    source: {
      module: 'src/demos/assurance-pages.ts',
      exportName: 'incidentsContent',
      tests: ['tests/assurance-consolidation.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Incidents',
      summary: 'Disclosure-safe incident and exercise records with explicit record boundaries.',
      order: 5,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});
