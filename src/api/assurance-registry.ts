import { assuranceRegistryMetadata } from '../assurance/model';
import { assuranceDeploymentContext } from '../assurance/presentation';
import {
  listPublishedAssuranceRecords,
  presentedPublishedEvidenceRecords,
  publishedAssuranceSummary,
} from '../assurance/publication';
import {
  serializeAssuranceV1Advisory,
  serializeAssuranceV1Claim,
  serializeAssuranceV1Evidence,
  serializeAssuranceV1Exercise,
  serializeAssuranceV1Incident,
  serializeAssuranceV1Risk,
} from './assurance-v1';
import {
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';
import type { Env } from '../types';

export function assuranceResponse(request: Request, env: Env): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const evidence = presentedPublishedEvidenceRecords(env, new URL(request.url).origin).map(serializeAssuranceV1Evidence);
  return assuranceJsonResponse(request, {
    ...assuranceRegistryMetadata,
    schemaVersion: context.schemaVersion,
    counts: publishedAssuranceSummary.counts,
    riskCounts: publishedAssuranceSummary.riskCounts,
    incidentCounts: publishedAssuranceSummary.incidentCounts,
    incidentQualifications: publishedAssuranceSummary.incidentQualifications,
    advisoryQualification: publishedAssuranceSummary.advisoryQualification,
    claims: listPublishedAssuranceRecords('claims').map(serializeAssuranceV1Claim),
    risks: listPublishedAssuranceRecords('risks').map(serializeAssuranceV1Risk),
    incidents: listPublishedAssuranceRecords('incidents').map(serializeAssuranceV1Incident),
    exercises: listPublishedAssuranceRecords('exercises').map(serializeAssuranceV1Exercise),
    advisories: listPublishedAssuranceRecords('advisories').map(serializeAssuranceV1Advisory),
    evidence,
    publication: publishedAssuranceSummary.publication,
    deployment: assuranceDeploymentContext(env),
    links: {
      self: new URL('/v1/assurance', request.url).toString(),
      evidence: new URL('/v1/assurance/evidence', request.url).toString(),
    },
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
    qualification: publishedAssuranceSummary.qualification,
    deployment: assuranceDeploymentContext(env),
    count: records.length,
    records: page.records.map(serializeAssuranceV1Evidence),
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
