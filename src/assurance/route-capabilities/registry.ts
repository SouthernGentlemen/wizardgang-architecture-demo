import { defineAssuranceRouteCapability } from '../route-capability';

export const assuranceRegistryRouteCapability = defineAssuranceRouteCapability({
  routeId: 'assurance.index',
  pattern: '/assurance',
  html: {
    handler: async (request, env) => {
      const { loadAssuranceWorkbenchData, renderAssuranceWorkbench } = await import('../../demos/assurance-workbench');
      return renderAssuranceWorkbench(env, loadAssuranceWorkbenchData(request, env));
    },
    source: {
      module: 'src/demos/assurance-workbench.tsx',
      exportName: 'renderAssuranceWorkbench',
      tests: ['tests/assurance-workbench.test.ts', 'tests/assurance-workbench-accessibility.test.ts'],
    },
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Assurance',
      summary: 'Inspect framework assessment records, posture, evidence, and documentation in one workbench.',
      order: 3,
      navigation: 'primary',
      architectureMap: true,
    },
  },
  api: [{
    routeId: 'assurance.presentation',
    pattern: '/api/assurance/:record',
    cache: { mode: 'response' },
    handler: async (request, env, params) => {
      const { assurancePresentationResponse } = await import('../../demos/assurance-workbench');
      return assurancePresentationResponse(request, env, params.record ?? '');
    },
    source: {
      module: 'src/demos/assurance-workbench.tsx',
      exportName: 'assurancePresentationResponse',
      tests: ['tests/assurance-workbench.test.ts', 'tests/router.test.ts'],
    },
    title: 'Assurance record presentation fragment',
    description: 'Returns one focused assessment record pane for activation inside the assurance workbench.',
  }],
});
