-- Preserve the public seed records while moving their presentation links to /api.
-- Applied migrations remain immutable; this forward migration updates only the two
-- known v0.2.0 seed rows and leaves operator-created records untouched.

UPDATE demo_records
SET value_json = REPLACE(value_json, '"route":"/api/rest"', '"route":"/api"'),
    updated_at = '2026-08-31T00:00:00.000Z'
WHERE namespace = 'public'
  AND record_key = 'integration-rest'
  AND value_json LIKE '%"route":"/api/rest"%';

UPDATE demo_records
SET value_json = REPLACE(value_json, '"route":"/api/graphql"', '"route":"/api"'),
    updated_at = '2026-08-31T00:00:00.000Z'
WHERE namespace = 'public'
  AND record_key = 'integration-graphql'
  AND value_json LIKE '%"route":"/api/graphql"%';
