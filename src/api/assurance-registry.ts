import {
  assuranceDeploymentContext,
} from '../assurance/service';
import {
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
  publicPublishedAssuranceRegistry,
} from '../assurance/publication';
import {
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';
import type { Env } from '../types';

export function assuranceResponse(request: Request, env: Env): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const evidence = presentedPublishedEvidenceRecords(env, new URL(request.url).origin);
  return assuranceJsonResponse(request, {
    ...publicPublishedAssuranceRegistry,
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

  const records = presentedPublishedEvidenceRecords(env, new URL(request.url).origin);
  const page = paginateAssuranceRecords(request, context.url, records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'evidence',
    qualification: publicPublishedAssuranceRegistry.qualification,
    deployment: assuranceDeploymentContext(env),
    count: listPublishedAssuranceRecords('evidence').length,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
