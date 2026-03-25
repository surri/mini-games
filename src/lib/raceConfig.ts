import type { RacePhase } from '../types'

export const RACE_CONFIG = {
  FINISH_LINE: 100,
  UPDATE_INTERVAL_MS: 100,

  PHASE_MIDRACE: 25,
  PHASE_FINAL: 70,

  SPEED: {
    opening: { base: 0.10, randomFactor: 0.12 },
    midrace: { base: 0.15, randomFactor: 0.25 },
    finalStretch: { base: 0.18, randomFactor: 0.35 },
  },

  BURST: {
    opening: { chance: 0.005, bonus: 0.4 },
    midrace: { chance: 0.02, bonus: 0.8 },
    finalStretch: { chance: 0.04, bonus: 1.2 },
  },

  STUMBLE: {
    opening: { chance: 0, penalty: 0 },
    midrace: { chance: 0.008, penalty: 0.5 },
    finalStretch: { chance: 0.015, penalty: 0.8 },
  },

  RUBBER_BAND: {
    maxBoost: 0.15,
    distanceThreshold: 15,
    scaleFactor: 0.01,
  },

  MOMENTUM: {
    driftRate: 0.002,
    min: 0.85,
    max: 1.20,
    shiftChance: 0.03,
  },
} as const

export interface ObstacleTypeConfig {
  emoji: string
  effect: 'stun' | 'slow' | 'boost'
  duration: number
  multiplier: number
  flashColor: string
  spawnWeight: number
}

export const OBSTACLE_TYPES: Record<string, ObstacleTypeConfig> = {
  poop: {
    emoji: '💩',
    effect: 'stun',
    duration: 16,
    multiplier: 0,
    flashColor: 'rgba(139, 90, 43, 0.3)',
    spawnWeight: 3,
  },
  banana: {
    emoji: '🍌',
    effect: 'slow',
    duration: 16,
    multiplier: 0.5,
    flashColor: 'rgba(255, 220, 50, 0.3)',
    spawnWeight: 3,
  },
  rocket: {
    emoji: '🚀',
    effect: 'boost',
    duration: 16,
    multiplier: 2.0,
    flashColor: 'rgba(255, 80, 50, 0.3)',
    spawnWeight: 2,
  },
}

export const OBSTACLE_SPAWN = {
  checkIntervalTicks: 5,
  spawnChance: {
    opening: 0,
    midrace: 0.08,
    finalStretch: 0.12,
  } as Record<RacePhase, number>,
  positionAheadMin: -5,
  positionAheadMax: 15,
  leaderTargetWeight: 2,
  maxActive: 6,
  lifetimeTicks: 60,
  collisionRadius: 2,
} as const
