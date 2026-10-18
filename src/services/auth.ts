import { supabase } from '@/lib/supabase'

/**
 * Username-only UX (same pattern as FLPT).
 * Supabase still needs an email identity internally:
 *   username → username@vocaprona.app
 *
 * Preferred path: Edge Function `create-account` (email_confirm: true, no email sent).
 * Fallback: client signUp when Confirm email is OFF in Supabase Auth settings.
 */

const AUTH_DOMAIN = 'vocaprona.app'

function toAuthEmail(username: string): string {
  return `${username.toLowerCase().trim()}@${AUTH_DOMAIN}`
}

function cleanUsername(username: string): string {
  return username.toLowerCase().trim()
}

function friendlyAuthError(error: { message?: string; status?: number; code?: string }): Error {
  const msg = (error.message || '').toLowerCase()
  const code = (error.code || '').toLowerCase()

  if (
    msg.includes('already registered') ||
    msg.includes('user already exists') ||
    msg.includes('already been registered') ||
    msg.includes('already taken') ||
    code === 'user_already_exists'
  ) {
    return new Error('That username is already taken. Please choose another.')
  }
  if (
    msg.includes('rate') ||
    msg.includes('email rate') ||
    msg.includes('over_email_send_rate_limit') ||
    code === 'over_email_send_rate_limit'
  ) {
    return new Error(
      'Email confirmation is enabled on this Supabase project, so signup is blocked by email limits. ' +
        'In Supabase Dashboard → Authentication → Providers → Email, turn OFF “Confirm email”, ' +
        'or deploy the create-account Edge Function. Then try once with a new username.'
    )
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || code === 'invalid_credentials') {
    return new Error('Invalid username or password.')
  }
  if (msg.includes('email not confirmed') || code === 'email_not_confirmed') {
    return new Error(
      'This account is waiting for email confirmation. Turn OFF “Confirm email” in Supabase Auth settings, ' +
        'or create the account via the create-account Edge Function.'
    )
  }
  if (msg.includes('email address') && msg.includes('invalid')) {
    return new Error('Username contains invalid characters. Use letters, numbers, and underscores only.')
  }
  if (msg.includes('password')) {
    return new Error(error.message || 'Password does not meet requirements.')
  }
  return new Error(error.message || 'Authentication failed.')
}

export interface SignUpResult {
  session: unknown
  recoveryCode?: string
}

async function createViaEdgeFunction(
  username: string,
  password: string,
  displayName: string
): Promise<{ ok: true; recoveryCode?: string } | { ok: false; reason: 'not_deployed' | 'error'; error?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return { ok: false, reason: 'error', error: 'Missing config' }

  let res: Response
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        username,
        password,
        display_name: displayName,
      }),
    })
  } catch {
    return { ok: false, reason: 'not_deployed' }
  }

  if (res.status === 404 || res.status === 405) {
    return { ok: false, reason: 'not_deployed' }
  }

  let payload: { error?: string; ok?: boolean; recovery_code?: string } = {}
  try {
    payload = await res.json()
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    return { ok: false, reason: 'error', error: payload.error || `Signup failed (${res.status})` }
  }

  return { ok: true, recoveryCode: payload.recovery_code }
}

async function createViaClientSignUp(username: string, password: string, displayName: string) {
  const email = toAuthEmail(username)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  })

  if (error) throw friendlyAuthError(error)

  if (!data.session) {
    throw new Error(
      'Account was created but not signed in because “Confirm email” is enabled in Supabase. ' +
        'Turn OFF Authentication → Providers → Email → Confirm email (recommended for username-only apps), ' +
        'or deploy the create-account Edge Function so accounts are confirmed without email.'
    )
  }

  return data
}

export async function signUp(
  username: string,
  password: string,
  displayName: string
): Promise<SignUpResult> {
  const usernameClean = cleanUsername(username)
  if (!/^[a-z0-9_]{3,30}$/.test(usernameClean)) {
    throw new Error('Username must be 3–30 characters and use only letters, numbers, and underscores.')
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }

  const name = (displayName || usernameClean).trim()

  // 1) Prefer Edge Function (no confirmation email + recovery code)
  const edgeResult = await createViaEdgeFunction(usernameClean, password, name)

  if (edgeResult.ok) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: toAuthEmail(usernameClean),
      password,
    })
    if (error) throw friendlyAuthError(error)
    return { session: data, recoveryCode: edgeResult.recoveryCode }
  }

  if (edgeResult.reason === 'error' && edgeResult.error) {
    throw new Error(edgeResult.error)
  }

  // 2) Fallback: client signUp (requires Confirm email OFF; no recovery code)
  const data = await createViaClientSignUp(usernameClean, password, name)
  return { session: data }
}

export async function signIn(username: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(username),
    password,
  })
  if (error) throw friendlyAuthError(error)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function recoverWithCode(username: string, recoveryCode: string, newPassword: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase configuration.')

  const res = await fetch(`${supabaseUrl}/functions/v1/recover-with-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      username: cleanUsername(username),
      recovery_code: recoveryCode.trim(),
      new_password: newPassword,
    }),
  })

  let payload: { error?: string; ok?: boolean; recovery_code?: string } = {}
  try {
    payload = await res.json()
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    throw new Error(payload.error || `Recovery failed (${res.status})`)
  }

  return {
    ok: true as const,
    newRecoveryCode: payload.recovery_code as string | undefined,
  }
}

export async function updatePassword(newPassword: string) {
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw friendlyAuthError(error)
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
