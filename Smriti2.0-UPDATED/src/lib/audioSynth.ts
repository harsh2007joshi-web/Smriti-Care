// High Quality Web Audio API Synthesizer
// Completely zero-cost, runs natively in all browsers, zero external paid audio APIs.

class AudioSynthEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Gentle positive feedback chime (Zero-agitation, soft major chord)
  playPositiveTone() {
    try {
      const ctx = this.getContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.65);
      });
    } catch {
      // Audio fallback gracefully handled
    }
  }

  // Encouraging hint / retry tone (Very soft, soothing, never jarring)
  playGentleTone() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(392, ctx.currentTime + 0.25); // G4

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // Rhythm Weaver beat tap (Soft warm wood block / tabla pulse)
  playRhythmBeat(isAccent = false) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 330 : 260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(isAccent ? 0.2 : 0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  }

  // Realistic Soundscapes
  playSoundscape(type: 'rain' | 'birds' | 'water' | 'doorbell' | 'train' | 'cooking', durationSec = 3.5) {
    const ctx = this.getContext();
    switch (type) {
      case 'rain':
        this.synthesizeRain(ctx, durationSec);
        break;
      case 'birds':
        this.synthesizeBirds(ctx, durationSec);
        break;
      case 'water':
        this.synthesizeRiver(ctx, durationSec);
        break;
      case 'doorbell':
        this.synthesizeDoorbell(ctx);
        break;
      case 'train':
        this.synthesizeTrain(ctx, durationSec);
        break;
      case 'cooking':
        this.synthesizeCooking(ctx, durationSec);
        break;
    }
  }

  private synthesizeRain(ctx: AudioContext, duration: number) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    // Generate brown/pink noise
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.18, ctx.currentTime + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  }

  private synthesizeBirds(ctx: AudioContext, duration: number) {
    const startTime = ctx.currentTime;
    // Series of chirps
    for (let i = 0; i < 4; i++) {
      const chirpStart = startTime + i * 0.75 + Math.random() * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 500, chirpStart);
      osc.frequency.exponentialRampToValueAtTime(3200 + Math.random() * 400, chirpStart + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2400, chirpStart + 0.18);

      gain.gain.setValueAtTime(0.001, chirpStart);
      gain.gain.linearRampToValueAtTime(0.1, chirpStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, chirpStart + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chirpStart);
      osc.stop(chirpStart + 0.25);
    }
  }

  private synthesizeRiver(ctx: AudioContext, duration: number) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + duration - 0.4);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  }

  private synthesizeDoorbell(ctx: AudioContext) {
    const now = ctx.currentTime;
    // Ding (E5: 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.25);

    // Dong (C5: 523.25Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.45);
    gain2.gain.setValueAtTime(0.18, now + 0.45);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.45);
    osc2.stop(now + 1.85);
  }

  private synthesizeTrain(ctx: AudioContext, duration: number) {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(392, now); // G4
    osc2.frequency.setValueAtTime(587.33, now); // D5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain.gain.setValueAtTime(0.12, now + 1.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.25);
    osc2.stop(now + 2.25);
  }

  private synthesizeCooking(ctx: AudioContext, duration: number) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Occasional crackle
      data[i] = Math.random() > 0.88 ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.14, ctx.currentTime + duration - 0.3);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  }
}

export const audioSynth = new AudioSynthEngine();
