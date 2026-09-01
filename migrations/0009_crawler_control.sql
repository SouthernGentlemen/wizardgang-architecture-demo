CREATE TABLE IF NOT EXISTS crawler_control (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state TEXT NOT NULL CHECK (state IN ('enabled', 'disabled')),
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

INSERT OR IGNORE INTO crawler_control (id, state, updated_at, updated_by)
VALUES (1, 'disabled', CURRENT_TIMESTAMP, 'migration');
