import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit configuration
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  resend: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
};

// In-memory store for rate limiting (resets on function cold start)
// In production, you'd use Redis or a database table
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  action: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = RATE_LIMITS[action];
  const now = Date.now();
  const storeKey = `${action}:${key}`;

  const existing = rateLimitStore.get(storeKey);

  // If no existing record or window has passed, reset
  if (!existing || now > existing.resetAt) {
    const newRecord = { count: 1, resetAt: now + config.windowMs };
    rateLimitStore.set(storeKey, newRecord);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: newRecord.resetAt,
    };
  }

  // Check if limit exceeded
  if (existing.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  // Increment counter
  existing.count += 1;
  rateLimitStore.set(storeKey, existing);

  return {
    allowed: true,
    remaining: config.maxAttempts - existing.count,
    resetAt: existing.resetAt,
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, identifier } = await req.json();

    if (!action || !identifier) {
      return new Response(
        JSON.stringify({ error: "Missing action or identifier" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate action type
    if (!["login", "signup", "resend"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = checkRateLimit(identifier, action as keyof typeof RATE_LIMITS);

    const headers = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.resetAt.toString(),
    };

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: "Too many attempts",
          message: `Too many ${action} attempts. Please try again in ${Math.ceil(
            retryAfter / 60
          )} minutes.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: result.remaining,
        resetAt: result.resetAt,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Rate limit error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
