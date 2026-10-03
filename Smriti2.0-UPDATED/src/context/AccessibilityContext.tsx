import React, { createContext, useContext, useState, useEffect } from 'react';
import { TextSize, TouchMode, UserPreferences } from '../types/database.types';
import { adaptiveEngine } from '../lib/adaptiveEngine';
import { speechService } from '../lib/speechService';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  touchMode: TouchMode;
  setTouchMode: (mode: TouchMode) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  calmMode: boolean;
  setCalmMode: (calm: boolean) => void;
  adaptiveNotice: string | null;
  dismissAdaptiveNotice: () => void;
  getTextSizeClass: (baseClass?: string) => string;
  getTouchTargetClass: (baseClass?: string) => string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    return (localStorage.getItem('smriti_text_size') as TextSize) || 'large';
  });

  const [touchMode, setTouchModeState] = useState<TouchMode>(() => {
    return (localStorage.getItem('smriti_touch_mode') as TouchMode) || 'normal';
  });

  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('smriti_voice_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return localStorage.getItem('smriti_reduced_motion') === 'true';
  });

  const [calmMode, setCalmModeState] = useState<boolean>(() => {
    return localStorage.getItem('smriti_calm_mode') === 'true';
  });

  const [adaptiveNotice, setAdaptiveNotice] = useState<string | null>(null);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('smriti_text_size', size);
  };

  const setTouchMode = (mode: TouchMode) => {
    setTouchModeState(mode);
    localStorage.setItem('smriti_touch_mode', mode);
  };

  const setVoiceEnabled = (enabled: boolean) => {
    setVoiceEnabledState(enabled);
    localStorage.setItem('smriti_voice_enabled', String(enabled));
    speechService.setMute(!enabled);
  };

  const setReducedMotion = (reduced: boolean) => {
    setReducedMotionState(reduced);
    localStorage.setItem('smriti_reduced_motion', String(reduced));
  };

  const setCalmMode = (calm: boolean) => {
    setCalmModeState(calm);
    localStorage.setItem('smriti_calm_mode', String(calm));
  };

  const dismissAdaptiveNotice = () => {
    setAdaptiveNotice(null);
  };

  // Wire up Adaptive Engine listener
  useEffect(() => {
    adaptiveEngine.registerListener((newMode) => {
      setTouchMode(newMode);
      setAdaptiveNotice("We've made the buttons larger to make this easier for you.");
      if (voiceEnabled) {
        speechService.speak("We have enlarged the buttons to make tapping easier.");
      }
    });
  }, [voiceEnabled]);

  // Apply root CSS classes for font scale and calm mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-extra_large', 'calm-mode', 'reduced-motion');
    root.classList.add(`text-size-${textSize}`);
    if (calmMode) root.classList.add('calm-mode');
    if (reducedMotion) root.classList.add('reduced-motion');
  }, [textSize, calmMode, reducedMotion]);

  const getTextSizeClass = (baseClass: string = '') => {
    switch (textSize) {
      case 'extra_large':
        return `${baseClass} text-xl md:text-2xl`;
      case 'large':
        return `${baseClass} text-lg md:text-xl`;
      case 'normal':
      default:
        return `${baseClass} text-base md:text-lg`;
    }
  };

  const getTouchTargetClass = (baseClass: string = '') => {
    switch (touchMode) {
      case 'extra_large':
        return `${baseClass} min-h-[72px] min-w-[72px] px-8 py-5 text-xl font-bold rounded-3xl`;
      case 'large':
        return `${baseClass} min-h-[60px] min-w-[60px] px-6 py-4 text-lg font-bold rounded-2xl`;
      case 'normal':
      default:
        return `${baseClass} min-h-[50px] min-w-[50px] px-5 py-3 text-base font-semibold rounded-2xl`;
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        touchMode,
        setTouchMode,
        voiceEnabled,
        setVoiceEnabled,
        reducedMotion,
        setReducedMotion,
        calmMode,
        setCalmMode,
        adaptiveNotice,
        dismissAdaptiveNotice,
        getTextSizeClass,
        getTouchTargetClass,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return ctx;
};
