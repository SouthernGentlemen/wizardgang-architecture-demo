console.error(
  'Production deployment is release-workflow only. Use the Deploy workflow with an already-published immutable vMAJOR.MINOR.PATCH release tag.',
);
process.exit(1);
