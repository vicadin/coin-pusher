import { Graphics, Container } from 'pixi.js';
import { ObjectPool } from '@/utils/ObjectPool';
import { randomRange } from '@/utils/random';

type Particle = {
  graphic: Graphics;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  active: boolean;
};

export class ParticleSystem {
  private readonly layer: Container;
  private readonly pool: ObjectPool<Particle>;
  private readonly activeParticles: Particle[] = [];

  constructor(layer: Container, poolSize: number) {
    this.layer = layer;
    this.pool = new ObjectPool(
      () => this.createParticle(),
      (particle) => this.resetParticle(particle),
      poolSize,
    );
  }

  burst(positionX: number, positionY: number, color = 0xffeb3b, count = 12): void {
    for (let index = 0; index < count; index += 1) {
      const particle = this.pool.acquire();
      particle.active = true;
      particle.life = particle.maxLife;
      particle.graphic.visible = true;
      particle.graphic.position.set(positionX, positionY);
      particle.graphic.alpha = 1;
      particle.graphic.tint = color;

      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(80, 220);
      particle.velocityX = Math.cos(angle) * speed;
      particle.velocityY = Math.sin(angle) * speed - 60;

      this.activeParticles.push(particle);
    }
  }

  sparkle(positionX: number, positionY: number): void {
    this.burst(positionX, positionY, 0xfff176, 8);
  }

  update(deltaSeconds: number): void {
    for (let index = this.activeParticles.length - 1; index >= 0; index -= 1) {
      const particle = this.activeParticles[index];
      particle.life -= deltaSeconds;

      if (particle.life <= 0) {
        this.activeParticles.splice(index, 1);
        this.pool.release(particle);
        continue;
      }

      particle.velocityY += 400 * deltaSeconds;
      particle.graphic.position.x += particle.velocityX * deltaSeconds;
      particle.graphic.position.y += particle.velocityY * deltaSeconds;
      particle.graphic.alpha = particle.life / particle.maxLife;
      particle.graphic.scale.set(0.5 + (particle.life / particle.maxLife) * 0.5);
    }
  }

  private createParticle(): Particle {
    const graphic = new Graphics();
    graphic.circle(0, 0, 4).fill({ color: 0xffffff });
    graphic.visible = false;
    this.layer.addChild(graphic);

    return {
      graphic,
      velocityX: 0,
      velocityY: 0,
      life: 0,
      maxLife: randomRange(0.4, 0.8),
      active: false,
    };
  }

  private resetParticle(particle: Particle): void {
    particle.active = false;
    particle.graphic.visible = false;
    particle.velocityX = 0;
    particle.velocityY = 0;
  }
}
