import { publicAssuranceRegistry } from '../assurance/registry';
import { assuranceDeploymentContext, presentPublicEvidence } from '../assurance/presentation';
import { json, methodNotAllowed } from '../lib/http';
import type { Env } from '../types';

function presentedEvidence(request: Request, env: Env) {
  const origin = new URL(request.url).origin;
  return publicAssuranceRegistry.evidence.map((record) => presentPublicEvidence(record, env, origin));
}

export function assuranceResponse(request: Request, env: Env): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const evidence = presentedEvidence(request, env);
  return json({
    ...publicAssuranceRegistry,
    deployment: assuranceDeploymentContext(env),
    links: {
      self: new URL('/v1/assurance', request.url).toString(),
      evidence: new URL('/v1/assurance/evidence', request.url).toString(),
    },
    evidence,
  }, {
    headers: { 'cache-control': 'public, max-age=300' },
  });
}

export function assuranceEvidenceResponse(request: Request, env: Env): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const records = presentedEvidence(request, env);
  return json({
    schemaVersion: publicAssuranceRegistry.schemaVersion,
    dataset: 'evidence',
    qualification: publicAssuranceRegistry.qualification,
    deployment: assuranceDeploymentContext(env),
    count: records.length,
    records,
  }, {
    headers: { 'cache-control': 'public, max-age=300' },
  });
}
