-- Shared teacher Library + fix: my library must not rely only on broad SELECT

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS listed_in_library BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_games_library
  ON public.games (listed_in_library, subject)
  WHERE listed_in_library = true AND status = 'published';

-- Teachers can see display names of authors who listed a game in the Library
CREATE POLICY "profiles_select_library_authors"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.owner_id = profiles.id
        AND g.listed_in_library = true
        AND g.status = 'published'
    )
  );
