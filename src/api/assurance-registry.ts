import { assuranceRegistry } from '../assurance/model';
import { assuranceRouteDeclarations } from '../assurance/routes';
import { reportingContractPath } from '../reporting/registry';
import { genericAssuranceResponse } from './assurance';
import {
  assuranceJsonResponse,
  prepareAssuranceRequest,
} from './assurance-contract';
import type { Env } from '../types';

export function assuranceResponse(request: Request, _env: Env): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const collections = assuranceRouteDeclarations()
    .filter((declaration) => Boolean(declaration.routes.api))
    .map((declaration) => ({
      dataset: declaration.owner,
      route: declaration.routes.api!,
      ...(declaration.routes.apiRecord ? { recordRoute: declaration.routes.apiRecord } : {}),
    }));

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    contract: reportingContractPath,
    registry: assuranceRegistry,
    collections,
  });
}

export function assuranceEvidenceResponse(request: Request, env: Env): Promise<Response> {
  return genericAssuranceResponse(request, 'evidence', undefined, env);
}
