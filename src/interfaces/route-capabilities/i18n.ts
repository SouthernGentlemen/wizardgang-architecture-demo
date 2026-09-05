import i18nDemo from '../../demos/i18n';
import { renderI18nDemo } from '../../demos/i18n-page';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const i18nRouteCapability = defineInterfaceIdentityCapability('interfaces.i18n', [
  interfaceIdentityRoute({
    id: 'interfaces.i18n.page',
    pattern: i18nDemo.route,
    methods: ['GET'],
    kind: 'page',
    handler: (request, { env }) => renderI18nDemo(request, env),
    title: i18nDemo.title,
    description: i18nDemo.summary,
    sourceModule: 'src/demos/i18n-page.ts',
    sourceExport: 'renderI18nDemo',
    tests: ['tests/interface.test.ts'],
  }),
]);
