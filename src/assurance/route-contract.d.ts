export interface AssuranceRouteContractDeclaration {
  owner: string;
  ownerId: string;
  routeId: string;
}

export interface AssuranceRouteHandlerSupport {
  html?: boolean;
}

export function assuranceRouteOwnerResource(registry: unknown, kind: string): unknown | null;
export function assuranceRoutesForDataset(registry: unknown, kind: string): string | null;
export function assuranceRouteDeclarations(registry: unknown): AssuranceRouteContractDeclaration[];
export function assuranceAnchor(recordId: string): string;
export function validateAssuranceRouteHandlerSupport(
  registry: unknown,
  support: Record<string, AssuranceRouteHandlerSupport>,
): string[];
export function validateAssuranceRouteContract(
  registry: unknown,
  registeredRouteIds?: ReadonlySet<string> | readonly string[],
): string[];
