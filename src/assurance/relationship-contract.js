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

export function unknownAssuranceRelationshipNames(relationships) {
  if (!relationships || typeof relationships !== 'object' || Array.isArray(relationships)) return [];
  return Object.keys(relationships).filter((name) => !assuranceRelationshipDefinition(name));
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
  const errors = [];
  if (!relationships || typeof relationships !== 'object' || Array.isArray(relationships)) {
    return [`${label}: relationships must be an object`];
  }
  for (const unknown of unknownAssuranceRelationshipNames(relationships)) {
    errors.push(`${label}.${unknown}: unknown assurance relationship semantic`);
  }
  for (const name of assuranceRelationshipNames()) {
    const values = relationships[name];
    if (values === undefined) continue;
    if (!Array.isArray(values)) {
      errors.push(`${label}.${name}: relationship value must be an array`);
      continue;
    }
    const definition = assuranceRelationshipDefinition(name);
    if (options.internalTargetsOnly && definition?.target !== 'records') continue;
    const targets = assuranceRelationshipTargetIds(name, context);
    for (const id of values) {
      if (!targets.has(id)) errors.push(`${label}.${name}: unresolved ${name} relationship ${id}`);
    }
  }
  return errors;
}
