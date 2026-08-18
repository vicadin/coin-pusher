export const GAME_CONFIG = {
  logicalWidth: 375,
  logicalHeight: 667,

  fieldPadding: 24,
  fieldTop: 80,
  fieldBottom: 540,
} as const;

export type GameConfig = typeof GAME_CONFIG;