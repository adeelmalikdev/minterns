import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ verified: false, error: "No token provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");

    // If no secret key is configured, skip verification in development
    if (!secretKey) {
      console.warn("RECAPTCHA_SECRET_KEY not configured - skipping verification");
      return new Response(
        JSON.stringify({ verified: true, score: 1.0, warning: "CAPTCHA not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify token with Google
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();

    // For reCAPTCHA v3, score > 0.5 indicates likely human
    // For reCAPTCHA v2, just check success
    const isValid = data.success && (data.score === undefined || data.score > 0.5);

    if (isValid) {
      return new Response(
        JSON.stringify({ verified: true, score: data.score }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: "CAPTCHA verification failed",
        details: data["error-codes"] 
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return new Response(
      JSON.stringify({ verified: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
