/**
 * Google OAuth wrapper module
 * Provides a safe wrapper around the Lovable Cloud OAuth integration
 */

import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

interface OAuthResult {
  error?: Error;
  redirected?: boolean;
}

// Initialize auth with required config object
const lovableAuth = createLovableAuth({});

export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    const result = await lovableAuth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    
    if (result.redirected) {
      return { redirected: true };
    }

    if (result.error) {
      return { error: result.error };
    }

    // Set the Supabase session with the tokens
    try {
      await supabase.auth.setSession(result.tokens);
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
    
    return {};
  } catch (error) {
    console.error("Google OAuth error:", error);
    return {
      error: error instanceof Error ? error : new Error("Failed to initialize Google sign-in"),
    };
  }
}
