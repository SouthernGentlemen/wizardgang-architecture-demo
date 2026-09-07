import { assuranceComplianceResponse } from '../../api/assurance';
import { defineAssuranceRouteCapability } from '../route-capability';

export const complianceRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'compliance.iso-27001',
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
