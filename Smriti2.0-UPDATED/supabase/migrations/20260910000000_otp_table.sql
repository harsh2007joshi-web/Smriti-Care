-- ============================================================
-- REAL SMS OTP SUPPORT
-- Stores one active OTP per mobile number with an expiry.
-- Each user gets their own randomly generated code.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Only one active (unverified, unexpired) OTP row is meaningful per number,
-- but we don't hard-unique it so history/audit rows can pile up harmlessly.
CREATE INDEX IF NOT EXISTS idx_otp_codes_mobile ON public.otp_codes (mobile_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes (expires_at);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- This table is only ever touched by the edge function using the
-- service role key, so no public policies are needed/granted.
-- (No CREATE POLICY here on purpose -> RLS blocks all client access.)
