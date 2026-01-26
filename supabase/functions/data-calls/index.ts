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
      .select("id, user_id, tenant_id, expires_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ ok: false, message: "Session not found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < now) {
      return new Response(JSON.stringify({ ok: false, message: "Session expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = session.tenant_id;

    // Parse query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const callId = url.searchParams.get("id");

    // If fetching a single call
    if (callId) {
      const { data: call, error } = await serviceClient
        .from("calls")
        .select("*")
        .eq("id", callId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching call:", error);
        return new Response(JSON.stringify({ ok: false, message: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, call }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build query for calls list
    let query = serviceClient
      .from("calls")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte("started_at", startDate);
    }
    if (endDate) {
      query = query.lte("started_at", endDate);
    }

    const { data: calls, error } = await query;

    if (error) {
      console.error("Error fetching calls:", error);
      return new Response(JSON.stringify({ ok: false, message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, calls: calls || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in data-calls:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
