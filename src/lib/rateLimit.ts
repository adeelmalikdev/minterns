import { supabase } from "@/integrations/supabase/client";

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: number;
  error?: string;
  retryAfter?: number;
}

export async function checkRateLimit(
  action: "login" | "signup" | "resend",
  identifier: string
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke("rate-limit", {
      body: { action, identifier },
    });

    if (error) {
      // If rate limit function fails, allow the request to proceed
      // (fail open to prevent blocking users due to function errors)
      console.warn("Rate limit check failed:", error);
      return { allowed: true };
    }

    return data as RateLimitResult;
  } catch (error) {
    console.error("Rate limit error:", error);
    return { allowed: true };
  }
}

export function getRateLimitMessage(action: string, retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60);
  
  const messages: Record<string, string> = {
    login: `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    signup: `Too many signup attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    resend: `Too many verification email requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
  };

  return messages[action] || `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
}
