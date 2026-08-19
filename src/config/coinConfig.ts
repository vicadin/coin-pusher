export const COIN_CONFIG = {
  radius: 17,
  dropRadius: 17,
  initialCount: 16,

  colors: {
    outer: 0xffb300,
    inner: 0xffca28,
    highlight: 0xfff9c4,
    edge: 0xe65100,
    symbol: 0xf57f17,
    star: 0xffffff,
  },

  spawnImpulseY: 120,
  spawnImpulseXRange: 45,
} as const;

export type CoinConfig = typeof COIN_CONFIG;
