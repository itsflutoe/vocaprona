-- Allow teachers to delete their own classroom sessions
CREATE POLICY "sessions_delete_own"
  ON public.classroom_sessions FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());

-- Participants cascade via FK ON DELETE CASCADE from 004
