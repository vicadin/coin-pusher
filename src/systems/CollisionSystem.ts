import { GAME_CONFIG } from '@/config/gameConfig';
import { normalize } from '@/utils/math';
import type { Coin } from '@/components/Coin';
import type { FieldBounds } from '@/systems/PhysicsSystem';

export class CollisionSystem {
  resolveCoinCollisions(coins: Coin[]): void {
    const activeCoins = coins.filter(
      (coin) => coin.state.isActive && !coin.state.isCollected,
    );

    for (let i = 0; i < activeCoins.length; i += 1) {
      for (let j = i + 1; j < activeCoins.length; j += 1) {
        this.resolvePair(activeCoins[i], activeCoins[j]);
      }
    }
  }

  isSettled(coins: Coin[]): boolean {
    const activeCoins = coins.filter(
      (coin) => coin.state.isActive && !coin.state.isCollected,
    );

    if (activeCoins.length === 0) {
      return true;
    }

    return activeCoins.every((coin) => {
      const speed = Math.hypot(coin.state.velocityX, coin.state.velocityY);
      return speed < GAME_CONFIG.settleVelocityThreshold;
    });
  }

  private resolvePair(coinA: Coin, coinB: Coin): void {
    const stateA = coinA.state;
    const stateB = coinB.state;

    const deltaX = stateB.positionX - stateA.positionX;
    const deltaY = stateB.positionY - stateA.positionY;
    const distance = Math.hypot(deltaX, deltaY);
    const minDistance = stateA.radius + stateB.radius;

    if (distance >= minDistance || distance === 0) {
      return;
    }

    const normal = normalize(deltaX, deltaY);
    const overlap = minDistance - distance;

    const totalMass = 2;
    stateA.positionX -= (normal.x * overlap) / totalMass;
    stateA.positionY -= (normal.y * overlap) / totalMass;
    stateB.positionX += (normal.x * overlap) / totalMass;
    stateB.positionY += (normal.y * overlap) / totalMass;

    const relativeVelocityX = stateB.velocityX - stateA.velocityX;
    const relativeVelocityY = stateB.velocityY - stateA.velocityY;
    const velocityAlongNormal =
      relativeVelocityX * normal.x + relativeVelocityY * normal.y;

    if (velocityAlongNormal > 0) {
      return;
    }

    const restitution = GAME_CONFIG.coinRestitution;
    const impulse = (-(1 + restitution) * velocityAlongNormal) / totalMass;

    stateA.velocityX -= impulse * normal.x;
    stateA.velocityY -= impulse * normal.y;
    stateB.velocityX += impulse * normal.x;
    stateB.velocityY += impulse * normal.y;
  }
}

export function isInRewardZone(coin: Coin, bounds: FieldBounds): boolean {
  const { state } = coin;
  const halfPusherWidth = bounds.pusherWidth / 2 + 10;
  const inPusherHorizontal =
    state.positionX >= bounds.pusherX - halfPusherWidth &&
    state.positionX <= bounds.pusherX + halfPusherWidth;

  // Reached the moving reward pusher zone at the bottom
  return (
    inPusherHorizontal &&
    state.positionY >= bounds.pusherY - 14 &&
    state.positionY <= bounds.bottom + 10
  );
}
