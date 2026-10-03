import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database.types';
import { Brain, ArrowRight, Eye, EyeOff, Loader2, UserCheck, Smartphone, Mail, Sparkles, Check, Copy, AlertCircle } from 'lucide-react';

import { cognitiveBaselineService } from '../services/cognitiveBaselineService';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithOtp, sendLoginOtp, loginAsDemo, isLoading, lastOtpResult } = useAuth();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');

  // Email form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP form
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState('');

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const postLoginRedirect = async (userId?: string, role?: string) => {
    if (role && role !== 'patient') {
      if (role === 'caregiver') navigate('/caregiver');
      else if (role === 'admin') navigate('/admin');
      else navigate('/dashboard');
      return;
    }

    if (userId) {
      const hasBaseline = await cognitiveBaselineService.hasBaseline(userId);
      if (!hasBaseline) {
        navigate('/baseline');
        return;
      }
    }
    navigate('/dashboard');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    const result = await loginWithEmail(email, password);
    if (result.success) {
      const sessionRaw = localStorage.getItem('smriti_auth_session');
      const sessionUser = sessionRaw ? JSON.parse(sessionRaw)?.profile : null;
      await postLoginRedirect(sessionUser?.id, sessionUser?.role);
    } else {
      setError(result.error || 'We could not complete the login. Please try again.');
    }
  };

  const handleSendOtp = async () => {
    if (!mobile || mobile.trim().length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }
    setError('');
    const res = await sendLoginOtp(mobile);
    if (res.success) {
      setOtpSent(true);
      setResendCooldown(30);
    } else {
      setError(res.error || res.message || 'Failed to send OTP code.');
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    const result = await loginWithOtp(mobile, otp);
    if (result.success) {
      const sessionRaw = localStorage.getItem('smriti_auth_session');
      const sessionUser = sessionRaw ? JSON.parse(sessionRaw)?.profile : null;
      await postLoginRedirect(sessionUser?.id, sessionUser?.role);
    } else {
      setError(result.error || 'OTP verification failed. Please try again.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDemo = (role: UserRole) => {
    loginAsDemo(role);
    if (role === 'caregiver') navigate('/caregiver');
    else if (role === 'admin') navigate('/admin');
    else navigate('/dashboard');
  };

  const DEMO_ACCOUNTS = [
    { role: 'patient' as UserRole, name: 'Anita Devi', detail: 'Patient, Age 71, Guwahati', color: 'bg-amber-100 border-amber-400 text-amber-950' },
    { role: 'caregiver' as UserRole, name: 'Rohan Sharma', detail: 'Son & Caregiver', color: 'bg-teal-100 border-teal-400 text-teal-950' },
    { role: 'doctor' as UserRole, name: 'Dr. B. K. Barman', detail: 'Neurologist, AIIMS Guwahati', color: 'bg-indigo-100 border-indigo-400 text-indigo-950' },
    { role: 'admin' as UserRole, name: 'MDoNER Coordinator', detail: 'State Admin', color: 'bg-slate-100 border-slate-400 text-slate-950' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 animate-fadeIn">
      {/* Branding Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-400 border-3 border-slate-900 shadow-card-solid">
          <Brain className="w-11 h-11 text-slate-900" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            SmritiCare <span className="text-teal-700">NER</span>
          </h1>
          <p className="text-base font-bold text-slate-600 mt-1">
            "Supporting Memory. Encouraging Independence."
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-7 sm:p-9 shadow-card-solid-lg space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="text-sm font-bold text-slate-600 mt-0.5">Sign in to continue your wellness journey.</p>
        </div>

        {/* Login Method Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-900">
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setError(''); }}
            className={`py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
              loginMethod === 'email' ? 'bg-amber-400 text-slate-950 border-2 border-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" /> Email & Password
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('otp'); setError(''); }}
            className={`py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
              loginMethod === 'otp' ? 'bg-amber-400 text-slate-950 border-2 border-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Mobile OTP
          </button>
        </div>

        {loginMethod === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.in"
                autoComplete="email"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 font-bold text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-950 font-extrabold text-lg shadow-btn-solid active:translate-y-1 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5" strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            {/* Mobile number */}
            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1.5">Mobile Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="flex-1 px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading || resendCooldown > 0}
                  className="px-4 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 border-2 border-slate-900 text-white font-extrabold text-sm whitespace-nowrap shadow-btn-solid disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : resendCooldown > 0 ? `${resendCooldown}s` : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {/* OTP sent alert badge */}
            {otpSent && (
              <div className="space-y-3">
                {lastOtpResult?.isRealSmsSent ? (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                      <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Real SMS Dispatched via {lastOtpResult.provider}</span>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium">
                      {lastOtpResult.message || `Please check SMS on ${mobile} for your 6-digit code.`}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>SMS Gateway Required</span>
                    </div>
                    <p className="text-xs text-amber-900 font-medium">
                      To receive real SMS on your mobile handset, please ensure your <strong>2Factor.in</strong> or <strong>Fast2SMS</strong> API key is saved in <code>.env</code>.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-extrabold text-slate-900 mb-1.5">Enter 6-Digit OTP</label>
                  <input
                    type="number"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    placeholder="Enter 6-digit code from SMS"
                    inputMode="numeric"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-xl text-center tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-950 font-extrabold text-lg shadow-btn-solid active:translate-y-1 transition-all disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Verify OTP & Sign In</span>
                      <ArrowRight className="w-5 h-5" strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 font-bold text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </form>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Link
            to="/register"
            className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 border-2 border-teal-800 text-white font-extrabold text-sm shadow-sm"
          >
            Create Account
          </Link>
          <Link
            to="/register"
            className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 font-bold text-sm"
          >
            New Registration
          </Link>
        </div>
      </div>

      {/* Demo Mode Quick Access */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-700" />
          <h3 className="text-base font-extrabold text-amber-900">Demo Mode</h3>
          <span className="px-2 py-0.5 rounded-full bg-amber-300 text-amber-900 text-[10px] font-black border border-amber-500 uppercase tracking-wider">
            SIH Evaluation
          </span>
        </div>
        <p className="text-xs font-bold text-amber-800">
          Instantly explore the platform without registration. Each button loads a complete demo account.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              onClick={() => handleDemo(acc.role)}
              className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left font-extrabold transition-all hover:scale-[1.02] active:scale-100 ${acc.color}`}
            >
              <span className="capitalize text-sm">{acc.role}</span>
              <span className="text-[12px] font-bold">{acc.name}</span>
              <span className="text-[10px] font-medium opacity-80">{acc.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
