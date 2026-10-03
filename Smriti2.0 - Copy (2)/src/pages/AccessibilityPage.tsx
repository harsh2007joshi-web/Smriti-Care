import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/databaseService';
import { TextSize, TouchMode } from '../types/database.types';
import { SupportedLanguage } from '../types/i18n.types';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { Sliders, Type, Hand, Volume2, Zap, Moon, Globe, CheckCircle2, RefreshCw } from 'lucide-react';

export const AccessibilityPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const {
    textSize, setTextSize,
    touchMode, setTouchMode,
    voiceEnabled, setVoiceEnabled,
    reducedMotion, setReducedMotion,
    calmMode, setCalmMode,
  } = useAccessibility();

  const [saved, setSaved] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);

  const handleSave = async () => {
    if (user?.id) {
      await dbService.savePreferences({
        user_id: user.id,
        text_size: textSize,
        touch_mode: touchMode,
        voice_enabled: voiceEnabled,
        reduced_motion: reducedMotion,
        calm_mode: calmMode,
        language,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const OptionButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    description?: string;
  }> = ({ label, isActive, onClick, description }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 font-extrabold text-sm sm:text-base transition-all ${
        isActive
          ? 'bg-amber-400 border-slate-900 text-slate-950 shadow-card-solid scale-[1.02]'
          : 'bg-white border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-slate-900'
      }`}
    >
      <span>{label}</span>
      {description && <span className="text-[10px] font-medium text-slate-600">{description}</span>}
    </button>
  );

  const ToggleRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    desc: string;
    isOn: boolean;
    onToggle: () => void;
  }> = ({ icon, label, desc, isOn, onToggle }) => (
    <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border-2 border-slate-200">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className="text-base font-extrabold text-slate-900">{label}</h4>
          <p className="text-xs font-medium text-slate-600">{desc}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-14 h-7 rounded-full border-2 border-slate-900 flex items-center transition-all px-0.5 ${
          isOn ? 'bg-amber-400 justify-end' : 'bg-slate-200 justify-start'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <div className="w-5 h-5 rounded-full bg-white border border-slate-400 shadow-sm" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
          Accessibility & Comfort Settings
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          {t('navAccessibility') || 'Accessibility'}
        </h1>
        <p className="text-sm text-slate-600 font-bold mt-0.5">
          Configure SmritiCare for your comfort and preferred style.
        </p>
      </div>

      <VoiceInstructionBar instructionText="Adjust the settings below to make SmritiCare most comfortable for you." />

      {/* Text Size */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center gap-3">
          <Type className="w-6 h-6 text-slate-800" />
          <h3 className="text-lg font-extrabold text-slate-900">{t('textSize') || 'Text Size'}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <OptionButton label="Normal" description="Standard" isActive={textSize === 'normal'} onClick={() => setTextSize('normal')} />
          <OptionButton label="Large" description="Recommended" isActive={textSize === 'large'} onClick={() => setTextSize('large')} />
          <OptionButton label="Extra Large" description="Maximum" isActive={textSize === 'extra_large'} onClick={() => setTextSize('extra_large')} />
        </div>
        <div className={`p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 ${
          textSize === 'normal' ? 'text-base' : textSize === 'large' ? 'text-xl' : 'text-2xl'
        } font-extrabold text-slate-900`}>
          Preview: "Your garden is flourishing."
        </div>
      </div>

      {/* Touch Mode */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center gap-3">
          <Hand className="w-6 h-6 text-slate-800" />
          <h3 className="text-lg font-extrabold text-slate-900">{t('touchTargetSize') || 'Touch Button Size'}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <OptionButton label="Normal" isActive={touchMode === 'normal'} onClick={() => setTouchMode('normal')} />
          <OptionButton label="Large" description="Easier" isActive={touchMode === 'large'} onClick={() => setTouchMode('large')} />
          <OptionButton label="Extra Large" description="Maximum ease" isActive={touchMode === 'extra_large'} onClick={() => setTouchMode('extra_large')} />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Adaptive Touch Mode also enlarges buttons automatically if repeated misses are detected during activities.
        </p>
      </div>

      {/* Language */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-slate-800" />
          <h3 className="text-lg font-extrabold text-slate-900">Preferred Language</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableLanguages.map((lang) => (
            <OptionButton
              key={lang.code}
              label={lang.nativeName}
              description={lang.name}
              isActive={language === lang.code}
              onClick={() => setLanguage(lang.code as SupportedLanguage)}
            />
          ))}
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-3">
        <h3 className="text-lg font-extrabold text-slate-900">Comfort Preferences</h3>

        <ToggleRow
          icon={<Volume2 className="w-5 h-5 text-teal-700" />}
          label={t('voiceNarration') || 'Voice Assistant'}
          desc="Reads activity instructions and feedback aloud."
          isOn={voiceEnabled}
          onToggle={() => setVoiceEnabled(!voiceEnabled)}
        />
        <ToggleRow
          icon={<Zap className="w-5 h-5 text-purple-700" />}
          label={t('reducedMotion') || 'Reduced Animation'}
          desc="Minimizes transitions and animated effects."
          isOn={reducedMotion}
          onToggle={() => setReducedMotion(!reducedMotion)}
        />
        <ToggleRow
          icon={<Moon className="w-5 h-5 text-indigo-700" />}
          label={t('calmMode') || 'Calm Evening Mode'}
          desc="Quieter activities, softer colors, ideal for evenings."
          isOn={calmMode}
          onToggle={() => setCalmMode(!calmMode)}
        />
      </div>

      {/* Activity Baseline Calibration Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-200 border-2 border-slate-900 flex items-center justify-center font-black text-slate-950 text-lg">
            🌱
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Activity Baseline Pace</h3>
            <p className="text-xs text-slate-500 font-bold">Personalizes exercise pacing and difficulty.</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 leading-relaxed">
          Retaking your short baseline calibration lets SmritiCare recalibrate games and memory activities to your current comfort level.
        </p>

        <button
          onClick={() => setShowBaselineModal(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 text-slate-900 font-black text-sm shadow-xs transition-all active:translate-y-0.5"
        >
          <RefreshCw className="w-4 h-4" />
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

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-5 rounded-3xl bg-amber-400 hover:bg-amber-500 border-3 border-slate-900 text-slate-950 font-black text-lg shadow-btn-solid active:translate-y-1 transition-all"
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-emerald-800" />
            <span>Preferences Saved Successfully!</span>
          </>
        ) : (
          <>
            <Sliders className="w-6 h-6" />
            <span>Save My Preferences</span>
          </>
        )}
      </button>
    </div>
  );
};
