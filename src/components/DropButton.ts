import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js';

export class DropButton extends Container {
  private readonly background: Graphics;
  private readonly buttonLabel: Text;
  private readonly handIcon: Text;
  private readonly hintLabel: Text;
  private pulseTime = 0;
  private handBounceTime = 0;
  private enabled = true;
  private showHand = true;

  constructor(onClick: () => void) {
    super();
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-90, -25, 180, 50);

    this.hintLabel = new Text({
      text: 'DROP A COIN!',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 12.5,
        fontWeight: 'bold',
        fill: 0xffeb3b,
        letterSpacing: 0.8,
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 3,
          color: 0x000000,
          distance: 1,
        },
      }),
    });
    this.hintLabel.anchor.set(0.5);
    this.hintLabel.position.set(0, -60);

    this.handIcon = new Text({
      text: '👆',
      style: new TextStyle({
        fontSize: 18,
      }),
    });
    this.handIcon.anchor.set(0.5);
    this.handIcon.position.set(0, -40);
    this.handIcon.rotation = Math.PI;

    this.background = new Graphics();

    this.buttonLabel = new Text({
      text: 'DROP',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 21,
        fontWeight: '900',
        fill: 0xffffff,
        letterSpacing: 2,
        dropShadow: {
          alpha: 0.6,
          angle: Math.PI / 2,
          blur: 3,
          color: 0x1b5e20,
          distance: 2,
        },
      }),
    });
    this.buttonLabel.anchor.set(0.5);
    this.buttonLabel.position.set(0, 0);

    this.addChild(this.hintLabel, this.handIcon, this.background, this.buttonLabel);
    this.drawBackground(160, 44);

    this.on('pointertap', () => {
      if (!this.enabled) {
        return;
      }
      onClick();
    });
  }

  private drawBackground(width: number, height: number): void {
    this.background.clear();

    this.background.roundRect(-width / 2, -height / 2 + 4, width, height, 22).fill({
      color: 0x1b5e20,
      alpha: 0.9,
    });

    this.background.roundRect(-width / 2, -height / 2, width, height, 22).fill({
      color: 0x43a047,
    });

    this.background.roundRect(-width / 2, -height / 2, width, height, 22).stroke({
      color: 0x81c784,
      width: 2.5,
    });

    this.background
      .roundRect(-width / 2 + 5, -height / 2 + 2, width - 10, height * 0.4, 14)
      .fill({ color: 0xa5d6a7, alpha: 0.5 });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.alpha = enabled ? 1 : 0.6;
    this.cursor = enabled ? 'pointer' : 'default';
    this.showHand = enabled;
    this.handIcon.visible = enabled;
  }

  setStep(dropIndex: number): void {
    if (dropIndex === 0) {
      this.hintLabel.text = 'DROP A COIN!';
      this.buttonLabel.text = 'DROP';
    } else if (dropIndex === 1) {
      this.hintLabel.text = 'DROP AGAIN!';
      this.buttonLabel.text = 'DROP';
    } else {
      this.hintLabel.text = '✨ BIG JACKPOT! ✨';
      this.buttonLabel.text = 'DROP';
    }
  }

  update(deltaSeconds: number): void {
    if (!this.enabled) {
      this.scale.set(1);
      return;
    }

    this.pulseTime += deltaSeconds;
    const pulse = 1 + Math.sin((this.pulseTime * Math.PI * 2) / 1.1) * 0.035;
    this.scale.set(pulse);

    if (this.showHand) {
      this.handBounceTime += deltaSeconds * 5;
      const offsetY = Math.sin(this.handBounceTime) * 3;
      this.handIcon.position.set(0, -40 + offsetY);
    }
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}
