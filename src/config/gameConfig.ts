export const GAME_CONFIG = {
  logicalWidth: 375,
  logicalHeight: 667,

  fieldPadding: 24,
  fieldTop: 80,
  fieldBottom: 540,

  pusherY: 480,
  pusherHeight: 52,
  pusherWidth: 150,
  pusherSpeed: 2.0,
  pusherAmplitude: 75,

  gravity: 1400,
  friction: 0.982,
  wallRestitution: 0.6,
  coinRestitution: 0.55,
  coinMass: 1.0,

} as const;

export type GameConfig = typeof GAME_CONFIG;