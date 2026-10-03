import React, { useState } from 'react';
import { Volume2, RotateCcw, VolumeX } from 'lucide-react';
import { speechService } from '../lib/speechService';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';

interface VoiceInstructionBarProps {
  instructionText: string;
  className?: string;
}

export const VoiceInstructionBar: React.FC<VoiceInstructionBarProps> = ({
  instructionText,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const { voiceEnabled } = useAccessibility();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handleRead = () => {
    setIsPlaying(true);
    speechService.speak(instructionText, language, () => {
      setIsPlaying(false);
    });
  };

  const handleRepeat = () => {
    setIsPlaying(true);
    speechService.repeat(language);
  };

  const handleStop = () => {
    speechService.stop();
    setIsPlaying(false);
  };

  if (!voiceEnabled) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 bg-amber-50 border-2 border-slate-900 rounded-2xl p-3 sm:p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
        <div className={`w-10 h-10 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-bounce' : ''}`}>
          <Volume2 className="w-5 h-5 text-slate-900" />
        </div>
        <p className="text-slate-800 font-bold text-sm sm:text-base leading-snug">
          {instructionText}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRead}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 font-extrabold text-xs sm:text-sm text-slate-900 shadow-sm transition-transform active:scale-95"
          aria-label="Read Instructions Aloud"
        >
          <Volume2 className="w-4 h-4" />
          <span>{t('voiceRead') || 'Read'}</span>
        </button>

        <button
          onClick={handleRepeat}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 font-bold text-xs sm:text-sm text-slate-800 shadow-sm transition-transform active:scale-95"
          aria-label="Repeat Voice Instructions"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('voiceRepeat') || 'Repeat'}</span>
        </button>

        {isPlaying && (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 border-2 border-slate-900 font-bold text-xs text-rose-800 shadow-sm"
            aria-label="Stop Voice"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>{t('voiceMute') || 'Stop'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
