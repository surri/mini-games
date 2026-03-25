import type { RacePhase, Obstacle, PlayerPhysics } from '../types'
import { RACE_CONFIG, OBSTACLE_TYPES, OBSTACLE_SPAWN } from './raceConfig'

export function getPhase(leaderPosition: number): RacePhase {
  if (leaderPosition < RACE_CONFIG.PHASE_MIDRACE) return 'opening'
  if (leaderPosition < RACE_CONFIG.PHASE_FINAL) return 'midrace'
  return 'finalStretch'
}

export function createPlayerPhysics(): PlayerPhysics {
  return {
    momentum: 1.0,
    momentumDirection: Math.random() > 0.5 ? 1 : -1,
    stunTicksRemaining: 0,
    slowTicksRemaining: 0,
    slowMultiplier: 1,
    boostTicksRemaining: 0,
    boostMultiplier: 1,
  }
}

export function updateMomentum(physics: PlayerPhysics): PlayerPhysics {
  const { MOMENTUM } = RACE_CONFIG
  const newDirection =
    Math.random() < MOMENTUM.shiftChance
      ? (physics.momentumDirection * -1) as 1 | -1
      : physics.momentumDirection

  const newMomentum = Math.min(
    MOMENTUM.max,
    Math.max(
      MOMENTUM.min,
      physics.momentum + newDirection * MOMENTUM.driftRate
    )
  )

  return { ...physics, momentumDirection: newDirection, momentum: newMomentum }
}

interface SpeedParams {
  phase: RacePhase
  baseSpeed: number
  physics: PlayerPhysics
  playerPosition: number
  leaderPosition: number
}

export function calculateSpeed(params: SpeedParams): number {
  const { phase, baseSpeed, physics, playerPosition, leaderPosition } = params
  const phaseSpeed = RACE_CONFIG.SPEED[phase]
  const burstConfig = RACE_CONFIG.BURST[phase]
  const stumbleConfig = RACE_CONFIG.STUMBLE[phase]
  const rb = RACE_CONFIG.RUBBER_BAND

  if (physics.stunTicksRemaining > 0) return 0

  let speed = (baseSpeed + Math.random() * phaseSpeed.randomFactor) * physics.momentum

  if (Math.random() < burstConfig.chance) {
    speed += burstConfig.bonus
  } else if (Math.random() < stumbleConfig.chance) {
    speed = Math.max(0, speed - stumbleConfig.penalty)
  }

  const gap = leaderPosition - playerPosition
  if (gap > rb.distanceThreshold) {
    speed += Math.min(gap * rb.scaleFactor, rb.maxBoost)
  }

  if (physics.slowTicksRemaining > 0) {
    speed *= physics.slowMultiplier
  }
  if (physics.boostTicksRemaining > 0) {
    speed *= physics.boostMultiplier
  }

  return speed
}

export function tickPlayerPhysics(physics: PlayerPhysics): PlayerPhysics {
  return {
    ...physics,
    stunTicksRemaining: Math.max(0, physics.stunTicksRemaining - 1),
    slowTicksRemaining: Math.max(0, physics.slowTicksRemaining - 1),
    boostTicksRemaining: Math.max(0, physics.boostTicksRemaining - 1),
  }
}

export function shouldSpawnObstacle(
  phase: RacePhase,
  activeCount: number,
  tick: number
): boolean {
  if (tick % OBSTACLE_SPAWN.checkIntervalTicks !== 0) return false
  if (activeCount >= OBSTACLE_SPAWN.maxActive) return false
  return Math.random() < OBSTACLE_SPAWN.spawnChance[phase]
}

export function generateObstacle(
  leaderPosition: number,
  playerIds: string[],
  leaderId: string,
  tick: number,
  positions?: Record<string, number>
): Obstacle {
  const typeKeys = Object.keys(OBSTACLE_TYPES)
  const weights = typeKeys.map((k) => OBSTACLE_TYPES[k].spawnWeight)
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * totalWeight
  let selectedType = typeKeys[0]
  for (let i = 0; i < typeKeys.length; i++) {
    roll -= weights[i]
    if (roll <= 0) {
      selectedType = typeKeys[i]
      break
    }
  }

  const laneWeights = playerIds.map((id) =>
    id === leaderId ? OBSTACLE_SPAWN.leaderTargetWeight : 1
  )
  const totalLaneWeight = laneWeights.reduce((a, b) => a + b, 0)
  let laneRoll = Math.random() * totalLaneWeight
  let selectedLane = playerIds[0]
  for (let i = 0; i < playerIds.length; i++) {
    laneRoll -= laneWeights[i]
    if (laneRoll <= 0) {
      selectedLane = playerIds[i]
      break
    }
  }

  const targetPosition = positions?.[selectedLane] ?? leaderPosition
  const offset =
    OBSTACLE_SPAWN.positionAheadMin +
    Math.random() * (OBSTACLE_SPAWN.positionAheadMax - OBSTACLE_SPAWN.positionAheadMin)
  const position = Math.min(95, Math.max(targetPosition + 2, targetPosition + offset))

  return {
    id: `obs_${tick}_${Math.random().toString(36).slice(2, 6)}`,
    type: selectedType,
    lane: selectedLane,
    position,
    triggered: false,
    createdAtTick: tick,
  }
}

export function checkObstacleCollision(
  playerPosition: number,
  obstacle: Obstacle
): boolean {
  if (obstacle.triggered) return false
  return Math.abs(playerPosition - obstacle.position) < OBSTACLE_SPAWN.collisionRadius
}

export function applyObstacleEffect(
  physics: PlayerPhysics,
  obstacleType: string
): PlayerPhysics {
  const config = OBSTACLE_TYPES[obstacleType]
  if (!config) return physics

  switch (config.effect) {
    case 'stun':
      return { ...physics, stunTicksRemaining: config.duration }
    case 'slow':
      return {
        ...physics,
        slowTicksRemaining: config.duration,
        slowMultiplier: config.multiplier,
      }
    case 'boost':
      return {
        ...physics,
        boostTicksRemaining: config.duration,
        boostMultiplier: config.multiplier,
      }
  }
}

export function getLeaderId(positions: Record<string, number>): string {
  const entries = Object.entries(positions)
  return entries.reduce((best, curr) =>
    curr[1] > best[1] ? curr : best
  )[0]
}
