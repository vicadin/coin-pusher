export type CoinState = {
  id: number;
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  isActive: boolean;
  isDropped: boolean;
  isCollected: boolean;
};

export function createCoinState(
  id: number,
  positionX = 0,
  positionY = 0,
  radius = 16,
  isDropped = false,
): CoinState {
  return {
    id,
    positionX,
    positionY,
    velocityX: 0,
    velocityY: 0,
    radius,
    isActive: true,
    isDropped,
    isCollected: false,
  };
}