import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const i18nRouteCapability = defineInterfaceIdentityCapability('interfaces.i18n', [
  interfaceIdentityRoute({
    id: 'interfaces.i18n',
    pattern: '/interfaces/i18n',
    methods: ['GET'],
    kind: 'page',
    handler: async (request, { env }) => {
      const [{ i18nContent }, { renderPage }] = await Promise.all([import('../../demos/i18n-page'), import('../../ui/page')]);
      return renderPage(env, { ...i18nContent(request, env), routeId: 'interfaces.i18n' });
    },
    title: 'Internationalization',
    description: 'Locale-aware language, formatting, translation-resource, pluralization, and RTL demonstration.',
    sourceModule: 'src/demos/i18n-page.ts',
    sourceExport: 'i18nContent',
    tests: ['tests/interface-consolidation.test.ts', 'tests/interface.test.ts'],
    page: {
      parent: 'interfaces.index',
      label: 'Internationalization',
      summary: 'Locale-aware language, formatting, pluralization, translation resources, and RTL readiness.',
      order: 5,
      navigation: 'secondary',
      architectureMap: true,
    },
  }),
]);
