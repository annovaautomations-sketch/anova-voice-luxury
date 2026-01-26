import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-anova-secret',
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
    const webhookSecret = req.headers.get('x-anova-secret')
    
    if (!webhookSecret) {
      console.error('Missing webhook secret')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json()
    console.log('Vapi webhook received:', payload.message?.type || payload.type)

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find integration by webhook secret
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('tenant_id')
      .eq('provider', 'vapi')
      .eq('webhook_secret_encrypted', webhookSecret)
      .eq('status', 'connected')
      .maybeSingle()

    if (intError || !integration) {
      console.error('Invalid webhook secret or integration not found')
      return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tenantId = integration.tenant_id
    
    // Extract call data from Vapi payload
    const message = payload.message || payload
    const callData = message.call || {}
    const vapiCallId = callData.id || message.call_id

    if (!vapiCallId) {
      console.log('No call ID in payload, acknowledging')
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine call status and outcome
    let status = 'queued'
    let outcome = null
    
    switch (message.type) {
      case 'call-started':
        status = 'in-progress'
        break
      case 'call-ended':
        status = 'ended'
        // Try to determine outcome from analysis
        if (message.analysis?.successEvaluation === 'true') {
          outcome = 'booked'
        } else if (message.analysis?.structuredData?.qualified === true) {
          outcome = 'qualified'
        } else if (message.analysis?.structuredData?.qualified === false) {
          outcome = 'not_qualified'
        }
        break
      case 'status-update':
        status = callData.status || 'in-progress'
        break
    }

    // Upsert call record
    const { error: upsertError } = await supabase
      .from('calls')
      .upsert({
        vapi_call_id: vapiCallId,
        tenant_id: tenantId,
        direction: callData.type === 'inboundPhoneCall' ? 'inbound' : 'outbound',
        status: status,
        outcome: outcome,
        from_e164: callData.customer?.number || null,
        to_e164: callData.phoneNumber?.number || null,
        started_at: callData.startedAt || null,
        ended_at: callData.endedAt || null,
        duration_sec: callData.duration ? Math.round(callData.duration) : null,
        transcript_text: message.transcript || callData.transcript || null,
        recording_url: callData.recordingUrl || message.recordingUrl || null,
        summary: message.summary || message.analysis?.summary || null,
        cost_total: callData.cost || message.cost || null,
        extracted_json: message.analysis?.structuredData || {},
      }, {
        onConflict: 'vapi_call_id',
      })

    if (upsertError) {
      console.error('Call upsert error:', upsertError)
    } else {
      console.log('Call upserted:', vapiCallId)
    }

    // Store call event for audit
    await supabase
      .from('call_events')
      .insert({
        tenant_id: tenantId,
        vapi_call_id: vapiCallId,
        type: message.type || 'unknown',
        payload_json: payload,
      })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Webhook error:', error)
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
