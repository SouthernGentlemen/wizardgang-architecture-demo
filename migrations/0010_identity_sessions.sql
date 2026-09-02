CREATE TABLE IF NOT EXISTS identity_sessions (
  session_id_sha256 TEXT PRIMARY KEY,
  payload_ciphertext TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_identity_sessions_expiry
  ON identity_sessions (expires_at);

CREATE TABLE IF NOT EXISTS identity_saml_requests (
  request_id TEXT PRIMARY KEY,
  request_value TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_identity_saml_requests_created
  ON identity_saml_requests (created_at);

CREATE TABLE IF NOT EXISTS identity_saml_assertions (
  assertion_id_sha256 TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  validated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_identity_saml_assertions_expiry
  ON identity_saml_assertions (expires_at);
