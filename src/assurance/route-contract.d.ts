export interface AssuranceRouteContractRoutes {
  html?: string;
}

export interface AssuranceRouteContractDeclaration {
  owner: string;
  ownerId: string;
  routes: AssuranceRouteContractRoutes;
}

export interface AssuranceRouteHandlerSupport {
  html?: boolean;
}

export function assuranceRouteOwnerResource(registry: unknown, kind: string): unknown | null;
export function assuranceRoutesForDataset(registry: unknown, kind: string): AssuranceRouteContractRoutes | null;
export function assuranceRouteDeclarations(registry: unknown): AssuranceRouteContractDeclaration[];
export function assuranceAnchor(recordId: string): string;
export function assuranceRecordUrls(
  registry: unknown,
  kind: string,
  recordId?: string,
): { html?: string; api?: string };
export function validateAssuranceRouteHandlerSupport(
  registry: unknown,
  support: Record<string, AssuranceRouteHandlerSupport>,
): string[];
export function validateAssuranceRouteContract(registry: unknown): string[];
