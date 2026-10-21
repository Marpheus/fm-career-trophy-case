-- Idempotent: `npm run db:migrate` runs this whole file on every call.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stored lowercased, so 'Maros' and 'maros' are the same account.
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  -- SHA-256 of the cookie token; a leaked table cannot be replayed as cookies.
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

-- One trophy case per user: the same PersistedState the browser keeps in localStorage.
CREATE TABLE IF NOT EXISTS trophy_cases (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  -- Bumped on every save; a write carrying an older revision is rejected, so a stale tab
  -- cannot overwrite what another device saved.
  revision integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fixed-window counters, one row per key (e.g. 'login:ip:203.0.113.7').
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL
);
