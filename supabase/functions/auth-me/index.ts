import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Get session ID from header (cookie parsing not reliable in edge functions)
    const sessionId = req.headers.get('x-session-id')

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'No session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, user_profiles(*, tenants(*))')
      .eq('id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sessionError || !session) {
      console.log('Invalid or expired session:', sessionId)
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const profile = session.user_profiles
    const tenant = profile?.tenants

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: session.user_id,
          email: profile?.email,
          name: profile?.display_name,
          picture: profile?.picture_url,
          role: profile?.role,
          tenant_id: session.tenant_id,
          tenant_name: tenant?.name || 'My Workspace',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Auth me error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to validate session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
