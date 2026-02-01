import { supabase } from "@/integrations/supabase/client";

/**
 * Verify a reCAPTCHA token with the backend
 */
export async function verifyRecaptcha(token: string): Promise<{ verified: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-recaptcha", {
      body: { token },
    });

    if (error) {
      console.error("reCAPTCHA verification error:", error);
      return { verified: false, error: error.message };
    }

    return { verified: data?.verified ?? false, error: data?.error };
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return { verified: false, error: "Verification request failed" };
  }
}
