type SoundName = 'drop' | 'hit' | 'reward' | 'cta';

export class AudioManager {
  private enabled = true;
  private readonly context: AudioContext | null;
  private unlocked = false;

  constructor() {
    this.context = this.createContext();
  }

  private createContext(): AudioContext | null {
    try {
      const AudioContextClass =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      return new AudioContextClass();
    } catch {
      return null;
    }
  }

  unlock(): void {
    if (!this.context || this.unlocked) {
      return;
    }
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    this.unlocked = true;
  }

  play(name: SoundName): void {
    if (!this.enabled || !this.context) {
      return;
    }

    try {
      this.unlock();
      if (name === 'reward') {
        this.playRewardFanfare();
      } else if (name === 'cta') {
        this.playCtaFanfare();
      } else {
        this.playTone(name);
      }
    } catch {
      // Audio is optional — fail silently
    }
  }

  private playTone(name: SoundName): void {
    if (!this.context) {
      return;
    }

    const config = SOUND_CONFIG[name];
    if (!config) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      config.frequencyEnd,
      now + config.duration,
    );

    gain.gain.setValueAtTime(config.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(now);
    oscillator.stop(now + config.duration);
  }

  private playRewardFanfare(): void {
    if (!this.context) {
      return;
    }
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.context.currentTime;

    notes.forEach((freq, index) => {
      const osc = this.context!.createOscillator();
      const gain = this.context!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.06);

      gain.gain.setValueAtTime(0.15, now + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.context!.destination);

      osc.start(now + index * 0.06);
      osc.stop(now + index * 0.06 + 0.25);
    });
  }

  private playCtaFanfare(): void {
    if (!this.context) {
      return;
    }
    const chords = [523.25, 659.25, 783.99, 1046.5];
    const now = this.context.currentTime;

    chords.forEach((freq) => {
      const osc = this.context!.createOscillator();
      const gain = this.context!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.context!.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

const SOUND_CONFIG: Record<
  SoundName,
  { frequency: number; frequencyEnd: number; duration: number; volume: number; type: OscillatorType }
> = {
  drop: { frequency: 587.33, frequencyEnd: 293.66, duration: 0.14, volume: 0.16, type: 'triangle' },
  hit: { frequency: 880, frequencyEnd: 440, duration: 0.06, volume: 0.12, type: 'sine' },
  reward: { frequency: 523, frequencyEnd: 1046, duration: 0.3, volume: 0.18, type: 'triangle' },
  cta: { frequency: 440, frequencyEnd: 880, duration: 0.5, volume: 0.16, type: 'sine' },
};
