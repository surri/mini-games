export const LADDER_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,

  BRIDGE_DENSITY: 3.5,
  MIN_BRIDGE_Y_GAP: 0.06,
  BRIDGE_Y_START: 0.08,
  BRIDGE_Y_END: 0.92,

  ANIMATION: {
    PATH_DURATION_MS: 2500,
    PAUSE_BETWEEN_MS: 800,
    COUNTDOWN_DURATION_MS: 3000,
  },

  COLORS: [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F0A500',
    '#E056A0',
  ],
} as const
