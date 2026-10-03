import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface OtpSendResult {
  success: boolean;
  message: string;
  provider?: string;
  isRealSmsSent?: boolean;
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  verified: boolean;
  message: string;
  error?: string;
}

interface StoredOtpRecord {
  id: string;
  mobileNumber: string;
  otpCode: string;
  expiresAt: number; // unix timestamp ms
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  createdAt: number;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const STORAGE_PREFIX = 'smriti_otp_records';

class OtpService {
  /**
   * Generates a cryptographically random 6-digit OTP
   */
  generateOtp(): string {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const code = 100000 + (buf[0] % 900000);
    return String(code);
  }

  /**
   * Normalizes mobile numbers to clean formats
   */
  normalizeMobile(raw: string): { raw: string; digits: string; e164: string; tenDigits: string; for2Factor: string } {
    const trimmed = (raw || '').trim();
    const digits = trimmed.replace(/\D/g, '');
    
    // Extract last 10 digits for Indian standard numbers if applicable
    const tenDigits = digits.length >= 10 ? digits.slice(-10) : digits;
    
    // Format for 2Factor (India requires 91 prefix without plus, e.g. 919136274875)
    const for2Factor = digits.length === 10 ? `91${digits}` : (digits.startsWith('91') && digits.length === 12 ? digits : `91${tenDigits}`);
    
    // Standard international format E.164
    const e164 = trimmed.startsWith('+') ? `+${digits}` : (digits.length === 10 ? `+91${digits}` : `+${digits}`);

    return { raw: trimmed, digits, e164, tenDigits, for2Factor };
  }

  /**
   * Gets configured SMS Gateway API keys from localStorage or environment variables
   */
  getSmsConfig(): { twoFactorKey: string; fast2smsKey: string } {
    const twoFactorKey = localStorage.getItem('smriti_twofactor_key') || import.meta.env.VITE_TWOFACTOR_API_KEY || '';
    const fast2smsKey = localStorage.getItem('smriti_fast2sms_key') || import.meta.env.VITE_FAST2SMS_API_KEY || '';
    return {
      twoFactorKey: twoFactorKey.trim(),
      fast2smsKey: fast2smsKey.trim(),
    };
  }

  /**
   * Saves custom SMS Gateway Key to localStorage
   */
  saveSmsConfig(provider: '2factor' | 'fast2sms', apiKey: string): void {
    if (provider === '2factor') {
      localStorage.setItem('smriti_twofactor_key', apiKey.trim());
    } else if (provider === 'fast2sms') {
      localStorage.setItem('smriti_fast2sms_key', apiKey.trim());
    }
  }

  /**
   * Dispatches OTP via 2Factor.in SMS API
   */
  private async sendVia2Factor(mobileFor2Factor: string, otp: string, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      // 2Factor requires appending the pre-approved DLT template 'OTP1' to deliver as text SMS rather than voice call
      const urls = [
        `/api/2factor/API/V1/${apiKey}/SMS/${mobileFor2Factor}/${otp}/OTP1`,
        `https://2factor.in/API/V1/${apiKey}/SMS/${mobileFor2Factor}/${otp}/OTP1`,
        `/api/2factor/API/V1/${apiKey}/SMS/${mobileFor2Factor}/${otp}`,
        `https://2factor.in/API/V1/${apiKey}/SMS/${mobileFor2Factor}/${otp}`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            if (data.Status === 'Success') {
              return { success: true, message: data.Details || 'SMS sent via 2Factor.in' };
            } else {
              return { success: false, message: data.Details || '2Factor gateway error' };
            }
          }
        } catch {
          // continue to next URL
        }
      }
      return { success: false, message: 'Could not connect to 2Factor SMS gateway' };
    } catch (err: any) {
      return { success: false, message: err?.message || '2Factor SMS dispatch failed' };
    }
  }

  /**
   * Dispatches OTP via Fast2SMS API
   */
  private async sendViaFast2SMS(tenDigits: string, otp: string, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const urls = [
        '/api/fast2sms/dev/bulkV2',
        'https://www.fast2sms.com/dev/bulkV2',
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authorization': apiKey,
            },
            body: JSON.stringify({
              route: 'otp',
              variables_values: otp,
              numbers: tenDigits,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.return === true || data.status_code === 200) {
              return { success: true, message: data.message?.[0] || 'SMS sent via Fast2SMS' };
            } else {
              return { success: false, message: data.message?.[0] || 'Fast2SMS rejected the request' };
            }
          }
        } catch {
          // continue to next URL
        }
      }
      return { success: false, message: 'Could not connect to Fast2SMS gateway' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Fast2SMS dispatch failed' };
    }
  }

  /**
   * Saves OTP record in local storage for secure verification
   */
  private saveOtpLocally(record: StoredOtpRecord): void {
    try {
      const allRaw = localStorage.getItem(STORAGE_PREFIX);
      const all: StoredOtpRecord[] = allRaw ? JSON.parse(allRaw) : [];
      const filtered = all.filter((r) => r.mobileNumber !== record.mobileNumber);
      filtered.unshift(record);
      localStorage.setItem(STORAGE_PREFIX, JSON.stringify(filtered.slice(0, 20)));
    } catch (e) {
      console.warn('Could not save OTP locally:', e);
    }
  }

  /**
   * Retrieves active OTP record for a mobile number
   */
  private getOtpLocally(normalizedMobile: string): StoredOtpRecord | null {
    try {
      const allRaw = localStorage.getItem(STORAGE_PREFIX);
      if (!allRaw) return null;
      const all: StoredOtpRecord[] = JSON.parse(allRaw);
      const found = all.find((r) => r.mobileNumber === normalizedMobile && !r.verified);
      return found || null;
    } catch (e) {
      console.warn('Could not read local OTP:', e);
      return null;
    }
  }

  /**
   * Sends real OTP to a given mobile number
   */
  async sendOtp(rawMobile: string): Promise<OtpSendResult> {
    if (!rawMobile || !rawMobile.trim()) {
      return { success: false, message: 'Please enter a valid mobile number.', error: 'Mobile number is required' };
    }

    const { digits, e164, tenDigits, for2Factor } = this.normalizeMobile(rawMobile);
    if (digits.length < 8) {
      return { success: false, message: 'Please enter a valid mobile number with at least 8 digits.', error: 'Invalid mobile number' };
    }

    const otp = this.generateOtp();
    const now = Date.now();
    const record: StoredOtpRecord = {
      id: crypto.randomUUID(),
      mobileNumber: e164,
      otpCode: otp,
      createdAt: now,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      verified: false,
    };

    // Store for strict verification
    this.saveOtpLocally(record);
    if (e164 !== digits) {
      this.saveOtpLocally({ ...record, mobileNumber: digits });
    }
    if (tenDigits !== digits) {
      this.saveOtpLocally({ ...record, mobileNumber: tenDigits });
    }

    // Check for configured API keys
    const { twoFactorKey, fast2smsKey } = this.getSmsConfig();

    // 1. Try 2Factor.in if key is configured
    if (twoFactorKey && twoFactorKey !== 'your_2factor_api_key_here') {
      const result = await this.sendVia2Factor(for2Factor, otp, twoFactorKey);
      if (result.success) {
        return {
          success: true,
          message: `A verification SMS with your 6-digit OTP was sent to ${e164} via 2Factor.in.`,
          isRealSmsSent: true,
          provider: '2Factor.in',
        };
      } else {
        return {
          success: false,
          message: `2Factor SMS Gateway Error: ${result.message}`,
          isRealSmsSent: false,
          error: result.message,
        };
      }
    }

    // 2. Try Fast2SMS if key is configured
    if (fast2smsKey && fast2smsKey !== 'your_fast2sms_api_key_here') {
      const result = await this.sendViaFast2SMS(tenDigits, otp, fast2smsKey);
      if (result.success) {
        return {
          success: true,
          message: `A verification SMS with your 6-digit OTP was sent to ${e164} via Fast2SMS.`,
          isRealSmsSent: true,
          provider: 'Fast2SMS',
        };
      } else {
        return {
          success: false,
          message: `Fast2SMS Gateway Error: ${result.message}`,
          isRealSmsSent: false,
          error: result.message,
        };
      }
    }

    // 3. Try Supabase Edge Function if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-sms-otp', {
          body: { mobileNumber: e164, action: 'send_otp' },
        });
        if (!error && data?.success && !data?.devNote) {
          return {
            success: true,
            message: data.message || `A verification code was sent to ${e164}.`,
            isRealSmsSent: true,
            provider: 'Supabase SMS',
          };
        }
      } catch {
        // Continue to fallback notice
      }
    }

    // 4. No SMS Gateway configured
    return {
      success: true,
      message: `SMS sent request registered for ${e164}.`,
      isRealSmsSent: false,
      provider: 'Pending Gateway Configuration',
    };
  }

  /**
   * Verifies the user-entered OTP code against the strictly generated code
   * (No backdoor codes like 123456 or 999888 are allowed)
   */
  async verifyOtp(rawMobile: string, userCode: string): Promise<OtpVerifyResult> {
    if (!userCode || !userCode.trim()) {
      return { success: false, verified: false, message: 'Please enter the 6-digit verification code.', error: 'Missing code' };
    }

    const cleanCode = userCode.trim();
    const { digits, e164, tenDigits } = this.normalizeMobile(rawMobile);

    // Retrieve active OTP record (Check E.164, full digits, or 10 digits)
    const record = this.getOtpLocally(e164) || this.getOtpLocally(digits) || this.getOtpLocally(tenDigits);

    if (!record) {
      return {
        success: false,
        verified: false,
        message: 'No pending OTP found for this mobile number. Please request a code first.',
        error: 'No active OTP',
      };
    }

    if (Date.now() > record.expiresAt) {
      return {
        success: false,
        verified: false,
        message: 'This verification code has expired (10-minute limit). Please request a new code.',
        error: 'OTP expired',
      };
    }

    if (record.attempts >= record.maxAttempts) {
      return {
        success: false,
        verified: false,
        message: 'Too many incorrect attempts. Please request a new code.',
        error: 'Max attempts exceeded',
      };
    }

    // Strict comparison: user must enter the exact code generated and sent
    if (record.otpCode === cleanCode) {
      record.verified = true;
      this.saveOtpLocally(record);
      return {
        success: true,
        verified: true,
        message: 'Mobile number verified successfully!',
      };
    } else {
      record.attempts += 1;
      this.saveOtpLocally(record);
      const remaining = record.maxAttempts - record.attempts;
      const attemptMsg = remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.';
      return {
        success: false,
        verified: false,
        message: `Incorrect verification code. ${attemptMsg}`,
        error: 'Invalid code',
      };
    }
  }
}

export const otpService = new OtpService();
