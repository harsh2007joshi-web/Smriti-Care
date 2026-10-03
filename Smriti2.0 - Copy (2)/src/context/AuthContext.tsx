import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, LocalAuthRecord } from '../types/database.types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { DEMO_USERS } from '../data/mockData';
import { dbService } from '../services/databaseService';
import { otpService, OtpSendResult } from '../services/otpService';

export async function hashPassword(password: string): Promise<string> {
  const trimmed = (password || '').trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (mobile: string, code: string) => Promise<{ success: boolean; error?: string }>;
  sendLoginOtp: (mobile: string) => Promise<OtpSendResult>;
  registerStep1: (name: string, email: string, pass: string, mobile: string) => Promise<OtpSendResult>;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  completeRegistrationProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<void>;
  lastOtpResult: OtpSendResult | null;
  pendingRegistration: {
    fullName: string;
    email: string;
    mobile: string;
    password?: string;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [lastOtpResult, setLastOtpResult] = useState<OtpSendResult | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<{
    fullName: string;
    email: string;
    mobile: string;
    password?: string;
  } | null>(null);

  // Initialize and check existing session
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await dbService.getProfile(session.user.id);
            if (profile) {
              setUser(profile);
              setIsDemoMode(false);
              setIsLoading(false);
              return;
            }
          }
        }

        // Check local persisted session
        const savedSession = localStorage.getItem('smriti_auth_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.profile) {
            setUser(parsed.profile);
            setIsDemoMode(parsed.isDemo || false);
          } else {
            setUser(null);
            setIsDemoMode(false);
          }
        } else {
          // NO SESSION -> Start with no logged in user (Show Landing / Login)
          setUser(null);
          setIsDemoMode(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
        setIsDemoMode(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await dbService.getProfile(session.user.id);
          if (profile) {
            setUser(profile);
            setIsDemoMode(false);
            localStorage.setItem('smriti_auth_session', JSON.stringify({ profile, isDemo: false }));
          }
        } else if (event === 'SIGNED_OUT') {
          if (!isDemoMode) {
            setUser(null);
            localStorage.removeItem('smriti_auth_session');
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // 1. Returning Login: Email & Password (Strictly Verified)
  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!cleanEmail || !cleanPass) {
      setIsLoading(false);
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      // A) Supabase Auth check if configured
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
          if (!error && data?.user) {
            const profile = await dbService.getProfile(data.user.id);
            if (profile) {
              setUser(profile);
              setIsDemoMode(false);
              localStorage.setItem('smriti_auth_session', JSON.stringify({ profile, isDemo: false }));
              setIsLoading(false);
              return { success: true };
            }
          }
        } catch (supErr) {
          console.warn('Supabase email login check bypassed to local:', supErr);
        }
      }

      const inputHash = await hashPassword(cleanPass);

      // B) Check Local Registered Auth Records
      const authRecordsRaw = localStorage.getItem('smriti_local_auth_records');
      if (authRecordsRaw) {
        const authRecords = JSON.parse(authRecordsRaw) as LocalAuthRecord[];
        const record = authRecords.find((r) => r.email.toLowerCase() === cleanEmail);

        if (record) {
          if (record.password_hash === inputHash) {
            const profile = await dbService.getProfile(record.user_id);
            if (profile) {
              setUser(profile);
              setIsDemoMode(false);
              localStorage.setItem('smriti_auth_session', JSON.stringify({ profile, isDemo: false }));
              setIsLoading(false);
              return { success: true };
            }
          } else {
            // Password does not match registered password!
            setIsLoading(false);
            return { success: false, error: 'Invalid email or password.' };
          }
        }
      }

      // C) Check Demo Accounts
      const demoMatch = Object.values(DEMO_USERS).find(
        (u) => u.profile.email.toLowerCase() === cleanEmail
      );

      if (demoMatch) {
        if (cleanPass === demoMatch.passwordHint || cleanPass === 'password123' || cleanPass === 'demo') {
          setUser(demoMatch.profile);
          setIsDemoMode(true);
          localStorage.setItem('smriti_auth_session', JSON.stringify({ profile: demoMatch.profile, isDemo: true }));
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          return { success: false, error: 'Invalid email or password.' };
        }
      }

      // Neither registered account nor demo account matched
      setIsLoading(false);
      return { success: false, error: 'Invalid email or password.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  // 2. Mobile OTP Login
  const sendLoginOtp = async (mobile: string): Promise<OtpSendResult> => {
    setIsLoading(true);
    try {
      const res = await otpService.sendOtp(mobile);
      setLastOtpResult(res);
      setIsLoading(false);
      return res;
    } catch (err: any) {
      setIsLoading(false);
      const errRes: OtpSendResult = {
        success: false,
        message: err?.message || 'Failed to send OTP code.',
        error: err?.message,
      };
      setLastOtpResult(errRes);
      return errRes;
    }
  };

  const loginWithOtp = async (mobile: string, code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const verifyRes = await otpService.verifyOtp(mobile, code);
      if (!verifyRes.verified) {
        setIsLoading(false);
        return { success: false, error: verifyRes.message };
      }

      const cleanDigits = mobile.replace(/\D/g, '');
      const tenDigits = cleanDigits.slice(-10);

      // Check registered users
      const localUsersRaw = localStorage.getItem('smriti_registered_users');
      if (localUsersRaw) {
        const localUsers = JSON.parse(localUsersRaw) as UserProfile[];
        const found = localUsers.find((u) => {
          const userDigits = (u.mobile_number || '').replace(/\D/g, '');
          return userDigits.endsWith(tenDigits) || (u.mobile_number && u.mobile_number.includes(tenDigits));
        });
        if (found) {
          setUser(found);
          setIsDemoMode(false);
          localStorage.setItem('smriti_auth_session', JSON.stringify({ profile: found, isDemo: false }));
          setIsLoading(false);
          return { success: true };
        }
      }

      // Check demo users
      const demoMatch = Object.values(DEMO_USERS).find((u) => {
        const dDigits = (u.profile.mobile_number || '').replace(/\D/g, '');
        return dDigits.endsWith(tenDigits);
      });
      if (demoMatch) {
        setUser(demoMatch.profile);
        setIsDemoMode(true);
        localStorage.setItem('smriti_auth_session', JSON.stringify({ profile: demoMatch.profile, isDemo: true }));
        setIsLoading(false);
        return { success: true };
      }

      // If phone verified but not yet registered, create temporary session profile
      const tempProfile: UserProfile = {
        id: crypto.randomUUID(),
        full_name: 'Verified User',
        email: `user_${tenDigits}@smriti.care`,
        mobile_number: mobile,
        age: 68,
        preferred_language: 'en',
        role: 'patient',
        created_at: new Date().toISOString(),
      };
      setUser(tempProfile);
      setIsDemoMode(false);
      localStorage.setItem('smriti_auth_session', JSON.stringify({ profile: tempProfile, isDemo: false }));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Verification failed' };
    }
  };

  // 3. Registration Step 1 - Initiates registration & sends OTP
  const registerStep1 = async (name: string, email: string, pass: string, mobile: string): Promise<OtpSendResult> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanMobile = (mobile || '').trim();
    const cleanPass = (pass || '').trim();

    // Check if email already registered
    const authRecordsRaw = localStorage.getItem('smriti_local_auth_records');
    if (authRecordsRaw) {
      try {
        const authRecords = JSON.parse(authRecordsRaw) as LocalAuthRecord[];
        if (authRecords.some((r) => r.email.toLowerCase() === cleanEmail)) {
          return {
            success: false,
            message: 'An account with this email already exists. Please sign in.',
            error: 'Email already registered',
          };
        }
      } catch {}
    }

    setPendingRegistration({
      fullName: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      password: cleanPass,
    });

    try {
      const res = await otpService.sendOtp(cleanMobile);
      setLastOtpResult(res);
      return res;
    } catch (err: any) {
      const errRes: OtpSendResult = {
        success: false,
        message: err?.message || 'Failed to send verification code.',
        error: err?.message,
      };
      setLastOtpResult(errRes);
      return errRes;
    }
  };

  // 4. Registration Step 2: OTP Verification
  const verifyOtp = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingRegistration) {
      return { success: false, error: 'No registration in progress. Please enter your details first.' };
    }

    try {
      const res = await otpService.verifyOtp(pendingRegistration.mobile, code);
      if (res.verified) {
        return { success: true };
      }
      return { success: false, error: res.message || 'Incorrect verification code. Please try again.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Verification failed.' };
    }
  };

  // 5. Registration Step 3: Profile Completion & Account Creation
  const completeRegistrationProfile = async (profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!pendingRegistration) {
      return { success: false, error: 'No active registration session found.' };
    }

    const newId = crypto.randomUUID();
    const cleanEmail = pendingRegistration.email.trim().toLowerCase();
    const rawPass = pendingRegistration.password || 'password123';
    const passwordHash = await hashPassword(rawPass);

    const newProfile: UserProfile = {
      id: newId,
      full_name: pendingRegistration.fullName,
      email: cleanEmail,
      mobile_number: pendingRegistration.mobile,
      age: profileData.age || 68,
      preferred_language: profileData.preferred_language || 'en',
      role: 'patient',
      caregiver_name: profileData.caregiver_name || '',
      caregiver_mobile: profileData.caregiver_mobile || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && pendingRegistration.password) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pendingRegistration.password,
          options: {
            data: { full_name: pendingRegistration.fullName, mobile_number: pendingRegistration.mobile },
          },
        });

        if (!authErr && authData.user) {
          newProfile.id = authData.user.id;
        }
      } catch (err) {
        console.warn('Supabase sign up notice:', err);
      }
    }

    // 1. Save LocalAuthRecord for verified email/password login
    const authRecord: LocalAuthRecord = {
      id: crypto.randomUUID(),
      user_id: newProfile.id,
      email: cleanEmail,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };

    const existingAuthRaw = localStorage.getItem('smriti_local_auth_records');
    const existingAuthList: LocalAuthRecord[] = existingAuthRaw ? JSON.parse(existingAuthRaw) : [];
    const filteredAuth = existingAuthList.filter((a) => a.email.toLowerCase() !== cleanEmail);
    filteredAuth.push(authRecord);
    localStorage.setItem('smriti_local_auth_records', JSON.stringify(filteredAuth));

    // 2. Save profile in dbService and local registered list
    await dbService.updateProfile(newProfile);

    const existingUsersRaw = localStorage.getItem('smriti_registered_users');
    const existingList: UserProfile[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];
    const filteredUsers = existingList.filter((u) => u.email.toLowerCase() !== cleanEmail && u.id !== newProfile.id);
    filteredUsers.push(newProfile);
    localStorage.setItem('smriti_registered_users', JSON.stringify(filteredUsers));

    // 3. Initialize garden and streak for the new user
    await dbService.getGardenPlants(newProfile.id);
    await dbService.getStreak(newProfile.id);

    // 4. Set active authenticated session
    setUser(newProfile);
    setIsDemoMode(false);
    localStorage.setItem('smriti_auth_session', JSON.stringify({ profile: newProfile, isDemo: false }));
    setPendingRegistration(null);

    return { success: true };
  };

  // Demo 1-Click Login (Explicit demo entrance)
  const loginAsDemo = (role: UserRole) => {
    const demo = DEMO_USERS[role] || DEMO_USERS.patient;
    setUser(demo.profile);
    setIsDemoMode(true);
    localStorage.setItem('smriti_auth_session', JSON.stringify({ profile: demo.profile, isDemo: true }));
  };

  // Logout (Ends active session ONLY, preserving all registered accounts, data, streaks, and garden)
  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('smriti_auth_session');
  };

  const updateCurrentProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await dbService.updateProfile({ ...user, ...updates });
    setUser(updated);
    localStorage.setItem('smriti_auth_session', JSON.stringify({ profile: updated, isDemo: isDemoMode }));

    // Sync in local registered users array if present
    const localUsersRaw = localStorage.getItem('smriti_registered_users');
    if (localUsersRaw) {
      try {
        const localUsers = JSON.parse(localUsersRaw) as UserProfile[];
        const idx = localUsers.findIndex((u) => u.id === updated.id || u.email.toLowerCase() === updated.email.toLowerCase());
        if (idx !== -1) {
          localUsers[idx] = updated;
          localStorage.setItem('smriti_registered_users', JSON.stringify(localUsers));
        }
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        loginWithEmail,
        loginWithOtp,
        sendLoginOtp,
        registerStep1,
        verifyOtp,
        completeRegistrationProfile,
        loginAsDemo,
        logout,
        updateCurrentProfile,
        lastOtpResult,
        pendingRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

