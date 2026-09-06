export interface AssuranceRelationshipDefinition {
  target: 'records' | 'frameworks' | 'governance-documents';
  kind?: string;
  recordKind?: string;
}

export interface AssuranceReportingIdentity {
  source: string;
  native: string;
}

export interface AssuranceRelationshipEdge {
  relation: string;
  from: AssuranceReportingIdentity;
  to: AssuranceReportingIdentity;
}

export interface AssuranceRelationshipTargetContext {
  recordsByKind?: ReadonlyMap<string, readonly Array<{ id?: unknown; kind?: unknown }>>;
  frameworkIds?: Iterable<string>;
  governanceDocumentIds?: Iterable<string>;
  targetIdsByRelationship?: ReadonlyMap<string, ReadonlySet<string>>;
  targetIdentitiesByRelationship?: ReadonlyMap<string, ReadonlySet<string>>;
  sourceIdentity?: AssuranceReportingIdentity;
}

export interface AssuranceRelationshipValidationOptions {
  internalTargetsOnly?: boolean;
}

export const ASSURANCE_RELATIONSHIP_DEFINITIONS: Readonly<Record<string, AssuranceRelationshipDefinition>>;
export function assuranceRelationshipNames(): string[];
export function assuranceRelationshipDefinition(name: string): AssuranceRelationshipDefinition | undefined;
export function assuranceIdentityKey(identity: unknown): string;
export function unknownAssuranceRelationshipNames(relationships: unknown): string[];
export function assuranceRelationshipsForRelation(relationships: unknown, relation: string): AssuranceRelationshipEdge[];
export function assuranceRelationshipIds(relationships: unknown, relation: string): string[];
export function cloneAssuranceRelationships(relationships: unknown): AssuranceRelationshipEdge[];
export function normalizeAssuranceRelationships(relationships: unknown): AssuranceRelationshipEdge[];
export function emptyAssuranceRelationships(): AssuranceRelationshipEdge[];
export function assuranceRelationshipTargetIds(name: string, context?: AssuranceRelationshipTargetContext): Set<string> | ReadonlySet<string>;
export function validateAssuranceRelationshipSet(
  relationships: unknown,
  context?: AssuranceRelationshipTargetContext,
  label?: string,
  options?: AssuranceRelationshipValidationOptions,
): string[];
