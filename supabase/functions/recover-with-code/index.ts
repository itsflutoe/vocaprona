// Recover password using a one-time recovery code.
// Deploy: supabase functions deploy recover-with-code
// Body: { username, recovery_code, new_password }
// Returns a new recovery code after successful use.

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
    const username = String(body.username || '').toLowerCase().trim()
    const recoveryCode = String(body.recovery_code || body.recoveryCode || '').trim()
    const newPassword = String(body.new_password || body.newPassword || '')

    if (!username || !recoveryCode) {
      return json(400, { error: 'Username and recovery code are required.' })
    }
    if (newPassword.length < 8) {
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

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, username, recovery_code_hash')
      .eq('username', username)
      .maybeSingle()

    if (profileError || !profile) {
      return json(400, { error: 'Invalid username or recovery code.' })
    }

    if (!profile.recovery_code_hash) {
      return json(400, { error: 'No recovery code is set for this account. Contact an administrator.' })
    }

    const providedHash = await hashRecoveryCode(recoveryCode)
    if (providedHash !== profile.recovery_code_hash) {
      return json(400, { error: 'Invalid username or recovery code.' })
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    })

    if (updateError) {
      return json(400, { error: updateError.message || 'Could not update password.' })
    }

    const newCode = generateRecoveryCode()
    const newHash = await hashRecoveryCode(newCode)

    await admin
      .from('profiles')
      .update({
        recovery_code_hash: newHash,
        recovery_code_used_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    return json(200, {
      ok: true,
      recovery_code: newCode,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return json(500, { error: message })
  }
})
