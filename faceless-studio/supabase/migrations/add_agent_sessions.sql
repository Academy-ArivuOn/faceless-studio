-- Add agent_sessions table for agent chaining context
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id          text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context     jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON public.agent_sessions (user_id);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: user can view own"
  ON public.agent_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sessions: user can insert own"
  ON public.agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions: user can update own"
  ON public.agent_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Add creator DNA columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_voice               text,
  ADD COLUMN IF NOT EXISTS target_audience_description text,
  ADD COLUMN IF NOT EXISTS creator_mode              text DEFAULT 'faceless',
  ADD COLUMN IF NOT EXISTS content_pillars           text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS channel_size              text DEFAULT 'under_1k';