import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const MedicalDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useLanguage();

  return (
    <div
      className={`bg-slate-100 border-2 border-slate-400/80 rounded-2xl p-3 sm:p-4 text-slate-700 flex items-start gap-3 text-xs sm:text-sm font-medium ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
      <div>
        <span className="font-bold text-slate-900 block mb-0.5">Wellness Notice</span>
        <p>
          {t('medicalDisclaimer') ||
            'This platform supports cognitive engagement and wellness tracking. It does not provide medical diagnosis or replace professional medical care.'}
        </p>
      </div>
    </div>
  );
};
