import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/databaseService';
import { SafetySettings } from '../types/database.types';
import { VoiceInstructionBar } from '../components/VoiceInstructionBar';
import { ShieldAlert, MapPin, Phone, AlertCircle, CheckCircle2, ShieldCheck, Navigation } from 'lucide-react';

export const SafetyBeaconPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { voiceEnabled } = useAccessibility();

  const [settings, setSettings] = useState<SafetySettings>({
    user_id: user?.id || '',
    safe_zone_enabled: true,
    orientation_alert_enabled: true,
    caregiver_alert_enabled: true,
  });

  const [simulatedAlert, setSimulatedAlert] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      dbService.getSafetySettings(user.id).then((s) => {
        if (s) setSettings(s);
      });
    }
  }, [user]);

  const handleToggle = async (key: keyof SafetySettings) => {
    if (key === 'user_id') return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    if (user?.id) {
      await dbService.saveSafetySettings(updated);
    }
  };

  const simulatePing = () => {
    setSimulatedAlert(`Safe Zone Check: ${user?.full_name || 'Patient'} is currently within the registered home safe zone. Last update: ${new Date().toLocaleTimeString()}.`);
    setTimeout(() => setSimulatedAlert(null), 6000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-300">
          Safety Assistance Prototype
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          {t('safetyBeaconTitle') || 'Safety Beacon'}
        </h1>
        <p className="text-sm text-slate-600 font-bold mt-0.5">
          A prototype safety assistance overview for caregivers and patients.
        </p>
      </div>

      <VoiceInstructionBar instructionText="Your Safety Beacon keeps your care team informed and helps you stay comfortably oriented." />

      {/* Status Card */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 sm:p-8 shadow-card-solid-lg space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-400 border-2 border-slate-900 flex items-center justify-center shadow-card-solid">
            <ShieldCheck className="w-9 h-9 text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {t('safetyStatusActive') || 'Active & Protected'}
            </h2>
            <p className="text-sm font-bold text-emerald-700">
              All safety systems are active and monitoring.
            </p>
          </div>
        </div>

        {/* Safety Feature Toggles */}
        <div className="space-y-3 pt-2">
          {[
            {
              key: 'safe_zone_enabled' as const,
              label: t('safeZone') || 'Safe Home Zone',
              desc: 'Monitors whether you are within your registered safe home area.',
              icon: MapPin,
              color: 'text-emerald-700',
            },
            {
              key: 'orientation_alert_enabled' as const,
              label: 'Orientation Support',
              desc: 'Provides gentle reminders and familiar cues when needed.',
              icon: Navigation,
              color: 'text-sky-700',
            },
            {
              key: 'caregiver_alert_enabled' as const,
              label: t('caregiverConnected') || 'Caregiver Connected',
              desc: 'Your primary caregiver receives wellness activity summaries.',
              icon: Phone,
              color: 'text-rose-700',
            },
          ].map((item) => {
            const Icon = item.icon;
            const isOn = settings[item.key] as boolean;
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                  isOn ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-6 h-6 ${isOn ? item.color : 'text-slate-400'}`} />
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{item.label}</h4>
                    <p className="text-xs font-medium text-slate-600">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`w-14 h-7 rounded-full border-2 border-slate-900 flex items-center transition-all px-0.5 ${
                    isOn ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'
                  }`}
                  aria-label={`Toggle ${item.label}`}
                >
                  <div className="w-5 h-5 rounded-full bg-white border border-slate-400 shadow-sm" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Panel */}
      <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-card-solid space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-extrabold text-slate-900">
            Safety Simulation Panel
          </h3>
        </div>
        <p className="text-sm font-medium text-slate-600">
          For prototype demonstration purposes. Real GPS and telephony require production integration.
        </p>

        {simulatedAlert && (
          <div className="p-4 bg-emerald-100 border-2 border-emerald-600 rounded-2xl text-emerald-950 font-extrabold text-sm animate-pulse">
            ✅ {simulatedAlert}
          </div>
        )}

        <button
          onClick={simulatePing}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-950 font-extrabold text-base shadow-btn-solid active:translate-y-0.5"
        >
          <ShieldAlert className="w-5 h-5" />
          <span>Simulate Safe Zone Check</span>
        </button>

        {user?.caregiver_name ? (
          <a
            href={`tel:${user.caregiver_mobile || '+91 98765 43211'}`}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-800 text-rose-950 font-extrabold text-base shadow-sm active:translate-y-0.5"
          >
            <Phone className="w-5 h-5 text-rose-700" />
            <span>{t('callCaregiver') || 'Call Caregiver'}: {user.caregiver_name}</span>
          </a>
        ) : (
          <a
            href="/care-circle"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-400 text-slate-800 font-extrabold text-base shadow-sm active:translate-y-0.5"
          >
            <Phone className="w-5 h-5 text-slate-600" />
            <span>Set Primary Caregiver in Care Circle</span>
          </a>
        )}
      </div>

      <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-amber-900 font-semibold text-sm">
        <strong>Prototype Limitation:</strong> Real-time GPS location tracking, cellular telephony, and live SMS alerts require production deployment with appropriate regulatory clearances, SMS provider integration, and user consent under Indian IT and telecom laws.
      </div>
    </div>
  );
};
