import { GAME_CONFIG } from '@/config/gameConfig';
import type { Coin } from '@/components/Coin';

export type FieldBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  pusherX: number;
  pusherY: number;
  pusherWidth: number;
  pusherHeight: number;
  pusherVelocityX: number;
};

export class PhysicsSystem {
  private pusherTime = 0;
  private pusherX: number = GAME_CONFIG.logicalWidth / 2;
  private pusherVelocityX = 0;
  private extraPusherSpeed = 0;

  triggerJackpotBoost(): void {
    this.extraPusherSpeed = 1.8;
  }

  update(coins: Coin[], bounds: FieldBounds, deltaSeconds: number): void {
    this.updatePusher(deltaSeconds);
    bounds.pusherX = this.pusherX;
    bounds.pusherVelocityX = this.pusherVelocityX;

    if (this.extraPusherSpeed > 0) {
      this.extraPusherSpeed = Math.max(0, this.extraPusherSpeed - deltaSeconds * 2.0);
    }

    const { gravity, friction, wallRestitution } = GAME_CONFIG;

    for (const coin of coins) {
      if (!coin.state.isActive || coin.state.isCollected) {
        continue;
      }

      const { state } = coin;

      state.velocityY += gravity * deltaSeconds;

      state.velocityX *= Math.pow(friction, deltaSeconds * 60);
      state.velocityY *= Math.pow(friction, deltaSeconds * 60);

      this.resolvePusherInteraction(coin, bounds);

      state.positionX += state.velocityX * deltaSeconds;
      state.positionY += state.velocityY * deltaSeconds;

      this.resolveBoundaryCollisions(coin, bounds, wallRestitution);

      coin.syncVisual();
    }
  }

  getPusherX(): number {
    return this.pusherX;
  }

  getPusherVelocityX(): number {
    return this.pusherVelocityX;
  }

  private updatePusher(deltaSeconds: number): void {
    const totalSpeed = GAME_CONFIG.pusherSpeed + this.extraPusherSpeed;
    this.pusherTime += deltaSeconds * totalSpeed;

    const centerX = GAME_CONFIG.logicalWidth / 2;
    const sinVal = Math.sin(this.pusherTime);
    const cosVal = Math.cos(this.pusherTime);

    this.pusherX = centerX + sinVal * GAME_CONFIG.pusherAmplitude;
    this.pusherVelocityX = cosVal * GAME_CONFIG.pusherAmplitude * totalSpeed;
  }

  private resolvePusherInteraction(coin: Coin, bounds: FieldBounds): void {
    const { state } = coin;
    const pusherLeft = bounds.pusherX - bounds.pusherWidth / 2;
    const pusherRight = bounds.pusherX + bounds.pusherWidth / 2;
    const pusherTop = bounds.pusherY;
    const pusherBottom = bounds.pusherY + bounds.pusherHeight;

    if (
      state.positionX >= pusherLeft - state.radius &&
      state.positionX <= pusherRight + state.radius &&
      state.positionY >= pusherTop - state.radius &&
      state.positionY <= pusherBottom
    ) {
      if (state.positionY < pusherTop + state.radius * 0.7) {
        state.positionY = pusherTop - state.radius;
        if (state.velocityY > 0) {
          state.velocityY = -state.velocityY * 0.25;
        }
        state.velocityX += this.pusherVelocityX * 0.15;
      }
    }
  }

  private resolveBoundaryCollisions(
    coin: Coin,
    bounds: FieldBounds,
    restitution: number,
  ): void {
    const { state } = coin;
    const minX = bounds.left + state.radius;
    const maxX = bounds.right - state.radius;
    const minY = bounds.top + state.radius;
    const maxY = bounds.bottom - state.radius;

    // left
    if (state.positionX < minX) {
      state.positionX = minX;
      state.velocityX = Math.abs(state.velocityX) * restitution;
    }
    // right
    else if (state.positionX > maxX) {
      state.positionX = maxX;
      state.velocityX = -Math.abs(state.velocityX) * restitution;
    }

    // top
    if (state.positionY < minY) {
      state.positionY = minY;
      state.velocityY = Math.abs(state.velocityY) * restitution;
    }

    // bottom 
    if (state.positionY > maxY) {
      state.positionY = maxY;
      state.velocityY = -Math.abs(state.velocityY) * 0.3;
      state.velocityX *= 0.85;
    }
  }
}
