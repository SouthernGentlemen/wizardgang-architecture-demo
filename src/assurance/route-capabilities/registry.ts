import { defineAssuranceRouteCapability } from '../route-capability';

export const assuranceRegistryRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.index',
  pattern: '/assurance',
  html: {
    handler: async (request, env) => {
      const [{ minimalAssuranceContent }, { renderNotFound, renderPage }] = await Promise.all([
        import('../../demos/assurance-minimal'),
        import('../../ui/page'),
      ]);
      if (new URL(request.url).searchParams.has('view')) return renderNotFound(env);
      const content = await minimalAssuranceContent(request, env);
      return renderPage(env, {
        ...content,
        routeId: 'assurance.index',
      });
    },
    source: {
      module: 'src/demos/assurance-minimal.ts',
      exportName: 'minimalAssuranceContent',
      tests: ['tests/demo-258-minimal-assurance.test.ts', 'tests/assurance-consolidation.test.ts'],
    },
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Assurance',
      summary: 'Four focused public checks for security controls, the AI boundary, traceability, and accessibility posture.',
      order: 3,
      navigation: 'primary',
      architectureMap: true,
    },
  },
});
