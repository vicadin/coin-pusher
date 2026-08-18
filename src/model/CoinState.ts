export type CoinState = {
  readonly id: number;
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
  positionX: number,
  positionY: number,
  radius: number,
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
