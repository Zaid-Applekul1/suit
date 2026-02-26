import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  try {
    // Preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    console.log("Request body:", body);

    const { inviteeEmail, ownerName, farmName, role, invitationToken } = body;

    if (!inviteeEmail || !ownerName || !farmName || !role || !invitationToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const APP_URL = Deno.env.get("APP_URL");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!APP_URL || !RESEND_API_KEY) {
      console.error("Missing env vars", { APP_URL, RESEND_API_KEY });
      return new Response(
        JSON.stringify({ error: "Server misconfiguration (env vars missing)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invitationLink = `${APP_URL}/accept-invitation?token=${invitationToken}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orchard App <onboarding@resend.dev>", // SAFE SENDER
        to: inviteeEmail,
        subject: `${ownerName} invited you to join ${farmName}`,
        html: `
          <h2>You've been invited!</h2>
          <p><strong>${ownerName}</strong> invited you to join <strong>${farmName}</strong> as a <strong>${role}</strong>.</p>
          <p>
            <a href="${invitationLink}"
               style="display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:6px;">
              Accept Invitation
            </a>
          </p>
          <p>This invitation expires in 7 days.</p>
          <p>${invitationLink}</p>
        `,
      }),
    });

    const emailResult = await emailResponse.text();
    console.log("Resend response:", emailResult);

    if (!emailResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Email send failed", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Function crashed:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});