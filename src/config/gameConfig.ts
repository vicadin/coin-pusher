export const GAME_CONFIG = {
  logicalWidth: 375,
  logicalHeight: 667,

  initialCoins: 120,

  gravity: 1400,
  friction: 0.982,
  wallRestitution: 0.6,
  coinRestitution: 0.55,
  coinMass: 1.0,

  fieldPadding: 24,
  fieldTop: 70,
  fieldBottom: 524,

  pusherY: 468,
  pusherHeight: 50,
  pusherWidth: 145,
  pusherSpeed: 2.0,
  pusherAmplitude: 75,

  maxDropsBeforeCta: 3,
  settleVelocityThreshold: 22,
  settleFramesRequired: 30,
  dropCooldownMs: 800,

  screenShakeIntensity: 8,
  screenShakeDuration: 0.35,

  coinPoolSize: 60,
  particlePoolSize: 120,
  floatingTextPoolSize: 12,
} as const;

export type GameConfig = typeof GAME_CONFIG;
