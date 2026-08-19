export function easeOutBack(progress: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
}

export function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function easeOutElastic(progress: number): number {
  if (progress === 0 || progress === 1) {
    return progress;
  }
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
}

export function easeInOutSine(progress: number): number {
  return -(Math.cos(Math.PI * progress) - 1) / 2;
}

export type TweenOptions = {
  duration: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
  easing?: (progress: number) => number;
};

export class Tween {
  private elapsed = 0;
  private readonly duration: number;
  private readonly onUpdate: (value: number) => void;
  private readonly onComplete?: () => void;
  private readonly easing: (progress: number) => number;
  private active = true;

  constructor(options: TweenOptions) {
    this.duration = options.duration;
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
    this.easing = options.easing ?? easeOutCubic;
  }

  update(deltaSeconds: number): boolean {
    if (!this.active) {
      return false;
    }

    this.elapsed += deltaSeconds;
    const rawProgress = clamp01(this.elapsed / this.duration);
    const easedProgress = this.easing(rawProgress);
    this.onUpdate(easedProgress);

    if (rawProgress >= 1) {
      this.active = false;
      this.onComplete?.();
      return false;
    }

    return true;
  }

  cancel(): void {
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class TweenManager {
  private readonly tweens: Tween[] = [];

  add(tween: Tween): void {
    this.tweens.push(tween);
  }

  update(deltaSeconds: number): void {
    for (let index = this.tweens.length - 1; index >= 0; index -= 1) {
      const stillActive = this.tweens[index].update(deltaSeconds);
      if (!stillActive) {
        this.tweens.splice(index, 1);
      }
    }
  }

  clear(): void {
    this.tweens.length = 0;
  }
}
