-- VocaProna RLS policies (Phase 1)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own row; admins can read all
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- No direct insert from client (trigger + Edge Function handle it)
CREATE POLICY "profiles_no_client_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Games: owner full access; published + share_enabled readable by anyone (for student play later)
CREATE POLICY "games_select_owner_or_published"
  ON public.games FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin() OR (status = 'published' AND share_enabled = true));

CREATE POLICY "games_select_anon_published"
  ON public.games FOR SELECT
  TO anon
  USING (status = 'published' AND share_enabled = true);

CREATE POLICY "games_insert_own"
  ON public.games FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "games_update_own"
  ON public.games FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "games_delete_own"
  ON public.games FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());
