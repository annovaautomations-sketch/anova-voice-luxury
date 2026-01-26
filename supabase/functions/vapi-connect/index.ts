import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      console.error("Profile error:", profileError);
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
      return new Response(JSON.stringify({ ok: false, message: "Invalid Vapi API key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await vapiResponse.text(); // Consume response body

    console.log("Vapi API key is valid, storing integration...");

    // Use service role to upsert integration (bypass RLS for insert)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
