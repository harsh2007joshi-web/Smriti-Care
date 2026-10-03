// Supabase Edge Function: verify-sms-otp
//
// Generates a fresh random 6-digit OTP for EVERY request (so every user /
// every attempt gets a different code), stores it in the `otp_codes` table
// with a 10-minute expiry, and sends it as a real SMS via the 2Factor.in
// OTP API. On verify, checks the stored code against what the user typed.
//
// Required secrets (set with: supabase secrets set KEY=value):
//   SUPABASE_URL               - auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY  - auto-provided by Supabase
//   TWOFACTOR_API_KEY          - your API key from https://2factor.in
//
// If TWOFACTOR_API_KEY is missing, the function falls back to "dev_mock"
// mode: it still generates a real random per-user code and stores it, but
// instead of texting it, it returns the code in the response (clearly
// labelled) so you can keep testing locally before you have SMS credits.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  // Cryptographically random 6-digit code, unique per call -> unique per user.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const code = 100000 + (buf[0] % 900000); // 100000-999999
  return String(code);
}

function normalizeMobile(raw: string): string {
  // Keep a leading + if present, strip everything else non-numeric.
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  return hasPlus ? `+${digits}` : digits;
}

async function sendViaTwoFactor(mobile: string, otp: string, apiKey: string) {
  // 2Factor AUTOGEN2-style endpoint lets us send our OWN pre-generated OTP,
  // rather than letting their service pick the code -- important so we
  // control + store the exact value we verify against.
  // Docs: https://2factor.in/API_KEY/SMS/NUMBER/OTP/OTP_VALUE
  const numberForApi = mobile.replace(/^\+/, ""); // 2Factor expects e.g. 919876543210
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${numberForApi}/${otp}/OTP1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.Status !== "Success") {
    throw new Error(data.Details || "SMS provider rejected the request");
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mobileNumber, action, otpCode } = await req.json();

    if (!mobileNumber || typeof mobileNumber !== "string") {
      return new Response(
        JSON.stringify({ error: "mobileNumber is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    const mobile = normalizeMobile(mobileNumber);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const twoFactorKey = Deno.env.get("TWOFACTOR_API_KEY");

    // -------------------- SEND OTP --------------------
    if (action === "send_otp") {
      const otp = generateOtp(); // <-- unique random code, every single time
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

      const { error: insertErr } = await supabase.from("otp_codes").insert({
        mobile_number: mobile,
        otp_code: otp,
        expires_at: expiresAt,
        attempts: 0,
        max_attempts: MAX_ATTEMPTS,
        verified: false,
      });
      if (insertErr) throw new Error(insertErr.message);

      if (twoFactorKey) {
        await sendViaTwoFactor(mobile, otp, twoFactorKey);
        return new Response(
          JSON.stringify({
            success: true,
            message: `A verification code was sent to ${mobile}.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // No SMS provider configured yet -> dev fallback so you can keep testing.
      console.log(`[DEV MODE - no TWOFACTOR_API_KEY set] OTP for ${mobile} is ${otp}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Dev mode: SMS provider not configured, so no real text was sent.`,
          devNote: `Demo OTP for ${mobile}: ${otp}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------- VERIFY OTP --------------------
    if (action === "verify_otp") {
      if (!otpCode) {
        return new Response(
          JSON.stringify({ error: "otpCode is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: rows, error: fetchErr } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("mobile_number", mobile)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchErr) throw new Error(fetchErr.message);
      const record = rows?.[0];

      if (!record) {
        return new Response(
          JSON.stringify({ success: false, verified: false, message: "No pending OTP found for this number. Request a new code." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(record.expires_at).getTime() < Date.now()) {
        return new Response(
          JSON.stringify({ success: false, verified: false, message: "This code has expired. Request a new one." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (record.attempts >= record.max_attempts) {
        return new Response(
          JSON.stringify({ success: false, verified: false, message: "Too many incorrect attempts. Request a new code." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = record.otp_code === String(otpCode).trim();

      if (isValid) {
        await supabase.from("otp_codes").update({ verified: true }).eq("id", record.id);
      } else {
        await supabase.from("otp_codes").update({ attempts: record.attempts + 1 }).eq("id", record.id);
      }

      return new Response(
        JSON.stringify({
          success: isValid,
          verified: isValid,
          message: isValid ? "Mobile number verified successfully." : "Incorrect OTP code. Please try again.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("verify-sms-otp error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
