import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/databaseService';
import { User, Mail, Phone, Calendar, Globe, Heart, CheckCircle2, LogOut, Edit3 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout, updateCurrentProfile, isDemoMode } = useAuth();
  const { t, availableLanguages } = useLanguage();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    mobile_number: user?.mobile_number || '',
    age: user?.age || 68,
    preferred_language: user?.preferred_language || 'en',
    caregiver_name: user?.caregiver_name || '',
    caregiver_mobile: user?.caregiver_mobile || '',
  });
  const [saved, setSaved] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);

  const handleSave = async () => {
    await updateCurrentProfile(form);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
          My Profile
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Profile & Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-300 border-3 border-slate-900 flex items-center justify-center font-black text-3xl text-slate-900 shadow-card-solid">
            {user?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{user?.full_name}</h2>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-extrabold bg-teal-100 text-teal-800 border border-teal-300 capitalize">
              {user?.role}
            </span>
            {isDemoMode && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-400">
                Demo Mode
              </span>
            )}
          </div>
        </div>

        {/* Profile Fields */}
        {isEditing ? (
          <div className="space-y-4">
            {[
              { key: 'full_name', label: 'Full Name', type: 'text', icon: User },
              { key: 'mobile_number', label: 'Mobile Number', type: 'tel', icon: Phone },
              { key: 'age', label: 'Age', type: 'number', icon: Calendar },
              { key: 'caregiver_name', label: 'Caregiver Name', type: 'text', icon: Heart },
              { key: 'caregiver_mobile', label: 'Caregiver Mobile', type: 'tel', icon: Phone },
            ].map(({ key, label, type, icon: Icon }) => (
              <div key={key}>
                <label className="block text-sm font-extrabold text-slate-900 mb-1">{label}</label>
                <div className="flex items-center gap-2 border-2 border-slate-900 rounded-2xl px-4 py-3 bg-slate-50 focus-within:ring-2 focus-within:ring-amber-400">
                  <Icon className="w-5 h-5 text-slate-500 shrink-0" />
                  <input
                    type={type}
                    value={String(form[key as keyof typeof form])}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 bg-transparent text-slate-900 font-bold focus:outline-none text-base"
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1">Preferred Language</label>
              <select
                value={form.preferred_language}
                onChange={(e) => setForm((prev) => ({ ...prev, preferred_language: e.target.value }))}
                className="w-full border-2 border-slate-900 rounded-2xl px-4 py-3 text-slate-900 font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.nativeName} ({lang.name})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="flex-1 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-slate-950 shadow-btn-solid active:translate-y-0.5">
                Save Profile
              </button>
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 font-bold text-slate-800">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Email', value: user?.email, icon: Mail },
              { label: 'Mobile', value: user?.mobile_number || 'Not set', icon: Phone },
              { label: 'Age', value: user?.age ? `${user.age} years` : 'Not set', icon: Calendar },
              { label: 'Language', value: availableLanguages.find(l => l.code === user?.preferred_language)?.name || 'English', icon: Globe },
              { label: 'Caregiver', value: user?.caregiver_name || 'Not set', icon: Heart },
              { label: 'Caregiver Mobile', value: user?.caregiver_mobile || 'Not set', icon: Phone },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                <Icon className="w-5 h-5 text-slate-500 shrink-0" />
                <div>
                  <span className="text-xs font-extrabold text-slate-500">{label}</span>
                  <p className="text-base font-extrabold text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 font-extrabold text-slate-900 shadow-sm"
          >
            <Edit3 className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Baseline Calibration Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-200 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950 text-xl shadow-xs">
            🧭
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Activity Baseline Calibration
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Personalized activity difficulty for your daily memory games.
            </p>
          </div>
        </div>

        <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
          Your baseline check ensures daily tasks fit your natural pace comfortably without causing any fatigue or stress.
        </p>

        <button
          onClick={() => setShowBaselineModal(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-slate-950 shadow-btn-solid transition-all active:translate-y-0.5"
        >
          <span>Retake Activity Baseline Check</span>
        </button>
      </div>

      {/* Retake Baseline Confirmation Modal */}
      {showBaselineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-3 border-slate-900 rounded-4xl max-w-md w-full p-6 sm:p-8 shadow-card-solid-lg space-y-5 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-2xl mx-auto">
              🌱
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                Retake Memory Baseline?
              </h3>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                Would you like to try the short memory activity again? This takes only 2 minutes and helps keep your daily exercises comfortable and enjoyable.
              </p>
            </div>

            <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-3 text-xs font-extrabold text-teal-900 text-center">
              🌿 Non-diagnostic • Zero stress • Complete at your own pace
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setShowBaselineModal(false);
                  navigate('/baseline');
                }}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-black text-slate-950 shadow-btn-solid active:translate-y-0.5 text-center"
              >
                Start Baseline Check
              </button>
              <button
                onClick={() => setShowBaselineModal(false)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 font-extrabold text-slate-800 text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Toast */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-100 border-2 border-emerald-600 rounded-2xl text-emerald-950 font-extrabold">
          <CheckCircle2 className="w-6 h-6 text-emerald-700" />
          Profile saved successfully!
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-800 text-rose-900 font-extrabold text-base shadow-sm active:translate-y-0.5"
      >
        <LogOut className="w-5 h-5" />
        <span>Log Out</span>
      </button>

      <p className="text-xs text-slate-500 text-center font-medium">
        Logging out preserves your progress and profile. Your account data is safely stored.
      </p>
    </div>
  );
};
