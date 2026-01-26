import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function parseTimeWindow(windowText: string, timezone: string): Date[] {
  const now = new Date()
  const slots: Date[] = []
  
  // Simple parsing for common phrases
  const lowerText = windowText.toLowerCase()
  let targetDate = new Date(now)
  
  if (lowerText.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1)
  } else if (lowerText.includes('next week')) {
    targetDate.setDate(targetDate.getDate() + 7)
  }
  
  // Determine time of day
  let startHour = 9 // default morning
  let endHour = 17
  
  if (lowerText.includes('morning')) {
    startHour = 9
    endHour = 12
  } else if (lowerText.includes('afternoon')) {
    startHour = 13
    endHour = 17
  } else if (lowerText.includes('evening')) {
    startHour = 17
    endHour = 20
  }
  
  // Generate 3 slots at 15-min intervals
  for (let i = 0; i < 3; i++) {
    const slot = new Date(targetDate)
    slot.setHours(startHour + Math.floor(i / 2), (i % 2) * 30, 0, 0)
    
    // Only add future slots
    if (slot > now) {
      slots.push(slot)
    }
  }
  
  // If we didn't get enough slots, add more
  while (slots.length < 3) {
    const lastSlot = slots[slots.length - 1] || targetDate
    const nextSlot = new Date(lastSlot)
    nextSlot.setMinutes(nextSlot.getMinutes() + 30)
    
    if (nextSlot.getHours() >= 20) {
      nextSlot.setDate(nextSlot.getDate() + 1)
      nextSlot.setHours(9, 0, 0, 0)
    }
    
    if (nextSlot > now) {
      slots.push(nextSlot)
    }
  }
  
  return slots.slice(0, 3)
}

function formatSlotLabel(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
  return date.toLocaleString('en-US', options)
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
    const { tenant_id, window_text, duration_minutes = 15 } = await req.json()

    if (!tenant_id || !window_text) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get tenant timezone
    const { data: tenant } = await supabase
      .from('tenants')
      .select('timezone')
      .eq('id', tenant_id)
      .single()

    const timezone = tenant?.timezone || 'America/Toronto'

    // Parse the time window and generate slots
    const slotDates = parseTimeWindow(window_text, timezone)
    const durationMs = duration_minutes * 60 * 1000

    const slots = slotDates.map(start => {
      const end = new Date(start.getTime() + durationMs)
      return {
        start_iso: start.toISOString(),
        end_iso: end.toISOString(),
        label: formatSlotLabel(start),
      }
    })

    return new Response(
      JSON.stringify({ ok: true, slots }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    console.error('Booking check error:', error)
    const message = error instanceof Error ? error.message : 'Failed to check availability'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
