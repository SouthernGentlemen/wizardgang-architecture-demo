CREATE TABLE IF NOT EXISTS application_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  source TEXT NOT NULL,
  event_key TEXT NOT NULL,
  message TEXT NOT NULL,
  route TEXT,
  request_id TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_logs_time
  ON application_logs (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_application_logs_source_time
  ON application_logs (source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_logs_level_time
  ON application_logs (level, created_at DESC);
