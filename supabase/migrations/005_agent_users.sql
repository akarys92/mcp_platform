-- Agent Users — Adds support for AI agent users with API key authentication.

-- 1. Add user_type column to distinguish employees from agents.
-- Role controls privilege level (admin/user), user_type controls auth mechanism.
ALTER TABLE public.users
  ADD COLUMN user_type text NOT NULL DEFAULT 'employee'
  CHECK (user_type IN ('employee', 'agent'));

-- 2. Agent API Keys — stores hashed API keys for agent authentication.
CREATE TABLE public.agent_api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash text NOT NULL,       -- SHA-256 hex hash (never store plaintext)
  key_prefix text NOT NULL,     -- first 12 chars for display (e.g. "eak_a3b9c1d2")
  label text,                   -- optional human label
  revoked_at timestamptz,       -- null unless admin revokes
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_api_keys_hash ON public.agent_api_keys(key_hash);
CREATE INDEX idx_agent_api_keys_user ON public.agent_api_keys(user_id);

-- 3. RLS for agent_api_keys
ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agent keys"
  ON public.agent_api_keys FOR ALL
  USING (public.is_admin());
