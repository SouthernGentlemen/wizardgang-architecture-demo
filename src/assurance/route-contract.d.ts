export interface AssuranceRouteContractRoutes {
  html?: string;
  api?: string;
  apiRecord?: string;
  aliases?: Array<{
    path: string;
    fragment?: string;
  }>;
}

export interface AssuranceRouteContractDeclaration {
  owner: string;
  ownerId: string;
  routes: AssuranceRouteContractRoutes;
}

export interface AssuranceRouteContractAlias {
  owner: string;
  path: string;
  target: string;
}

export interface AssuranceRouteContractMatch {
  owner: string;
  kind: 'html' | 'api-collection' | 'api-record' | 'alias';
  recordId?: string;
  target?: string;
}

export interface AssuranceRouteHandlerSupport {
  html?: boolean;
  apiCollection?: boolean;
  apiRecord?: boolean;
}

export function assuranceRouteOwnerResource(registry: unknown, kind: string): unknown | null;
export function assuranceRoutesForDataset(registry: unknown, kind: string): AssuranceRouteContractRoutes | null;
export function assuranceRouteDeclarations(registry: unknown): AssuranceRouteContractDeclaration[];
export function assuranceRouteAliases(registry: unknown): AssuranceRouteContractAlias[];
export function assuranceAnchor(recordId: string): string;
export function assuranceRecordUrls(
  registry: unknown,
  kind: string,
  recordId?: string,
): { html?: string; api?: string };
export function assuranceRegistryApiRoute(registry: unknown): string;
export function matchAssuranceRoute(registry: unknown, path: string): AssuranceRouteContractMatch | null;
export function validateAssuranceRouteHandlerSupport(
  registry: unknown,
  support: Record<string, AssuranceRouteHandlerSupport>,
): string[];
export function validateAssuranceRouteContract(registry: unknown): string[];
