import { publicAssuranceRegistry } from '../assurance/registry';
import { assuranceDeploymentContext, presentPublicEvidence } from '../assurance/presentation';
import {
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';
import type { Env } from '../types';

function presentedEvidence(request: Request, env: Env) {
  const origin = new URL(request.url).origin;
  return publicAssuranceRegistry.evidence.map((record) => presentPublicEvidence(record, env, origin));
}

export function assuranceResponse(request: Request, env: Env): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const evidence = presentedEvidence(request, env);
  return assuranceJsonResponse(request, {
    ...publicAssuranceRegistry,
    schemaVersion: context.schemaVersion,
    deployment: assuranceDeploymentContext(env),
    links: {
      self: new URL('/v1/assurance', request.url).toString(),
      evidence: new URL('/v1/assurance/evidence', request.url).toString(),
    },
    evidence,
  });
}

export function assuranceEvidenceResponse(request: Request, env: Env): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const records = presentedEvidence(request, env);
  const page = paginateAssuranceRecords(request, context.url, records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'evidence',
    qualification: publicAssuranceRegistry.qualification,
    deployment: assuranceDeploymentContext(env),
    count: records.length,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
