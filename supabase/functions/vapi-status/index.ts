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
      return new Response(JSON.stringify({ ok: true, connected: false, last_synced_at: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session - simple query without joins
    const { data: session, error: sessionError } = await serviceClient
      .from("sessions")
      .select("id, user_id, tenant_id, expires_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ ok: true, connected: false, last_synced_at: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < now) {
      return new Response(JSON.stringify({ ok: true, connected: false, last_synced_at: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = session.tenant_id;

    // Get Vapi integration status
    const { data: integration } = await serviceClient
      .from("integrations")
      .select("status, last_synced_at")
      .eq("tenant_id", tenantId)
      .eq("provider", "vapi")
      .maybeSingle();

    return new Response(JSON.stringify({
      ok: true,
      connected: integration?.status === "connected",
      last_synced_at: integration?.last_synced_at || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in vapi-status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
