import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Sparkles, X } from 'lucide-react';

export const AdaptiveTouchToast: React.FC = () => {
  const { adaptiveNotice, dismissAdaptiveNotice } = useAccessibility();

  if (!adaptiveNotice) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] bg-amber-400 border-3 border-slate-900 rounded-2xl p-4 shadow-card-solid animate-bounce flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-amber-600" />
        </div>
        <p className="text-slate-950 font-extrabold text-sm sm:text-base leading-snug">
          {adaptiveNotice}
        </p>
      </div>
      <button
        onClick={dismissAdaptiveNotice}
        className="p-1 rounded-lg bg-white/80 hover:bg-white text-slate-900 border border-slate-900 shrink-0"
        aria-label="Dismiss Notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
