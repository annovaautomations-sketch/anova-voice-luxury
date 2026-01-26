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
    const { 
      tenant_id, 
      lead_name, 
      lead_phone, 
      lead_email, 
      start_iso, 
      end_iso,
      timezone = 'America/Toronto'
    } = await req.json()

    if (!tenant_id || !lead_name || !lead_phone || !start_iso || !end_iso) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate start time is at least 10 minutes in the future
    const startTime = new Date(start_iso)
    const minTime = new Date(Date.now() + 10 * 60 * 1000)
    
    if (startTime <= minTime) {
      return new Response(
        JSON.stringify({ error: 'Booking must be at least 10 minutes in the future' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate idempotent booking key
    const bookingKey = `book:${lead_phone}:${start_iso}`

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if booking already exists (idempotency)
    const { data: existingBooking } = await supabase
      .from('appointments')
      .select('*')
      .eq('booking_key', bookingKey)
      .maybeSingle()

    if (existingBooking) {
      console.log('Returning existing booking:', bookingKey)
      return new Response(
        JSON.stringify({
          ok: true,
          duplicate: true,
          appointment: {
            id: existingBooking.id,
            start_iso: existingBooking.start_iso,
            end_iso: existingBooking.end_iso,
            status: existingBooking.status,
            lead_name: existingBooking.lead_name,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create new appointment
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        tenant_id,
        booking_key: bookingKey,
        lead_name,
        lead_phone,
        lead_email: lead_email || null,
        start_iso,
        end_iso,
        timezone,
        status: 'booked',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Booking insert error:', insertError)
      throw new Error('Failed to create booking')
    }

    console.log('New booking created:', appointment.id)

    return new Response(
      JSON.stringify({
        ok: true,
        duplicate: false,
        appointment: {
          id: appointment.id,
          start_iso: appointment.start_iso,
          end_iso: appointment.end_iso,
          status: appointment.status,
          lead_name: appointment.lead_name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    console.error('Booking error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create booking'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
