CREATE TABLE IF NOT EXISTS service_health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down', 'unknown')),
  response_ms INTEGER,
  detail_json TEXT,
  checked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_health_checks_service_time
  ON service_health_checks (service_key, checked_at DESC);

CREATE TABLE IF NOT EXISTS usage_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_key TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  budget_limit_usd REAL,
  captured_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_snapshots_service_time
  ON usage_snapshots (service_key, captured_at DESC);
