import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// TOTP verification using HMAC-SHA1
async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000 / 30);
  
  // Check current time window and one before/after for clock drift
  for (let i = -1; i <= 1; i++) {
    const generatedCode = await generateTOTP(secret, time + i);
    if (generatedCode === code) {
      return true;
    }
  }
  return false;
}

async function generateTOTP(secret: string, time: number): Promise<string> {
  // Decode base32 secret
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits: number[] = [];
  for (const char of secret.toUpperCase()) {
    const val = base32Chars.indexOf(char);
    if (val === -1) continue;
    for (let i = 4; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }
  
  const keyBytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < keyBytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    keyBytes[i] = byte;
  }

  // Time as 8-byte big-endian
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);

  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, timeBuffer);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[19] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

// Hash code for comparison
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code, action } = await req.json();
    
    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user using getUser
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Get user's 2FA settings
    const { data: twoFaData, error: twoFaError } = await supabase
      .from("user_2fa")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (twoFaError || !twoFaData) {
      return new Response(
        JSON.stringify({ error: "2FA not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try TOTP verification first
    const isValidTOTP = await verifyTOTP(twoFaData.totp_secret, code);
    
    // If TOTP fails, check backup codes
    let usedBackupCode = false;
    if (!isValidTOTP && code.length === 8) {
      const hashedCode = await hashCode(code.toUpperCase());
      const backupCodes = twoFaData.backup_codes as string[];
      const codeIndex = backupCodes.indexOf(hashedCode);
      
      if (codeIndex !== -1) {
        // Remove used backup code
        const newBackupCodes = [...backupCodes];
        newBackupCodes.splice(codeIndex, 1);
        
        await supabase
          .from("user_2fa")
          .update({ backup_codes: newBackupCodes })
          .eq("user_id", userId);
        
        usedBackupCode = true;
      }
    }

    if (!isValidTOTP && !usedBackupCode) {
      return new Response(
        JSON.stringify({ error: "Invalid code", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If this is the enable action, enable 2FA
    if (action === "enable") {
      await supabase
        .from("user_2fa")
        .update({ totp_enabled: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    // If this is the disable action, disable 2FA
    if (action === "disable") {
      await supabase
        .from("user_2fa")
        .update({ 
          totp_enabled: false, 
          totp_secret: null,
          backup_codes: [],
          updated_at: new Date().toISOString() 
        })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({ 
        verified: true, 
        usedBackupCode,
        remainingBackupCodes: usedBackupCode ? (twoFaData.backup_codes as string[]).length - 1 : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("TOTP verify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
