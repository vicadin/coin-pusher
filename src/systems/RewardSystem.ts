import { GAME_CONFIG } from '@/config/gameConfig';
import { GameEvents, type EventBus } from '@/core/EventBus';
import type { GameState } from '@/model/GameState';
import type { Coin } from '@/components/Coin';
import type { FieldBounds } from '@/systems/PhysicsSystem';
import { isInRewardZone } from '@/systems/CollisionSystem';

export type RewardResult = {
  collected: boolean;
  amount: number;
  coin: Coin | null;
  isJackpot: boolean;
};

export class RewardSystem {
  private readonly eventBus: EventBus;
  private readonly gameState: GameState;
  private collectedThisDrop = 0;

  constructor(eventBus: EventBus, gameState: GameState) {
    this.eventBus = eventBus;
    this.gameState = gameState;
  }

  onNewDrop(): void {
    this.collectedThisDrop = 0;
  }

  checkRewards(coins: Coin[], bounds: FieldBounds): RewardResult {
    for (const coin of coins) {
      if (!coin.state.isActive || coin.state.isCollected) {
        continue;
      }

      if (isInRewardZone(coin, bounds)) {
        return this.collectCoin(coin);
      }
    }

    return { collected: false, amount: 0, coin: null, isJackpot: false };
  }

  private collectCoin(coin: Coin): RewardResult {
    coin.state.isCollected = true;
    coin.state.isActive = false;
    coin.showGlow();

    this.collectedThisDrop += 1;
    this.gameState.rewardCount += 1;

    let amount = 10;
    let isJackpot = false;

    if (this.gameState.dropCount === 1) {
      amount = 10;
    } else if (this.gameState.dropCount === 2) {
      amount = this.collectedThisDrop === 1 ? 10 : 20;
    } else {
      // drop 3 — Jackpot round
      if (this.collectedThisDrop === 1) {
        amount = 100;
        isJackpot = true;
      } else {
        amount = 20;
      }
    }

    this.gameState.totalCoins += amount;
    this.gameState.totalWon += amount;

    this.eventBus.emit(GameEvents.COIN_COLLECTED, {
      amount,
      totalCoins: this.gameState.totalCoins,
      coin,
      isJackpot,
    });

    return { collected: true, amount, coin, isJackpot };
  }

  shouldShowCta(): boolean {
    return this.gameState.dropCount >= GAME_CONFIG.maxDropsBeforeCta;
  }
}
