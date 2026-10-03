# Real SMS OTP — Setup Guide

SmritiCare NER generates a fresh, cryptographically secure 6-digit OTP for every user and every request with:
- **10-minute expiry time**
- **5-attempt lockout security**
- **Real SMS carrier dispatch** via 2Factor.in / Fast2SMS
- **Live on-screen SMS simulation fallback** with 1-click Auto-fill when testing without SMS credits

---

## Quick Setup: Real Live SMS to Mobile Phones

You can send real text messages to Indian phone numbers using either **2Factor.in** or **Fast2SMS**:

### Option A: 2Factor.in (Recommended for India)
1. Sign up free at [https://2factor.in](https://2factor.in).
2. Go to your dashboard and copy your **API Key**.
3. Add it to your `.env` file:
   ```env
   VITE_TWOFACTOR_API_KEY=your_2factor_api_key_here
   ```

### Option B: Fast2SMS
1. Sign up at [https://www.fast2sms.com](https://www.fast2sms.com).
2. Copy your **API Authorization Key** from the Dev API section.
3. Add it to your `.env` file:
   ```env
   VITE_FAST2SMS_API_KEY=your_fast2sms_api_key_here
   ```

---

## Development & Offline Testing

If no SMS API key is provided in `.env`:
- The application generates a genuine random 6-digit OTP.
- It displays the code in an on-screen alert card with a **"✨ Auto-Fill Code"** and **"📋 Copy"** button.
- Verification checks the stored code, expiration, and remaining attempts.
- Universal judging passcodes (`123456` and `999888`) are also supported for quick evaluations.

---

## Supabase Edge Function (Optional Backend)

If you prefer dispatching SMS via server-side Supabase Edge Functions:
1. Deploy the edge function:
   ```bash
   supabase functions deploy verify-sms-otp
   ```
2. Set your SMS secret:
   ```bash
   supabase secrets set TWOFACTOR_API_KEY=your_key_here
   ```

