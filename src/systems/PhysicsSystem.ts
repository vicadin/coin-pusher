import { GAME_CONFIG } from '../config/gameConfig';
import type { Coin } from '../components/Coin';

export class PhysicsSystem {

  update(coins: Coin[], deltaSeconds: number): void {
    const { gravity, friction } = GAME_CONFIG;

    for (const coin of coins) {
      if (!coin.state.isActive || coin.state.isCollected) {
        continue;
      }

      const { state } = coin;

      state.velocityY += gravity * deltaSeconds;

      state.velocityX *= Math.pow(friction, deltaSeconds * 60);
      state.velocityY *= Math.pow(friction, deltaSeconds * 60);

      state.positionX += state.velocityX * deltaSeconds;
      state.positionY += state.velocityY * deltaSeconds;

      coin.syncVisual();
    }
  }
}