import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';

export class SoundButton extends Container {
  private readonly bg: Graphics;
  private readonly icon: Text;
  private isMuted = false;

  constructor(onToggle: (muted: boolean) => void) {
    super();
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-18, -18, 36, 36);

    this.bg = new Graphics();
    this.drawBackground(false);
    this.addChild(this.bg);

    this.icon = new Text({
      text: '🔊',
      style: new TextStyle({
        fontSize: 16,
      }),
    });
    this.icon.anchor.set(0.5);
    this.icon.position.set(0, 0);
    this.addChild(this.icon);

    this.on('pointertap', (e) => {
      e.stopPropagation();
      this.isMuted = !this.isMuted;
      this.updateState();
      onToggle(this.isMuted);
    });

    this.on('pointerover', () => {
      this.scale.set(1.08);
    });

    this.on('pointerout', () => {
      this.scale.set(1);
    });
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.updateState();
  }

  private updateState(): void {
    this.icon.text = this.isMuted ? '🔇' : '🔊';
    this.drawBackground(this.isMuted);
  }

  private drawBackground(muted: boolean): void {
    this.bg.clear();

    const radius = 17;

    this.bg
      .circle(0, 0, radius)
      .fill({ color: muted ? 0x26141a : 0x10194a, alpha: 0.95 });

    this.bg
      .circle(0, 0, radius)
      .stroke({ color: muted ? 0xef5350 : 0x5c6bc0, width: 2 });

    this.bg
      .ellipse(0, -radius * 0.4, radius * 0.65, radius * 0.3)
      .fill({ color: 0xffffff, alpha: 0.15 });
  }
}
