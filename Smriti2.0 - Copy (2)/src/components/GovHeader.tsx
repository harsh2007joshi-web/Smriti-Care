import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Shield, Sparkles, Moon, Sun, Volume2, VolumeX, UserCheck } from 'lucide-react';
import { UserRole } from '../types/database.types';

export const GovHeader: React.FC = () => {
  const { user, isDemoMode, loginAsDemo } = useAuth();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const { calmMode, setCalmMode, voiceEnabled, setVoiceEnabled } = useAccessibility();

  return (
    <div className="bg-slate-900 text-slate-100 text-xs md:text-sm py-1.5 px-3 md:px-6 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Government Attribution & Prototype Flag */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
            <Shield className="w-3.5 h-3.5" />
            Government of India
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-300 font-medium">
            Ministry of Development of North Eastern Region (MDoNER)
          </span>
          <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border border-amber-400/40">
            SIH 2026 Prototype
          </span>
        </div>

        {/* Accessibility & Quick Switcher Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Calm Evening Mode Toggle */}
          <button
            onClick={() => setCalmMode(!calmMode)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${
              calmMode
                ? 'bg-amber-400 text-slate-900 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Calm Evening Mode"
            aria-label="Toggle Calm Evening Mode"
          >
            {calmMode ? <Moon className="w-3.5 h-3.5 text-slate-900" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden md:inline">{calmMode ? 'Calm Mode ON' : 'Calm Mode'}</span>
          </button>

          {/* Voice Narration Quick Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${
              voiceEnabled
                ? 'bg-teal-900/50 text-teal-300 border-teal-600'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Voice Assistant"
            aria-label="Toggle Voice Assistant"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-teal-300" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{voiceEnabled ? 'Voice ON' : 'Voice Mute'}</span>
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            aria-label="Choose Language"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>

          {/* Quick Role Switcher for Hackathon Evaluation */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            <UserCheck className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Demo Role:</span>
            {(['patient', 'caregiver', 'doctor', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => loginAsDemo(r)}
                className={`text-[11px] px-1.5 py-0.5 rounded capitalize transition-all ${
                  user?.role === r
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
