-- VocaProna Phase 4A: classroom sessions (join codes)

CREATE TABLE IF NOT EXISTS public.classroom_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  join_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_join_code_active
  ON public.classroom_sessions (upper(join_code))
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON public.classroom_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game ON public.classroom_sessions(game_id);

CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.classroom_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON public.session_participants(session_id);

ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Teachers: full access to their sessions
CREATE POLICY "sessions_select_own"
  ON public.classroom_sessions FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY "sessions_insert_own"
  ON public.classroom_sessions FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "sessions_update_own"
  ON public.classroom_sessions FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin())
  WITH CHECK (teacher_id = auth.uid() OR public.is_admin());

-- Anon/authenticated students: read active session by join code (for join flow)
CREATE POLICY "sessions_select_active_anon"
  ON public.classroom_sessions FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Participants: teacher sees their session's roster
CREATE POLICY "participants_select_teacher"
  ON public.session_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_sessions s
      WHERE s.id = session_participants.session_id
        AND (s.teacher_id = auth.uid() OR public.is_admin())
    )
  );

-- Anyone can join (insert) an active session
CREATE POLICY "participants_insert_active"
  ON public.session_participants FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classroom_sessions s
      WHERE s.id = session_participants.session_id
        AND s.status = 'active'
    )
  );

-- Students can read their own session's participant list is optional; skip for privacy
