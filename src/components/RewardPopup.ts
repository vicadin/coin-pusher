import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Tween, TweenManager, easeOutBack, easeOutCubic } from '@/utils/easing';
import { ObjectPool } from '@/utils/ObjectPool';

type FloatingText = {
  container: Container;
  label: Text;
  subLabel: Text;
  glow: Graphics;
  active: boolean;
};

export class RewardPopup {
  private readonly layer: Container;
  private readonly pool: ObjectPool<FloatingText>;
  private readonly tweenManager = new TweenManager();

  constructor(layer: Container) {
    this.layer = layer;
    this.pool = new ObjectPool(
      () => this.createFloatingText(),
      (item) => this.resetFloatingText(item),
      8,
    );
  }

  show(amount: number, positionX: number, positionY: number, customTitle?: string): void {
    const item = this.pool.acquire();
    item.active = true;
    item.label.text = `+${amount} COINS`;
    if (customTitle) {
      item.subLabel.text = customTitle;
      item.subLabel.visible = true;
    } else {
      item.subLabel.visible = false;
    }

    item.container.position.set(positionX, positionY);
    item.container.alpha = 1;
    item.container.scale.set(0.3);
    item.container.visible = true;

    const popTween = new Tween({
      duration: 0.35,
      easing: easeOutBack,
      onUpdate: (progress) => {
        item.container.scale.set(0.3 + progress * 0.85);
      },
    });

    const floatTween = new Tween({
      duration: 0.95,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        item.container.position.y = positionY - progress * 55;
        item.container.alpha = 1 - progress * 0.85;
      },
      onComplete: () => {
        this.pool.release(item);
      },
    });

    this.tweenManager.add(popTween);
    this.tweenManager.add(floatTween);
  }

  showBigJackpot(amount: number, centerX: number, centerY: number): void {
    const item = this.pool.acquire();
    item.active = true;
    item.label.text = `✨ +${amount} ✨`;
    item.label.style.fontSize = 32;
    item.subLabel.text = '★ AMAZING! ★';
    item.subLabel.style.fontSize = 20;
    item.subLabel.visible = true;

    item.container.position.set(centerX, centerY);
    item.container.alpha = 1;
    item.container.scale.set(0.2);
    item.container.visible = true;

    const popTween = new Tween({
      duration: 0.45,
      easing: easeOutBack,
      onUpdate: (progress) => {
        item.container.scale.set(0.2 + progress * 1.1);
      },
    });

    const floatTween = new Tween({
      duration: 1.4,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        item.container.position.y = centerY - progress * 40;
        if (progress > 0.6) {
          item.container.alpha = 1 - (progress - 0.6) / 0.4;
        }
      },
      onComplete: () => {
        // Restore default styles
        item.label.style.fontSize = 22;
        item.subLabel.style.fontSize = 14;
        this.pool.release(item);
      },
    });

    this.tweenManager.add(popTween);
    this.tweenManager.add(floatTween);
  }

  update(deltaSeconds: number): void {
    this.tweenManager.update(deltaSeconds);
  }

  private createFloatingText(): FloatingText {
    const container = new Container();

    const glow = new Graphics();
    glow.circle(0, 0, 45).fill({ color: 0xffeb3b, alpha: 0.35 });
    container.addChild(glow);

    const subLabel = new Text({
      text: 'AMAZING!',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        fontWeight: '900',
        fill: 0xff5722,
        stroke: { color: 0xffffff, width: 3 },
        letterSpacing: 1.5,
      }),
    });
    subLabel.anchor.set(0.5);
    subLabel.position.set(0, -22);
    subLabel.visible = false;
    container.addChild(subLabel);

    const label = new Text({
      text: '+10 COINS',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 22,
        fontWeight: '900',
        fill: 0xffeb3b,
        stroke: { color: 0xe65100, width: 4 },
        letterSpacing: 1,
        dropShadow: {
          alpha: 0.7,
          angle: Math.PI / 4,
          blur: 4,
          color: 0x000000,
          distance: 2,
        },
      }),
    });
    label.anchor.set(0.5);
    label.position.set(0, 4);
    container.addChild(label);

    container.visible = false;
    this.layer.addChild(container);

    return { container, label, subLabel, glow, active: false };
  }

  private resetFloatingText(item: FloatingText): void {
    item.active = false;
    item.container.visible = false;
  }
}
