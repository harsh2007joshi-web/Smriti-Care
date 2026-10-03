// Adaptive Touch & Zero-Agitation Engine
// Dynamically adjusts UI button sizes upon detecting touch hesitation or repeated taps
// Strictly for usability assistance — NEVER makes clinical or medical claims.

export interface TouchTelemetry {
  missedTaps: number;
  hesitationCount: number;
  totalInteractions: number;
}

class AdaptiveEngine {
  private missedTapsCount = 0;
  private onTriggerAdaptiveTouch?: (newMode: 'large' | 'extra_large') => void;

  registerListener(callback: (newMode: 'large' | 'extra_large') => void) {
    this.onTriggerAdaptiveTouch = callback;
  }

  recordInteraction(isAccurate: boolean, currentTouchMode: string = 'normal') {
    if (!isAccurate) {
      this.missedTapsCount += 1;
      // If 3 consecutive inaccurate or hesitant taps are detected, gently scale buttons
      if (this.missedTapsCount >= 3 && currentTouchMode === 'normal') {
        if (this.onTriggerAdaptiveTouch) {
          this.onTriggerAdaptiveTouch('large');
        }
        this.missedTapsCount = 0;
      } else if (this.missedTapsCount >= 5 && currentTouchMode === 'large') {
        if (this.onTriggerAdaptiveTouch) {
          this.onTriggerAdaptiveTouch('extra_large');
        }
        this.missedTapsCount = 0;
      }
    } else {
      // Decay count on success
      this.missedTapsCount = Math.max(0, this.missedTapsCount - 1);
    }
  }

  reset() {
    this.missedTapsCount = 0;
  }
}

export const adaptiveEngine = new AdaptiveEngine();
