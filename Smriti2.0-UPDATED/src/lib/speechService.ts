// Browser Web Speech API Service
// Accessible, zero-cost, clear pronunciation at gentle elderly pace

class SpeechService {
  private lastSpokenText: string = '';
  private isMuted: boolean = false;

  speak(text: string, lang: string = 'en', onEnd?: () => void) {
    if (this.isMuted || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances
      this.lastSpokenText = text;

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select appropriate language tag
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        as: 'as-IN',
        bn: 'bn-IN',
        kha: 'en-IN',
        lus: 'en-IN',
        mni: 'en-IN',
        nag: 'en-IN',
      };
      utterance.lang = langMap[lang] || 'en-IN';

      // Gentle, clear speech configuration for elderly users
      utterance.rate = 0.85; // slightly slower for maximum clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (onEnd) {
        utterance.onend = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech fallback
    }
  }

  repeat(lang: string = 'en') {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, lang);
    }
  }

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute) {
      this.stop();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }
}

export const speechService = new SpeechService();
