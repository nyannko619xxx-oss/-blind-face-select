-- Formal Owner-only invite store. Apply only to blind-face-select-prod-v01 D1.
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  session_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  claimed_invite_hash TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS single_use_invites (
  token_hash TEXT PRIMARY KEY,
  issuer_session_id TEXT NOT NULL,
  issued_jst_day TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE (issuer_session_id, issued_jst_day),
  FOREIGN KEY (issuer_session_id) REFERENCES anonymous_sessions(session_id)
);
