import { describe, expect, it } from 'vitest';
import { assuranceRegistry } from '../src/assurance/model';
import {
  assuranceRecordEntries,
  assuranceRecordFamilyRegistration,
  resolveAssuranceResourceOwner,
} from '../src/assurance/record-discovery.js';
import { validateAssuranceRelationshipSet } from '../src/assurance/relationship-contract.js';
import {
  assuranceRoutesForDataset,
  matchAssuranceRoute,
  validateAssuranceRouteContract,
  validateAssuranceRouteHandlerSupport,
} from '../src/assurance/route-contract.js';

function syntheticReportRegistry() {
  return {
    id: 'synthetic-assurance',
    routes: { api: '/v1/assurance' },
    datasets: [
      {
        id: 'report-register-v2',
        kind: 'reports',
        role: 'dataset',
        path: 'assurance/reports/reports.json',
        schema: 'contracts/assurance/report.schema.json',
        visibility: 'public',
        capabilities: ['runtime', 'records', 'api-index'],
        recordCollection: { path: 'records', identity: ['id'] },
        filters: { status: { path: 'status', label: 'Status' } },
        routes: {
          api: '/v1/assurance/reports',
          apiRecord: '/v1/assurance/reports/{id}',
        },
      },
    ],
    presentations: [],
    operations: [],
  } as any;
}

describe('registry capability contracts', () => {
  it('admits a synthetic report family through discovery and generic API routing without a family switch', () => {
    const registry = syntheticReportRegistry();
    const documents = {
      'report-register-v2': { records: [{ id: 'RPT-001', status: 'ready' }] },
    } as Record<string, unknown>;
    const entries = assuranceRecordEntries(registry, (resource) => documents[resource.id], { runtimeOnly: true });

    expect(assuranceRecordFamilyRegistration(registry, 'reports')).toMatchObject({
      kind: 'reports',
      status: 'registered',
    });
    expect(entries.map((entry) => (entry.record as { id: string }).id)).toEqual(['RPT-001']);
    expect(validateAssuranceRouteContract(registry)).toEqual([]);
    expect(assuranceRoutesForDataset(registry, 'reports')).toEqual({
      api: '/v1/assurance/reports',
      apiRecord: '/v1/assurance/reports/{id}',
    });
    expect(matchAssuranceRoute(registry, '/v1/assurance/reports')).toEqual({
      owner: 'reports',
      kind: 'api-collection',
    });
    expect(matchAssuranceRoute(registry, '/v1/assurance/reports/RPT-001')).toEqual({
      owner: 'reports',
      kind: 'api-record',
      recordId: 'RPT-001',
    });
    expect(validateAssuranceRouteHandlerSupport(registry, {
      registry: { apiCollection: true },
      '*': { apiCollection: true, apiRecord: true },
    })).toEqual([]);
  });

  it('rejects a dangling synthetic report reference and unknown relationship semantics through the shared resolver', () => {
    const report = {
      id: 'RPT-001',
      relationships: [
        {
          relation: 'evidence',
          from: { source: 'github.structured-records.report-register-v2', native: 'RPT-001' },
          to: { source: 'github.structured-records.evidence', native: 'EVD-MISSING-999' },
        },
        {
          relation: 'futureRelationship',
          from: { source: 'github.structured-records.report-register-v2', native: 'RPT-001' },
          to: { source: 'github.structured-records.future', native: 'FUTURE-001' },
        },
      ],
    };
    const errors = validateAssuranceRelationshipSet(
      report.relationships,
      {
        sourceIdentity: { source: 'github.structured-records.report-register-v2', native: 'RPT-001' },
        targetIdentitiesByRelationship: new Map([['evidence', new Set()]]),
      },
      'reports:RPT-001',
      { internalTargetsOnly: true },
    );
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('reports:RPT-001[1].relation: invalid assurance relationship relation futureRelationship'),
      expect.stringContaining('reports:RPT-001[0].to: unresolved evidence relationship EVD-MISSING-999'),
    ]));
  });

  it('distinguishes unsupported, unavailable, partial, registered, and unknown family registrations', () => {
    const registry = {
      datasets: [
        { id: 'unsupported', kind: 'unsupported', role: 'dataset', visibility: 'public', capabilities: ['runtime'] },
        { id: 'unavailable', kind: 'unavailable', role: 'dataset', visibility: 'public', capabilities: ['records'], recordCollection: { path: 'records', identity: ['id'] } },
        { id: 'partial', kind: 'partial', role: 'dataset', visibility: 'public', capabilities: ['runtime', 'records'], recordCollection: { path: 'records', identity: ['id'] }, resources: [
          { id: 'partial.offline', kind: 'partial', role: 'partition', visibility: 'public', capabilities: ['records'], recordCollection: { path: 'records', identity: ['id'] } },
        ] },
      ],
    } as any;
    expect(assuranceRecordFamilyRegistration(registry, 'unsupported').status).toBe('unsupported');
    expect(assuranceRecordFamilyRegistration(registry, 'unavailable').status).toBe('unavailable');
    expect(assuranceRecordFamilyRegistration(registry, 'partial').status).toBe('partial');
    expect(assuranceRecordFamilyRegistration(registry, 'missing').status).toBe('unknown');
  });

  it('keeps resource-id route ownership stable when an owner id changes independently of its kind', () => {
    const registry = structuredClone(assuranceRegistry) as any;
    const incidents = registry.datasets.find((dataset: any) => dataset.kind === 'incidents');
    const exercises = registry.datasets.find((dataset: any) => dataset.kind === 'exercises');
    incidents.id = 'incident-register-v2';
    exercises.routeOwner = incidents.id;

    expect(resolveAssuranceResourceOwner(registry, exercises, 'routeOwner').id).toBe('incident-register-v2');
    expect(validateAssuranceRouteContract(registry)).toEqual([]);
    expect(assuranceRoutesForDataset(registry, 'exercises')).toEqual(assuranceRoutesForDataset(registry, 'incidents'));
  });
});
