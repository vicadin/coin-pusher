import { Graphics, Container, Texture } from 'pixi.js';
import { COIN_CONFIG } from '@/config/coinConfig';
import { type CoinState, createCoinState } from '@/model/CoinState';

let nextCoinId = 1;

export class Coin extends Container {
  readonly state: CoinState;
  private readonly body: Graphics;
  private glow: Graphics | null = null;

  constructor(_texture: Texture, radius: number, isDropped = false) {
    super();
    this.state = createCoinState(nextCoinId, 0, 0, radius, isDropped);
    nextCoinId += 1;

    this.body = new Graphics();
    this.drawCoinBody(radius);
    this.addChild(this.body);
  }

  private drawCoinBody(radius: number): void {
    this.body.clear();

    const { colors } = COIN_CONFIG;

    this.body.circle(0, 1.5, radius).fill({ color: 0x000000, alpha: 0.25 });

    this.body.circle(0, 0, radius).fill({ color: colors.edge });
    this.body.circle(0, 0, radius - 1.5).fill({ color: colors.outer });

    this.body.circle(0, 0, radius * 0.82).fill({ color: colors.inner });

    this.body.circle(0, 0, radius * 0.82).stroke({ color: colors.symbol, width: 1, alpha: 0.5 });

    this.body.circle(-radius * 0.3, -radius * 0.3, radius * 0.32).fill({
      color: colors.highlight,
      alpha: 0.55,
    });

    this.drawStar(0, 0, 5, radius * 0.42, radius * 0.2, colors.symbol, colors.star);
  }

  private drawStar(
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    fillColor: number,
    highlightColor: number,
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    this.body.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      this.body.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.body.lineTo(x, y);
      rot += step;
    }
    this.body.lineTo(cx, cy - outerRadius);
    this.body.fill({ color: fillColor, alpha: 0.85 });

    this.body.circle(cx - 1, cy - 1, innerRadius * 0.4).fill({
      color: highlightColor,
      alpha: 0.6,
    });
  }

  activate(positionX: number, positionY: number, isDropped: boolean): void {
    this.state.positionX = positionX;
    this.state.positionY = positionY;
    this.state.velocityX = 0;
    this.state.velocityY = 0;
    this.state.radius = isDropped ? COIN_CONFIG.dropRadius : COIN_CONFIG.radius;
    this.state.isActive = true;
    this.state.isDropped = isDropped;
    this.state.isCollected = false;
    this.visible = true;
    this.alpha = 1;
    this.scale.set(1);
    this.syncVisual();
  }

  deactivate(): void {
    this.state.isActive = false;
    this.state.isCollected = false;
    this.visible = false;
    this.removeGlow();
  }

  syncVisual(): void {
    this.position.set(this.state.positionX, this.state.positionY);
    this.rotation = this.state.velocityX * 0.003;
  }

  applyImpulse(velocityX: number, velocityY: number): void {
    this.state.velocityX += velocityX;
    this.state.velocityY += velocityY;
  }

  showGlow(): void {
    if (this.glow) {
      return;
    }
    this.glow = new Graphics();
    this.glow.circle(0, 0, this.state.radius + 8).fill({ color: 0xffeb3b, alpha: 0.45 });
    this.addChildAt(this.glow, 0);
  }

  removeGlow(): void {
    if (this.glow) {
      this.removeChild(this.glow);
      this.glow.destroy();
      this.glow = null;
    }
  }
}

export function createCoinTexture(): Texture {
  return Texture.EMPTY;
}

export function resetCoinIds(): void {
  nextCoinId = 1;
}
