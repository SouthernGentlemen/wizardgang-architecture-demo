export interface AssuranceRelationshipDefinition {
  target: 'records' | 'frameworks' | 'governance-documents';
  kind?: string;
  recordKind?: string;
}

export interface AssuranceRelationshipTargetContext {
  recordsByKind?: ReadonlyMap<string, readonly Array<{ id?: unknown; kind?: unknown }>>;
  frameworkIds?: Iterable<string>;
  governanceDocumentIds?: Iterable<string>;
  targetIdsByRelationship?: ReadonlyMap<string, ReadonlySet<string>>;
}

export interface AssuranceRelationshipValidationOptions {
  internalTargetsOnly?: boolean;
}

export const ASSURANCE_RELATIONSHIP_DEFINITIONS: Readonly<Record<string, AssuranceRelationshipDefinition>>;
export function assuranceRelationshipNames(): string[];
export function assuranceRelationshipDefinition(name: string): AssuranceRelationshipDefinition | undefined;
export function unknownAssuranceRelationshipNames(relationships: unknown): string[];
export function assuranceRelationshipTargetIds(name: string, context?: AssuranceRelationshipTargetContext): Set<string> | ReadonlySet<string>;
export function validateAssuranceRelationshipSet(
  relationships: unknown,
  context?: AssuranceRelationshipTargetContext,
  label?: string,
  options?: AssuranceRelationshipValidationOptions,
): string[];
