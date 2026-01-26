import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GoogleTokenInfo {
  sub: string
  email: string
  email_verified: string
  name: string
  picture: string
  aud: string
  exp: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { credential } = await req.json()

    if (!credential) {
      return new Response(JSON.stringify({ error: 'Missing credential' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify Google ID token
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    
    console.log('Verifying Google token...')
    const tokenResponse = await fetch(tokenInfoUrl)
    
    if (!tokenResponse.ok) {
      console.error('Google token verification failed:', tokenResponse.status)
      return new Response(JSON.stringify({ error: 'Invalid Google token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenInfo: GoogleTokenInfo = await tokenResponse.json()
    console.log('Token verified for:', tokenInfo.email)

    // Verify audience matches our client ID
    if (googleClientId && tokenInfo.aud !== googleClientId) {
      console.error('Token audience mismatch')
      return new Response(JSON.stringify({ error: 'Invalid token audience' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user exists by google_sub
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, tenants(*)')
      .eq('google_sub', tokenInfo.sub)
      .maybeSingle()

    let userId: string
    let tenantId: string
    let userProfile: any

    if (existingProfile) {
      // User exists
      userId = existingProfile.user_id
      tenantId = existingProfile.tenant_id
      userProfile = existingProfile
      console.log('Existing user found:', userId)

      // Update profile picture if changed
      if (existingProfile.picture_url !== tokenInfo.picture) {
        await supabase
          .from('user_profiles')
          .update({ picture_url: tokenInfo.picture })
          .eq('id', existingProfile.id)
      }
    } else {
      // New user - create via Supabase Auth first (so trigger creates tenant/profile)
      console.log('Creating new user...')
      
      // Create user in auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: tokenInfo.email,
        email_confirm: true,
        user_metadata: {
          full_name: tokenInfo.name,
          avatar_url: tokenInfo.picture,
          google_sub: tokenInfo.sub,
        },
      })

      if (authError) {
        // User might already exist in auth but not have profile with google_sub
        console.log('Auth error (might be existing):', authError.message)
        
        // Try to find by email
        const { data: profileByEmail } = await supabase
          .from('user_profiles')
          .select('*, tenants(*)')
          .eq('email', tokenInfo.email)
          .maybeSingle()

        if (profileByEmail) {
          // Link google_sub to existing profile
          await supabase
            .from('user_profiles')
            .update({ 
              google_sub: tokenInfo.sub,
              picture_url: tokenInfo.picture 
            })
            .eq('id', profileByEmail.id)

          userId = profileByEmail.user_id
          tenantId = profileByEmail.tenant_id
          userProfile = profileByEmail
        } else {
          throw new Error('Could not create or find user')
        }
      } else {
        userId = authData.user!.id
        
        // Wait briefly for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Fetch the created profile
        const { data: newProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*, tenants(*)')
          .eq('user_id', userId)
          .maybeSingle()

        if (fetchError || !newProfile) {
          console.error('Failed to fetch new profile:', fetchError)
          throw new Error('Profile creation failed')
        }

        // Update profile with google info
        await supabase
          .from('user_profiles')
          .update({ 
            google_sub: tokenInfo.sub,
            picture_url: tokenInfo.picture 
          })
          .eq('id', newProfile.id)

        tenantId = newProfile.tenant_id
        userProfile = newProfile
      }
    }

    // Generate session
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        tenant_id: tenantId,
        expires_at: expiresAt.toISOString(),
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      throw new Error('Failed to create session')
    }

    console.log('Session created:', sessionId)

    // Return session info (cookie will be set by frontend)
    return new Response(
      JSON.stringify({
        ok: true,
        session_id: sessionId,
        expires_at: expiresAt.toISOString(),
        user: {
          id: userId,
          email: tokenInfo.email,
          name: tokenInfo.name,
          picture: tokenInfo.picture,
          role: userProfile.role,
          tenant_id: tenantId,
          tenant_name: userProfile.tenants?.name || 'My Workspace',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    console.error('Auth error:', error)
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
