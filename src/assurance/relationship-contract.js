const definitions = {
  evidence: { target: 'records', kind: 'evidence' },
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

export const ASSURANCE_RELATIONSHIP_DEFINITIONS = Object.freeze(
  Object.fromEntries(Object.entries(definitions).map(([name, definition]) => [name, Object.freeze(definition)])),
);

export function assuranceRelationshipNames() {
  return Object.keys(ASSURANCE_RELATIONSHIP_DEFINITIONS);
}

export function assuranceRelationshipDefinition(name) {
  return ASSURANCE_RELATIONSHIP_DEFINITIONS[name];
}

export function assuranceIdentityKey(identity) {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return '';
  const { source, native } = identity;
  return typeof source === 'string' && source.length > 0 && typeof native === 'string' && native.length > 0
    ? `${source}\u0000${native}`
    : '';
}

function validateIdentity(identity, label) {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return [`${label}: identity must be an object`];
  const keys = Object.keys(identity);
  const unknown = keys.filter((key) => key !== 'source' && key !== 'native');
  const errors = unknown.map((key) => `${label}.${key}: record-local identities may only contain source and native`);
  if (typeof identity.source !== 'string' || identity.source.length === 0) errors.push(`${label}.source: canonical source is required`);
  if (typeof identity.native !== 'string' || identity.native.length === 0) errors.push(`${label}.native: canonical native identity is required`);
  return errors;
}

export function unknownAssuranceRelationshipNames(relationships) {
  if (!Array.isArray(relationships)) return [];
  return [...new Set(relationships
    .map((relationship) => relationship?.relation)
    .filter((relation) => typeof relation === 'string' && !assuranceRelationshipDefinition(relation)))];
}

export function assuranceRelationshipsForRelation(relationships, relation) {
  if (!Array.isArray(relationships)) return [];
  return relationships.filter((relationship) => relationship?.relation === relation);
}

export function assuranceRelationshipIds(relationships, relation) {
  return assuranceRelationshipsForRelation(relationships, relation)
    .map((relationship) => relationship?.to?.native)
    .filter((native) => typeof native === 'string' && native.length > 0);
}

export function cloneAssuranceRelationships(relationships) {
  if (!Array.isArray(relationships)) return [];
  return relationships.map((relationship) => ({
    relation: relationship.relation,
    from: { ...relationship.from },
    to: { ...relationship.to },
  }));
}

export function normalizeAssuranceRelationships(relationships) {
  const errors = validateAssuranceRelationshipSet(relationships);
  if (errors.length > 0) throw new TypeError(errors.join('; '));
  return cloneAssuranceRelationships(relationships);
}

export function emptyAssuranceRelationships() {
  return [];
}

export function assuranceRelationshipTargetIds(name, context = {}) {
  const definition = assuranceRelationshipDefinition(name);
  if (!definition) throw new Error(`Unknown assurance relationship semantic ${name}.`);
  const declaredTargets = context.targetIdsByRelationship?.get?.(name);
  if (declaredTargets) return declaredTargets;
  if (definition.target === 'frameworks') return new Set(context.frameworkIds ?? []);
  if (definition.target === 'governance-documents') return new Set(context.governanceDocumentIds ?? []);
  const records = context.recordsByKind?.get?.(definition.kind) ?? [];
  return new Set(records
    .filter((record) => !definition.recordKind || record?.kind === definition.recordKind)
    .map((record) => record?.id)
    .filter((id) => typeof id === 'string' && id.length > 0));
}

export function validateAssuranceRelationshipSet(
  relationships,
  context = {},
  label = 'relationships',
  options = {},
) {
  if (!Array.isArray(relationships)) return [`${label}: relationships must be an array of identity edges`];
  const errors = [];
  const seen = new Set();
  const expectedSourceKey = assuranceIdentityKey(context.sourceIdentity);
  for (let index = 0; index < relationships.length; index += 1) {
    const relationship = relationships[index];
    const edgeLabel = `${label}[${index}]`;
    if (!relationship || typeof relationship !== 'object' || Array.isArray(relationship)) {
      errors.push(`${edgeLabel}: relationship must be an object`);
      continue;
    }
    const keys = Object.keys(relationship);
    for (const key of keys) if (!['relation', 'from', 'to'].includes(key)) errors.push(`${edgeLabel}.${key}: unknown relationship field`);
    for (const required of ['relation', 'from', 'to']) if (!(required in relationship)) errors.push(`${edgeLabel}.${required}: field is required`);
    const relation = relationship.relation;
    const definition = typeof relation === 'string' ? assuranceRelationshipDefinition(relation) : undefined;
    if (!definition) {
      errors.push(`${edgeLabel}.relation: invalid assurance relationship relation ${String(relation)}`);
      continue;
    }
    errors.push(...validateIdentity(relationship.from, `${edgeLabel}.from`));
    errors.push(...validateIdentity(relationship.to, `${edgeLabel}.to`));
    const fromKey = assuranceIdentityKey(relationship.from);
    const toKey = assuranceIdentityKey(relationship.to);
    if (!fromKey || !toKey) continue;
    if (expectedSourceKey && fromKey !== expectedSourceKey) errors.push(`${edgeLabel}.from: edge source does not match owning record identity`);
    const key = `${relation}\u0000${fromKey}\u0000${toKey}`;
    if (seen.has(key)) errors.push(`${edgeLabel}: duplicate relationship edge`);
    seen.add(key);
    if (options.internalTargetsOnly && definition.target !== 'records') continue;
    const identityTargets = context.targetIdentitiesByRelationship?.get?.(relation);
    if (identityTargets) {
      if (!identityTargets.has(toKey)) errors.push(`${edgeLabel}.to: unresolved ${relation} relationship ${relationship.to.source}:${relationship.to.native}`);
      continue;
    }
    const targets = assuranceRelationshipTargetIds(relation, context);
    if (targets.size > 0 && !targets.has(relationship.to.native)) {
      errors.push(`${edgeLabel}.to: unresolved ${relation} relationship ${relationship.to.native}`);
    }
  }
  return errors;
}
