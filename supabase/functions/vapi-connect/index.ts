import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get session ID from header (custom auth system)
    const sessionId = req.headers.get("x-session-id");

    if (!sessionId) {
      console.log("No session ID provided");
      return new Response(JSON.stringify({ ok: false, message: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session
    const { data: session, error: sessionError } = await serviceClient
      .from("sessions")
      .select("*, user_profiles(*, tenants(*))")
      .eq("id", sessionId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      console.log("Invalid or expired session:", sessionId);
      return new Response(JSON.stringify({ ok: false, message: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = session.user_profiles;
    if (!profile?.tenant_id) {
      console.error("Profile or tenant not found");
      return new Response(JSON.stringify({ ok: false, message: "User profile not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;

    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return new Response(JSON.stringify({ ok: false, message: "API key is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the API key by calling Vapi API
    console.log("Validating Vapi API key...");
    const vapiResponse = await fetch("https://api.vapi.ai/call?limit=1", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("Vapi validation failed:", vapiResponse.status, errorText);
      return new Response(JSON.stringify({ 
        ok: false, 
        message: `Invalid Vapi API key (${vapiResponse.status})` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await vapiResponse.text(); // Consume response body

    console.log("Vapi API key is valid, storing integration...");

    // Check if integration exists
    const { data: existing } = await serviceClient
      .from("integrations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("provider", "vapi")
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error: updateError } = await serviceClient
        .from("integrations")
        .update({
          api_key_encrypted: apiKey,
          status: "connected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }
    } else {
      // Insert new
      const { error: insertError } = await serviceClient
        .from("integrations")
        .insert({
          tenant_id: tenantId,
          provider: "vapi",
          api_key_encrypted: apiKey,
          status: "connected",
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
    }

    console.log("Vapi integration connected successfully");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in vapi-connect:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
