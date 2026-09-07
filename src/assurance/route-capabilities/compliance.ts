import { assuranceComplianceResponse } from '../../api/assurance';
import { renderComplianceDemo } from '../../demos/compliance-page';
import { defineAssuranceRouteCapability } from '../route-capability';

export const complianceRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'compliance.iso-27001',
  html: {
    handler: renderComplianceDemo,
    source: {
      module: 'src/demos/compliance-page.ts',
      exportName: 'renderComplianceDemo',
      tests: ['tests/assurance-compliance.test.ts', 'tests/router.test.ts'],
    },
  },
  apiCollection: {
    handler: (request, env) => assuranceComplianceResponse(request, undefined, env),
    source: {
      module: 'src/api/assurance.ts',
      exportName: 'assuranceComplianceResponse',
      tests: ['tests/assurance-compliance-api.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
  apiRecord: {
    handler: (request, env, rawRecordId) => assuranceComplianceResponse(request, rawRecordId, env),
    source: {
      module: 'src/api/assurance.ts',
      exportName: 'assuranceComplianceResponse',
      tests: ['tests/assurance-compliance-api.test.ts', 'tests/assurance-route-intersections.test.ts'],
    },
  },
});
