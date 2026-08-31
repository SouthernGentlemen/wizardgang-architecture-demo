CREATE TABLE IF NOT EXISTS demo_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  demo_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_events_demo_id
  ON demo_events (demo_id, id DESC);

CREATE TABLE IF NOT EXISTS demo_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  namespace TEXT NOT NULL,
  record_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(namespace, record_key)
);

CREATE INDEX IF NOT EXISTS idx_demo_records_namespace
  ON demo_records (namespace, record_key);
