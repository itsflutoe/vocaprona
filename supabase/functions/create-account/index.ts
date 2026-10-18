// Supabase Edge Function: create teacher account without confirmation email.
// Also generates a recovery code (returned once; only hash is stored).
// Deploy: supabase functions deploy create-account
// Service role stays on the server only.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function generateRecoveryCode(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hashRecoveryCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const body = await req.json()
    const usernameRaw = String(body.username || '')
    const password = String(body.password || '')
    const displayName = String(body.display_name || body.displayName || '').trim()

    const username = usernameRaw.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return json(400, {
        error: 'Username must be 3–30 characters and use only letters, numbers, and underscores.',
      })
    }
    if (password.length < 8) {
      return json(400, { error: 'Password must be at least 8 characters.' })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      return json(500, { error: 'Server configuration error.' })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingProfile) {
      return json(409, { error: 'That username is already taken. Please choose another.' })
    }

    const email = `${username}@vocaprona.app`
    const recoveryCode = generateRecoveryCode()
    const recoveryHash = await hashRecoveryCode(recoveryCode)

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display_name: displayName || username,
      },
    })

    if (createError) {
      const msg = (createError.message || '').toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return json(409, { error: 'That username is already taken. Please choose another.' })
      }
      return json(400, { error: createError.message || 'Could not create account.' })
    }

    if (created.user?.id) {
      await admin.from('profiles').upsert({
        id: created.user.id,
        username,
        display_name: displayName || username,
        role: 'TEACHER',
        recovery_code_hash: recoveryHash,
      })
    }

    return json(200, {
      ok: true,
      user_id: created.user?.id,
      username,
      recovery_code: recoveryCode,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return json(500, { error: message })
  }
})
