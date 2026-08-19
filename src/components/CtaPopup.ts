import { Tween, TweenManager, easeOutBack } from '@/utils/easing';
import type { AdBridge } from '@/bridge/AdBridge';

export class CtaPopup {
  private readonly overlay: HTMLElement;
  private readonly button: HTMLButtonElement;
  private readonly coinsWinEl: HTMLElement | null;
  private readonly tweenManager = new TweenManager();
  private visible = false;

  constructor(adBridge: AdBridge) {
    const overlay = document.getElementById('cta-overlay');
    const button = document.getElementById('cta-button');

    if (!overlay || !button) {
      throw new Error('CTA overlay elements not found in DOM');
    }

    this.overlay = overlay;
    this.button = button as HTMLButtonElement;
    this.coinsWinEl = document.getElementById('cta-coins-win');

    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      adBridge.openStore();
    });

    this.overlay.addEventListener('click', () => {
      adBridge.openStore();
    });
  }

  show(totalWon = 100, onShown?: () => void): void {
    if (this.visible) {
      return;
    }
    this.visible = true;
    if (this.coinsWinEl) {
      this.coinsWinEl.textContent = `+${totalWon} COINS`;
    }

    this.overlay.classList.remove('hidden');

    const content = this.overlay.querySelector('.cta-content') as HTMLElement;
    if (content) {
      content.style.transform = 'scale(0.7)';
      content.style.opacity = '0';

      const entrance = new Tween({
        duration: 0.45,
        easing: easeOutBack,
        onUpdate: (progress) => {
          const scale = 0.7 + progress * 0.3;
          content.style.transform = `scale(${scale})`;
          content.style.opacity = String(progress);
        },
        onComplete: () => {
          onShown?.();
        },
      });

      this.tweenManager.add(entrance);
    }
  }

  hide(): void {
    this.visible = false;
    this.overlay.classList.add('hidden');
  }

  update(deltaSeconds: number): void {
    this.tweenManager.update(deltaSeconds);
  }
}
