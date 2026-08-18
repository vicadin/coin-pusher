import { Container, Graphics, Sprite, Texture, RenderTexture, Application } from 'pixi.js';
import { COIN_CONFIG } from '../config/coinConfig';
import { CoinState, createInitialCoinState } from '../model/CoinState';

let nextCoinId = 1;

export function resetCoinIds(): void {
  nextCoinId = 1;
}

export function createCoinTexture(app: Application): Texture {
  const size = (COIN_CONFIG.radius + 2) * 2;
  const renderTexture = RenderTexture.create({ width: size, height: size });
  const g = new Graphics();

  const cx = size / 2;
  const cy = size / 2;
  const r = COIN_CONFIG.radius;

  g.circle(cx, cy + 1.5, r).fill({ color: 0x000000, alpha: 0.35 });

  g.circle(cx, cy, r).fill({ color: COIN_CONFIG.edgeColor });

  g.circle(cx, cy, r - 2).fill({ color: COIN_CONFIG.baseColor });

  g.circle(cx, cy, r - 4).fill({ color: COIN_CONFIG.innerColor });

  const starRadius = r * 0.42;
  g.star(cx, cy, 5, starRadius, starRadius * 0.45).fill({ color: COIN_CONFIG.starColor });

  g.ellipse(cx - r * 0.25, cy - r * 0.3, r * 0.4, r * 0.2).fill({
    color: COIN_CONFIG.highlightColor,
    alpha: 0.6,
  });

  app.renderer.render({ container: g, target: renderTexture });
  g.destroy();

  return renderTexture;
}

export class Coin extends Container {
  readonly state: CoinState;
  private readonly sprite: Sprite;

  constructor(texture: Texture, radius: number = COIN_CONFIG.radius) {
    super();
    this.state = createInitialCoinState(nextCoinId++, radius);

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
  }

  spawn(x: number, y: number): void {
    this.state.positionX = x;
    this.state.positionY = y;
    this.state.velocityX = 0;
    this.state.velocityY = 0;
    this.state.isActive = true;
    this.state.isCollected = false;
    this.visible = true;
    this.alpha = 1;
    this.scale.set(1);

    this.syncVisual();
  }

  syncVisual(): void {
    this.position.set(this.state.positionX, this.state.positionY);
  }
}