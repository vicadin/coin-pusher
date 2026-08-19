export type GameState = {
  totalCoins: number;
  initialCoins: number;
  dropCount: number;
  rewardCount: number;
  totalWon: number;
  isInputLocked: boolean;
};

export function createInitialGameState(): GameState {
  return {
    totalCoins: 120,
    initialCoins: 120,
    dropCount: 0,
    rewardCount: 0,
    totalWon: 0,
    isInputLocked: false,
  };
}
