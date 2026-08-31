CREATE TABLE IF NOT EXISTS demo_control (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state TEXT NOT NULL CHECK (state IN ('online', 'offline')),
  public_message TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

INSERT OR IGNORE INTO demo_control (id, state, public_message, updated_at, updated_by)
VALUES (1, 'online', 'The architecture demo is available.', CURRENT_TIMESTAMP, 'migration');
