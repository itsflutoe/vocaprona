-- Optional display name for classroom sessions
ALTER TABLE public.classroom_sessions
  ADD COLUMN IF NOT EXISTS title TEXT;
