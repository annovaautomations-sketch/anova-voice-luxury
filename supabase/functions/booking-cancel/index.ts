import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { tenant_id, lead_phone } = await req.json()

    if (!tenant_id || !lead_phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find latest upcoming appointment for this lead
    const { data: appointment, error: findError } = await supabase
      .from('appointments')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('lead_phone', lead_phone)
      .gt('start_iso', new Date().toISOString())
      .in('status', ['booked', 'rescheduled'])
      .order('start_iso', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (findError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'No upcoming appointment found for this lead' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Cancel the appointment
    const { data: cancelled, error: cancelError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment.id)
      .select()
      .single()

    if (cancelError) {
      console.error('Cancel error:', cancelError)
      throw new Error('Failed to cancel appointment')
    }

    console.log('Appointment cancelled:', cancelled.id)

    return new Response(
      JSON.stringify({
        ok: true,
        appointment: {
          id: cancelled.id,
          status: cancelled.status,
          lead_name: cancelled.lead_name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    console.error('Cancel error:', error)
    const message = error instanceof Error ? error.message : 'Failed to cancel'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
