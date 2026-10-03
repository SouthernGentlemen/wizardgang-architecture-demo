export interface AssuranceRelationshipDefinition {
  target: 'records' | 'frameworks' | 'governance-documents' | 'documentation';
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
  recordsByKind?: ReadonlyMap<string, readonly { id?: unknown; kind?: unknown }[]>;
  frameworkIds?: Iterable<string>;
  governanceDocumentIds?: Iterable<string>;
  targetIdsByRelationship?: ReadonlyMap<string, ReadonlySet<string>>;
  targetIdentitiesByRelationship?: ReadonlyMap<string, ReadonlySet<string>>;
  sourceIdentity?: AssuranceReportingIdentity;
}

export interface AssuranceRelationshipValidationOptions {
  internalTargetsOnly?: boolean;
}

export const ASSURANCE_DOCUMENTATION_SOURCE = 'github.repository-markdown' as const;
const DOCUMENTATION_REFERENCE_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))([^#\r\n]+\.md)#([a-z0-9][a-z0-9-]*)$/;

export function parseAssuranceDocumentationReference(value: unknown): { repositoryPath: string; anchor: string } | null {
  if (typeof value !== 'string') return null;
  const match = value.match(DOCUMENTATION_REFERENCE_PATTERN);
  return match ? { repositoryPath: match[1], anchor: match[2] } : null;
}

const definitions: Record<string, AssuranceRelationshipDefinition> = {
  evidence: { target: 'records', kind: 'evidence' },
  documentation: { target: 'documentation' },
  compliance: { target: 'records', kind: 'compliance' },
  frameworks: { target: 'frameworks' },
  claims: { target: 'records', kind: 'claims' },
  risks: { target: 'records', kind: 'risks' },
  controls: { target: 'records', kind: 'compliance', recordKind: 'control' },
  incidents: { target: 'records', kind: 'incidents' },
  exercises: { target: 'records', kind: 'exercises' },
  advisories: { target: 'records', kind: 'advisories' },
  governanceDocuments: { target: 'governance-documents' },
  objectives: { target: 'records', kind: 'objectives' },
};

export const ASSURANCE_RELATIONSHIP_DEFINITIONS: Readonly<Record<string, AssuranceRelationshipDefinition>> = Object.freeze(
  Object.fromEntries(Object.entries(definitions).map(([name, definition]) => [name, Object.freeze(definition)])),
);

export function assuranceRelationshipNames(): string[] {
  return Object.keys(ASSURANCE_RELATIONSHIP_DEFINITIONS);
}

export function assuranceRelationshipDefinition(name: string): AssuranceRelationshipDefinition | undefined {
  return ASSURANCE_RELATIONSHIP_DEFINITIONS[name];
}

export function assuranceIdentityKey(identity: unknown): string {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return '';
  const { source, native } = identity as Record<string, unknown>;
  return typeof source === 'string' && source.length > 0 && typeof native === 'string' && native.length > 0
    ? `${source}\u0000${native}`
    : '';
}

function validateIdentity(identity: unknown, label: string): string[] {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return [`${label}: identity must be an object`];
  const value = identity as Record<string, unknown>;
  const keys = Object.keys(value);
  const unknown = keys.filter((key) => key !== 'source' && key !== 'native');
  const errors = unknown.map((key) => `${label}.${key}: record-local identities may only contain source and native`);
  if (typeof value.source !== 'string' || value.source.length === 0) errors.push(`${label}.source: canonical source is required`);
  if (typeof value.native !== 'string' || value.native.length === 0) errors.push(`${label}.native: canonical native identity is required`);
  return errors;
}

export function unknownAssuranceRelationshipNames(relationships: unknown): string[] {
  if (!Array.isArray(relationships)) return [];
  return [...new Set(relationships
    .map((relationship) => relationship?.relation)
    .filter((relation): relation is string => typeof relation === 'string' && !assuranceRelationshipDefinition(relation)))];
}

export function assuranceRelationshipsForRelation(relationships: unknown, relation: string): AssuranceRelationshipEdge[] {
  if (!Array.isArray(relationships)) return [];
  return relationships.filter((relationship) => relationship?.relation === relation) as AssuranceRelationshipEdge[];
}

export function assuranceRelationshipIds(relationships: unknown, relation: string): string[] {
  return assuranceRelationshipsForRelation(relationships, relation)
    .map((relationship) => relationship?.to?.native)
    .filter((native): native is string => typeof native === 'string' && native.length > 0);
}

export function cloneAssuranceRelationships(relationships: unknown): AssuranceRelationshipEdge[] {
  if (!Array.isArray(relationships)) return [];
  return relationships.map((relationship) => ({
    relation: relationship.relation,
    from: { ...relationship.from },
    to: { ...relationship.to },
  })) as AssuranceRelationshipEdge[];
}

export function normalizeAssuranceRelationships(relationships: unknown): AssuranceRelationshipEdge[] {
  const errors = validateAssuranceRelationshipSet(relationships);
  if (errors.length > 0) throw new TypeError(errors.join('; '));
  return cloneAssuranceRelationships(relationships);
}

export function emptyAssuranceRelationships(): AssuranceRelationshipEdge[] {
  return [];
}

export function assuranceRelationshipTargetIds(
  name: string,
  context: AssuranceRelationshipTargetContext = {},
): Set<string> | ReadonlySet<string> {
  const definition = assuranceRelationshipDefinition(name);
  if (!definition) throw new Error(`Unknown assurance relationship semantic ${name}.`);
  const declaredTargets = context.targetIdsByRelationship?.get(name);
  if (declaredTargets) return declaredTargets;
  if (definition.target === 'frameworks') return new Set(context.frameworkIds ?? []);
  if (definition.target === 'governance-documents') return new Set(context.governanceDocumentIds ?? []);
  const records = context.recordsByKind?.get(definition.kind as string) ?? [];
  return new Set(records
    .filter((record) => !definition.recordKind || record?.kind === definition.recordKind)
    .map((record) => record?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0));
}

export function validateAssuranceRelationshipSet(
  relationships: unknown,
  context: AssuranceRelationshipTargetContext = {},
  label = 'relationships',
  options: AssuranceRelationshipValidationOptions = {},
): string[] {
  if (!Array.isArray(relationships)) return [`${label}: relationships must be an array of identity edges`];
  const errors: string[] = [];
  const seen = new Set<string>();
  const expectedSourceKey = assuranceIdentityKey(context.sourceIdentity);
  for (let index = 0; index < relationships.length; index += 1) {
    const relationship = relationships[index];
    const edgeLabel = `${label}[${index}]`;
    if (!relationship || typeof relationship !== 'object' || Array.isArray(relationship)) {
      errors.push(`${edgeLabel}: relationship must be an object`);
      continue;
    }
    const edge = relationship as Record<string, any>;
    const keys = Object.keys(edge);
    for (const key of keys) if (!['relation', 'from', 'to'].includes(key)) errors.push(`${edgeLabel}.${key}: unknown relationship field`);
    for (const required of ['relation', 'from', 'to']) if (!(required in edge)) errors.push(`${edgeLabel}.${required}: field is required`);
    const relation = edge.relation;
    const definition = typeof relation === 'string' ? assuranceRelationshipDefinition(relation) : undefined;
    if (!definition) {
      errors.push(`${edgeLabel}.relation: invalid assurance relationship relation ${String(relation)}`);
      continue;
    }
    errors.push(...validateIdentity(edge.from, `${edgeLabel}.from`));
    errors.push(...validateIdentity(edge.to, `${edgeLabel}.to`));
    const fromKey = assuranceIdentityKey(edge.from);
    const toKey = assuranceIdentityKey(edge.to);
    if (!fromKey || !toKey) continue;
    if (expectedSourceKey && fromKey !== expectedSourceKey) errors.push(`${edgeLabel}.from: edge source does not match owning record identity`);
    const key = `${relation}\u0000${fromKey}\u0000${toKey}`;
    if (seen.has(key)) errors.push(`${edgeLabel}: duplicate relationship edge`);
    seen.add(key);
    if (definition.target === 'documentation') {
      if (edge.to.source !== ASSURANCE_DOCUMENTATION_SOURCE) errors.push(`${edgeLabel}.to.source: documentation source must be ${ASSURANCE_DOCUMENTATION_SOURCE}`);
      if (!parseAssuranceDocumentationReference(edge.to.native)) errors.push(`${edgeLabel}.to.native: documentation target must be a repository-relative .md path plus GitHub heading anchor`);
      continue;
    }
    if (options.internalTargetsOnly && definition.target !== 'records') continue;
    const identityTargets = context.targetIdentitiesByRelationship?.get(relation);
    if (identityTargets) {
      if (!identityTargets.has(toKey)) errors.push(`${edgeLabel}.to: unresolved ${relation} relationship ${edge.to.native} at ${edge.to.source}`);
      continue;
    }
    const targets = assuranceRelationshipTargetIds(relation, context);
    if (targets.size > 0 && !targets.has(edge.to.native)) {
      errors.push(`${edgeLabel}.to: unresolved ${relation} relationship ${edge.to.native}`);
    }
  }
  return errors;
}
