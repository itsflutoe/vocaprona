# VocaProna

Free educational speech-game platform for teachers and students.

Teachers create interactive spelling, speaking, listening, and sentence-reading games.  
Students play without accounts.

**Phase 1 (this commit):** project foundation, username-only auth, recovery codes, admin reset, basic teacher dashboard shell.

## Tech stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4
- Backend: Supabase (Auth, PostgreSQL, RLS, Edge Functions)
- Deploy: Vercel + Supabase

## Auth model (same pattern as FLPT)

- Teachers register/login with **username + password only** (no email in the UI).
- Internally Supabase uses `username@vocaprona.app` (never shown to the user).
- Preferred signup path: Edge Function `create-account` with `email_confirm: true`.
- Recovery: one-time recovery code (shown once at registration) **or** admin-assisted reset.
- Service-role key is used **only** inside Edge Functions.

## Quick start

```bash
cp env.example .env
# Edit .env with your Supabase URL and anon key

npm install
npm run dev
```

## Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never put the service-role key in the frontend.

## Supabase setup

1. Create a project at https://supabase.com
2. Authentication → Providers → Email: enable Email, turn **OFF** “Confirm email” (or rely on the Edge Function).
3. Run migrations in order in the SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
4. Deploy Edge Functions:

```bash
supabase functions deploy create-account
supabase functions deploy admin-reset-password
supabase functions deploy recover-with-code
```

5. Promote an admin (after creating a normal account):

```sql
UPDATE public.profiles SET role = 'ADMIN' WHERE username = 'yourusername';
```

Log out and log in again so the JWT/role is refreshed.

## Project structure

```
src/
  components/     # ProtectedRoute, UI
  pages/          # Landing, Login, Register, Recover, Dashboard
  hooks/          # useAuth
  lib/            # supabase client
  services/       # auth
  types/          # shared TypeScript types
supabase/
  migrations/     # schema + RLS
  functions/      # create-account, admin-reset-password, recover-with-code
```

## Phase roadmap

1. **Foundation** (done) — auth, recovery, admin, dashboard shell
2. **Game creation** — wizard, subjects, activity cards, images
3. **Gameplay** — four activity types, speech + TTS, scoring
4. **Sharing & results** — publish links, classroom codes, tracking modes
5. **Remix & launch** — duplicate/remix, PWA, polish, deploy

## Security notes

- Passwords hashed by Supabase Auth.
- Recovery codes stored as SHA-256 hashes only; single-use and rotated.
- Admin password reset requires `profiles.role = 'ADMIN'` checked server-side.
- RLS enforces game ownership; public can only read published + share-enabled games.
- No student accounts; minimize student data collection.

## License

Educational use. Independent product.
