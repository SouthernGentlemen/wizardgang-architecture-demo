type RelationshipRecord = {
  id: string;
  relationships: Array<{
    relation: string;
    from: { source: string; native: string };
    to: { source: string; native: string };
  }>;
};

export function rebindRelationshipSource(record: RelationshipRecord, source: string): void {
  record.relationships = record.relationships.map((relationship) => ({
    ...relationship,
    from: { source, native: record.id },
  }));
}

export function setRelationshipTargets(
  record: RelationshipRecord,
  relation: string,
  targetSource: string,
  targetIds: string[],
): void {
  const source = record.relationships[0]?.from.source;
  if (!source) throw new Error(`${record.id}: fixture record needs a source identity before relationships can be added`);
  record.relationships = [
    ...record.relationships.filter((relationship) => relationship.relation !== relation),
    ...targetIds.map((native) => ({
      relation,
      from: { source, native: record.id },
      to: { source: targetSource, native },
    })),
  ];
}
