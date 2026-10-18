-- VocaProna Phase 2: activity cards

CREATE TABLE IF NOT EXISTS public.activity_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN (
    'picture_missing_letters',
    'speech',
    'listening',
    'sentence'
  )),
  prompt TEXT,
  image_url TEXT,
  image_alt TEXT,
  target_text TEXT,
  accepted_answers TEXT[] NOT NULL DEFAULT '{}',
  missing_letter_indices INTEGER[],
  hints TEXT[] NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_cards_game ON public.activity_cards(game_id);
CREATE INDEX IF NOT EXISTS idx_activity_cards_order ON public.activity_cards(game_id, order_index);

ALTER TABLE public.activity_cards ENABLE ROW LEVEL SECURITY;

-- Teachers: full access to cards of games they own
CREATE POLICY "cards_select_owner_or_published"
  ON public.activity_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = activity_cards.game_id
        AND (
          g.owner_id = auth.uid()
          OR public.is_admin()
          OR (g.status = 'published' AND g.share_enabled = true)
        )
    )
  );

CREATE POLICY "cards_select_anon_published"
  ON public.activity_cards FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = activity_cards.game_id
        AND g.status = 'published'
        AND g.share_enabled = true
    )
  );

CREATE POLICY "cards_insert_own"
  ON public.activity_cards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = activity_cards.game_id
        AND g.owner_id = auth.uid()
    )
  );

CREATE POLICY "cards_update_own"
  ON public.activity_cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = activity_cards.game_id
        AND (g.owner_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = activity_cards.game_id
        AND (g.owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "cards_delete_own"
  ON public.activity_cards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = activity_cards.game_id
        AND (g.owner_id = auth.uid() OR public.is_admin())
    )
  );

-- Helper: generate a short unique share slug
CREATE OR REPLACE FUNCTION public.generate_share_slug()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
