import { defineAssuranceRouteCapability } from '../route-capability';

export const incidentsRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.incidents',
  pattern: '/assurance/incidents',
  html: {
    handler: async (_request, env) => {
      const [{ incidentsContent }, { renderPage }] = await Promise.all([
        import('../../demos/incidents-page'),
        import('../../ui/page'),
      ]);
      const content = incidentsContent(env);
      return renderPage(env, { ...content, routeId: 'assurance.incidents' });
    },
    source: {
      module: 'src/demos/incidents-page.ts',
      exportName: 'incidentsContent',
      tests: ['tests/incidents-page.test.ts'],
    },
    page: {
      parent: 'assurance.index',
      label: 'Incidents',
      summary: 'Disclosure-safe incident posture and response-exercise readiness with traceable records.',
      order: 5,
      navigation: 'secondary',
      architectureMap: false,
    },
  },
});