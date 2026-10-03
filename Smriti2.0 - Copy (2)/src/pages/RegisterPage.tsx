import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle, Smartphone, Sparkles, Check, Copy } from 'lucide-react';

type RegistrationStep = 1 | 2 | 3 | 4;

export const RegisterPage: React.FC = () => {
  const { registerStep1, verifyOtp, completeRegistrationProfile, lastOtpResult } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<RegistrationStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 2 OTP
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 3 Profile
  const [age, setAge] = useState('');
  const [language, setLanguage] = useState('en');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverMobile, setCaregiverMobile] = useState('');

  const LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi / हिन्दी' },
    { code: 'as', name: 'Assamese / অসমীয়া' }, { code: 'bn', name: 'Bengali / বাংলা' },
    { code: 'kha', name: 'Khasi' }, { code: 'lus', name: 'Mizo' },
    { code: 'mni', name: 'Manipuri / মৈতৈলোন্' }, { code: 'nag', name: 'Nagamese' },
  ];

  const handleStep1 = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !mobile.trim()) {
      setError('Please fill in all fields to continue.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setIsLoading(true);
    const res = await registerStep1(fullName, email, password, mobile);
    setIsLoading(false);
    if (res.success) {
      setStep(2);
      setResendCooldown(30);
    } else {
      setError(res.error || res.message || 'Registration failed. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);
    const res = await registerStep1(fullName, email, password, mobile);
    setIsLoading(false);
    if (res.success) {
      setResendCooldown(30);
    } else {
      setError(res.error || res.message || 'Could not resend the code. Please try again.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStep2 = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setIsLoading(true);
    const res = await verifyOtp(otp);
    setIsLoading(false);
    if (res.success) setStep(3);
    else setError(res.error || 'Incorrect code. Please try again.');
  };

  const handleStep3 = async () => {
    setError('');
    setIsLoading(true);
    const res = await completeRegistrationProfile({
      age: parseInt(age) || 68,
      preferred_language: language,
      caregiver_name: caregiverName,
      caregiver_mobile: caregiverMobile,
    });
    setIsLoading(false);
    if (res.success) setStep(4);
    else setError(res.error || 'Profile setup failed. Please try again.');
  };

  const STEPS = [
    { num: 1, label: 'Create Account' },
    { num: 2, label: 'Verify Mobile' },
    { num: 3, label: 'Profile Setup' },
    { num: 4, label: 'All Done!' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 animate-fadeIn">
      {/* Branding */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-400 border-3 border-slate-900 shadow-card-solid">
          <Brain className="w-9 h-9 text-slate-900" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          SmritiCare <span className="text-teal-700">NER</span>
        </h1>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-sm transition-all ${
                step > s.num ? 'bg-emerald-500 text-white' : step === s.num ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-400'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-[10px] font-bold hidden sm:block ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-1 rounded-full transition-all ${step > s.num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-7 sm:p-9 shadow-card-solid-lg space-y-6">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Create Account</h2>
              <p className="text-sm font-bold text-slate-600 mt-0.5">Start your SmritiCare journey today.</p>
            </div>

            {[
              { label: 'Full Name', value: fullName, onChange: setFullName, type: 'text', placeholder: 'Anita Devi' },
              { label: 'Email Address', value: email, onChange: setEmail, type: 'email', placeholder: 'anita@example.in' },
              { label: 'Create Password', value: password, onChange: setPassword, type: 'password', placeholder: 'Min. 6 characters' },
              { label: 'Mobile Number', value: mobile, onChange: setMobile, type: 'tel', placeholder: '+91 98765 43210' },
            ].map(({ label, value, onChange, type, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-extrabold text-slate-900 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold text-base bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Verify Mobile Number</h2>
              <p className="text-sm font-bold text-slate-600 mt-0.5">
                Enter the 6-digit verification code sent to <strong>{mobile}</strong>.
              </p>
            </div>

            {/* Live SMS Status Card */}
            {lastOtpResult?.isRealSmsSent ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Real SMS Dispatched via {lastOtpResult.provider || 'SMS Gateway'}</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  {lastOtpResult.message || `Please check SMS on ${mobile} for your 6-digit code.`}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Live SMS Gateway Status</span>
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  To receive real SMS on your mobile phone, please ensure your <strong>2Factor.in</strong> or <strong>Fast2SMS</strong> API key is saved in <code>.env</code>.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1.5">6-Digit Verification Code</label>
              <input
                type="number"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="Enter 6-digit code from SMS"
                inputMode="numeric"
                className="w-full px-5 py-5 rounded-2xl border-2 border-slate-900 text-slate-900 font-black text-2xl text-center tracking-[0.3em] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || resendCooldown > 0}
                className="text-xs font-bold text-amber-700 underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive a code? Resend SMS"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Your Profile</h2>
              <p className="text-sm font-bold text-slate-600 mt-0.5">Help us personalize your experience.</p>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1.5">Your Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 71"
                min="55" max="100"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold text-base bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1.5">Preferred Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>

            <div className="border-t-2 border-slate-100 pt-4 space-y-4">
              <h3 className="text-base font-extrabold text-slate-800">Caregiver Contact <span className="text-slate-400 font-medium">(Optional)</span></h3>

              <div>
                <label className="block text-sm font-extrabold text-slate-900 mb-1">Caregiver's Full Name</label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  placeholder="e.g. Omprakash Sahoo"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-extrabold text-slate-900 mb-1">Caregiver's Mobile Number</label>
                <input
                  type="tel"
                  value={caregiverMobile}
                  onChange={(e) => setCaregiverMobile(e.target.value)}
                  placeholder="+91 98765 43211"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-900 text-slate-900 font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="space-y-5 text-center">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-400 border-3 border-slate-900 flex items-center justify-center shadow-card-solid">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Your profile is ready!</h2>
              <p className="text-base font-bold text-slate-600 mt-1">
                Welcome to SmritiCare NER, {fullName.split(' ')[0] || 'friend'}.
              </p>
              <p className="text-sm text-slate-500 font-bold mt-2">
                Next, let's complete a short 2-minute memory activity to personalize your game difficulty.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 font-bold text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {step === 1 && (
            <button onClick={handleStep1} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-lg text-slate-950 shadow-btn-solid disabled:opacity-60">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Continue to Verify Mobile</span><ArrowRight className="w-5 h-5" strokeWidth={3} /></>}
            </button>
          )}
          {step === 2 && (
            <>
              <button onClick={handleStep2} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-lg text-slate-950 shadow-btn-solid disabled:opacity-60">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Verify Code</span><ArrowRight className="w-5 h-5" strokeWidth={3} /></>}
              </button>
              <button onClick={() => { setStep(1); setError(''); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 font-bold text-sm text-slate-800">
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button onClick={handleStep3} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-lg text-slate-950 shadow-btn-solid disabled:opacity-60">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Complete My Profile</span><ArrowRight className="w-5 h-5" strokeWidth={3} /></>}
              </button>
              <button onClick={() => { setStep(2); setError(''); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 font-bold text-sm text-slate-800">
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
            </>
          )}
          {step === 4 && (
            <button onClick={() => navigate('/baseline')} className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-lg text-slate-950 shadow-btn-solid">
              <span>Begin Memory Baseline Check</span>
              <ArrowRight className="w-5 h-5" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {step < 4 && (
        <p className="text-sm font-bold text-slate-600 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-700 underline font-extrabold">
            Sign In
          </Link>
        </p>
      )}
    </div>
  );
};
