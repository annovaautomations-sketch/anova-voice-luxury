import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VapiCall {
  id: string;
  type: string;
  status: string;
  phoneNumberId?: string;
  assistantId?: string;
  customer?: {
    number?: string;
  };
  phoneNumber?: {
    number?: string;
  };
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  cost?: number;
  analysis?: {
    summary?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Get user's tenant_id
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile?.tenant_id) {
      return new Response(JSON.stringify({ ok: false, message: "User profile not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const days = body.days || 7;

    // Use service role to read API key
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get Vapi integration
    const { data: integration, error: integrationError } = await serviceClient
      .from("integrations")
      .select("id, api_key_encrypted, status")
      .eq("tenant_id", tenantId)
      .eq("provider", "vapi")
      .maybeSingle();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ ok: false, message: "Vapi not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (integration.status !== "connected" || !integration.api_key_encrypted) {
      return new Response(JSON.stringify({ ok: false, message: "Vapi integration not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = integration.api_key_encrypted;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`Fetching Vapi calls from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch calls from Vapi API with pagination
    let allCalls: VapiCall[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
      const url = new URL("https://api.vapi.ai/call");
      url.searchParams.set("limit", "100");
      url.searchParams.set("createdAtGe", startDate.toISOString());
      url.searchParams.set("createdAtLe", endDate.toISOString());
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vapi API error:", response.status, errorText);
        return new Response(JSON.stringify({ ok: false, message: "Failed to fetch calls from Vapi" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const calls = Array.isArray(data) ? data : data.data || [];
      allCalls = allCalls.concat(calls);

      // Check for pagination
      if (data.nextCursor) {
        cursor = data.nextCursor;
      } else {
        hasMore = false;
      }

      // Safety limit
      if (allCalls.length >= 1000) {
        hasMore = false;
      }
    }

    console.log(`Fetched ${allCalls.length} calls from Vapi`);

    let inserted = 0;
    let updated = 0;

    // Process each call
    for (const call of allCalls) {
      const startedAt = call.startedAt ? new Date(call.startedAt) : null;
      const endedAt = call.endedAt ? new Date(call.endedAt) : null;
      const durationSec = startedAt && endedAt 
        ? Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
        : null;

      // Determine direction based on call type
      const direction = call.type === "inboundPhoneCall" ? "inbound" : "outbound";

      // Determine from/to numbers
      const fromNumber = direction === "inbound" 
        ? call.customer?.number 
        : call.phoneNumber?.number;
      const toNumber = direction === "inbound"
        ? call.phoneNumber?.number
        : call.customer?.number;

      // Map Vapi status to our status enum
      let status: string = call.status || "ended";
      const validStatuses = ["queued", "ringing", "in-progress", "forwarding", "ended"];
      if (!validStatuses.includes(status)) {
        status = "ended";
      }

      const callData = {
        tenant_id: tenantId,
        vapi_call_id: call.id,
        direction,
        from_e164: fromNumber || null,
        to_e164: toNumber || null,
        started_at: call.startedAt || null,
        ended_at: call.endedAt || null,
        duration_sec: durationSec,
        status,
        transcript_text: call.transcript || null,
        summary: call.analysis?.summary || call.summary || null,
        recording_url: call.recordingUrl || null,
        cost_total: call.cost || null,
        extracted_json: call,
        updated_at: new Date().toISOString(),
      };

      // Check if call exists
      const { data: existingCall } = await serviceClient
        .from("calls")
        .select("id")
        .eq("vapi_call_id", call.id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existingCall) {
        // Update
        const { error } = await serviceClient
          .from("calls")
          .update(callData)
          .eq("id", existingCall.id);

        if (error) {
          console.error("Error updating call:", error);
        } else {
          updated++;
        }
      } else {
        // Insert
        const { error } = await serviceClient
          .from("calls")
          .insert(callData);

        if (error) {
          console.error("Error inserting call:", error);
        } else {
          inserted++;
        }
      }
    }

    // Update last_synced_at
    await serviceClient
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integration.id);

    console.log(`Sync complete: ${inserted} inserted, ${updated} updated`);

    return new Response(JSON.stringify({ ok: true, inserted, updated, total: allCalls.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in vapi-sync-calls:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
