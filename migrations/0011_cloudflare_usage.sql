CREATE TABLE IF NOT EXISTS cloudflare_usage_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK (status IN ('live', 'partial', 'unavailable')),
  source TEXT NOT NULL DEFAULT 'cloudflare',
  data_json TEXT NOT NULL,
  captured_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cloudflare_usage_snapshots_time
  ON cloudflare_usage_snapshots (captured_at DESC, id DESC);
