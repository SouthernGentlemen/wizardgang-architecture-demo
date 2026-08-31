CREATE TABLE IF NOT EXISTS r2_object_metadata (
  object_key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  delivery_id TEXT NOT NULL UNIQUE,
  payload_sha256 TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_receipts_time
  ON webhook_receipts (received_at DESC);
