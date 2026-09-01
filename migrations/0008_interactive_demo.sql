CREATE TABLE IF NOT EXISTS demo_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_expiry
  ON demo_sessions (expires_at);

CREATE TABLE IF NOT EXISTS demo_users (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE,
  UNIQUE (session_id, email)
);

CREATE INDEX IF NOT EXISTS idx_demo_users_session
  ON demo_users (session_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS demo_tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  assignee_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'doing', 'done')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES demo_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_tasks_session
  ON demo_tasks (session_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('demo', 'github')),
  delivery_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  action TEXT,
  repository TEXT,
  actor TEXT,
  summary_json TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  signature_valid INTEGER NOT NULL CHECK (signature_valid IN (0, 1)),
  received_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_session_time
  ON webhook_events (session_id, received_at DESC);

CREATE TABLE IF NOT EXISTS demo_state (
  session_id TEXT NOT NULL,
  state_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, state_key),
  FOREIGN KEY (session_id) REFERENCES demo_sessions(id) ON DELETE CASCADE
);

ALTER TABLE r2_object_metadata ADD COLUMN session_id TEXT;
ALTER TABLE r2_object_metadata ADD COLUMN display_name TEXT;
ALTER TABLE r2_object_metadata ADD COLUMN expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_r2_object_metadata_session
  ON r2_object_metadata (session_id, updated_at DESC);

