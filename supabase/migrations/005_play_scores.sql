-- VocaProna Phase 5: play scores / attempts

CREATE TABLE IF NOT EXISTS public.play_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.classroom_sessions(id) ON DELETE SET NULL,
  player_label TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_cards INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_game ON public.play_attempts(game_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON public.play_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON public.play_attempts(created_at DESC);

ALTER TABLE public.play_attempts ENABLE ROW LEVEL SECURITY;

-- Teachers see attempts for games they own
CREATE POLICY "attempts_select_owner"
  ON public.play_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = play_attempts.game_id
        AND (g.owner_id = auth.uid() OR public.is_admin())
    )
  );

-- Anyone can insert a score for a published game (student play)
CREATE POLICY "attempts_insert_published"
  ON public.play_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = play_attempts.game_id
        AND g.status = 'published'
        AND g.share_enabled = true
        AND g.tracking_mode IN ('anonymous', 'class')
    )
  );

-- Teachers can delete old attempts (retention)
CREATE POLICY "attempts_delete_owner"
  ON public.play_attempts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = play_attempts.game_id
        AND (g.owner_id = auth.uid() OR public.is_admin())
    )
  );
