-- Cloudflare remains authoritative for raw operational observations.
-- The retired local snapshot mirror is derived/non-authoritative and is not read by runtime code.
DROP INDEX IF EXISTS idx_cloudflare_usage_snapshots_time;
DROP TABLE IF EXISTS cloudflare_usage_snapshots;
