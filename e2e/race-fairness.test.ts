/**
 * Headless race simulation - no Firebase, no browser
 * Tests win rate fairness across 10 players over 100 races
 */

// Inline the config and engine logic to run without bundler
const RACE_CONFIG = {
  FINISH_LINE: 100,
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
  RUBBER_BAND: { maxBoost: 0.15, distanceThreshold: 15, scaleFactor: 0.01 },
  MOMENTUM: { driftRate: 0.002, min: 0.85, max: 1.20, shiftChance: 0.03 },
}

const OBSTACLE_SPAWN = {
  checkIntervalTicks: 5,
  spawnChance: { opening: 0, midrace: 0.08, finalStretch: 0.12 },
  positionAheadMin: -5,
  positionAheadMax: 15,
  leaderTargetWeight: 2,
  maxActive: 6,
  lifetimeTicks: 60,
  collisionRadius: 2,
}

const OBSTACLE_TYPES: Record<string, any> = {
  poop: { effect: 'stun', duration: 16, multiplier: 0, spawnWeight: 3 },
  banana: { effect: 'slow', duration: 16, multiplier: 0.5, spawnWeight: 3 },
  rocket: { effect: 'boost', duration: 16, multiplier: 2.0, spawnWeight: 2 },
}

type Phase = 'opening' | 'midrace' | 'finalStretch'

function getPhase(pos: number): Phase {
  if (pos < RACE_CONFIG.PHASE_MIDRACE) return 'opening'
  if (pos < RACE_CONFIG.PHASE_FINAL) return 'midrace'
  return 'finalStretch'
}

interface Physics {
  momentum: number
  momentumDirection: 1 | -1
  stunTicksRemaining: number
  slowTicksRemaining: number
  slowMultiplier: number
  boostTicksRemaining: number
  boostMultiplier: number
}

function createPhysics(): Physics {
  return {
    momentum: 1.0,
    momentumDirection: Math.random() > 0.5 ? 1 : -1,
    stunTicksRemaining: 0, slowTicksRemaining: 0, slowMultiplier: 1,
    boostTicksRemaining: 0, boostMultiplier: 1,
  }
}

function simulateRace(playerCount: number): { winnerId: number; loserId: number } {
  const positions = new Array(playerCount).fill(0)
  const baseSpeeds = Array.from({ length: playerCount }, () =>
    RACE_CONFIG.SPEED.midrace.base + Math.random() * 0.05
  )
  const physics: Physics[] = Array.from({ length: playerCount }, () => createPhysics())

  interface Obs { lane: number; position: number; triggered: boolean; createdAtTick: number; type: string }
  const obstacles: Obs[] = []
  let tick = 0

  while (true) {
    tick++
    const leaderPos = Math.max(...positions, 0)
    const leaderId = positions.indexOf(Math.max(...positions))
    const phase = getPhase(leaderPos)

    // SHUFFLE player processing order each tick for fairness
    const order = Array.from({ length: playerCount }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = order[i]; order[i] = order[j]; order[j] = tmp
    }

    for (const idx of order) {
      if (positions[idx] >= RACE_CONFIG.FINISH_LINE) continue

      // momentum
      const p = physics[idx]
      if (Math.random() < RACE_CONFIG.MOMENTUM.shiftChance) {
        p.momentumDirection = (p.momentumDirection * -1) as 1 | -1
      }
      p.momentum = Math.min(RACE_CONFIG.MOMENTUM.max, Math.max(RACE_CONFIG.MOMENTUM.min,
        p.momentum + p.momentumDirection * RACE_CONFIG.MOMENTUM.driftRate))

      if (p.stunTicksRemaining > 0) {
        p.stunTicksRemaining--; p.slowTicksRemaining = Math.max(0, p.slowTicksRemaining - 1)
        p.boostTicksRemaining = Math.max(0, p.boostTicksRemaining - 1)
        continue
      }

      const phaseSpeed = RACE_CONFIG.SPEED[phase]
      const burstConfig = RACE_CONFIG.BURST[phase]
      const stumbleConfig = RACE_CONFIG.STUMBLE[phase]
      const rb = RACE_CONFIG.RUBBER_BAND

      let speed = (baseSpeeds[idx] + Math.random() * phaseSpeed.randomFactor) * p.momentum
      if (Math.random() < burstConfig.chance) speed += burstConfig.bonus
      else if (Math.random() < stumbleConfig.chance) speed = Math.max(0, speed - stumbleConfig.penalty)

      const gap = leaderPos - positions[idx]
      if (gap > rb.distanceThreshold) speed += Math.min(gap * rb.scaleFactor, rb.maxBoost)

      if (p.slowTicksRemaining > 0) speed *= p.slowMultiplier
      if (p.boostTicksRemaining > 0) speed *= p.boostMultiplier

      positions[idx] = Math.min(RACE_CONFIG.FINISH_LINE, positions[idx] + speed)
      p.stunTicksRemaining = Math.max(0, p.stunTicksRemaining - 1)
      p.slowTicksRemaining = Math.max(0, p.slowTicksRemaining - 1)
      p.boostTicksRemaining = Math.max(0, p.boostTicksRemaining - 1)
    }

    // obstacle spawn
    if (tick % OBSTACLE_SPAWN.checkIntervalTicks === 0) {
      const active = obstacles.filter(o => !o.triggered).length
      if (active < OBSTACLE_SPAWN.maxActive && Math.random() < (OBSTACLE_SPAWN.spawnChance as any)[phase]) {
        const typeKeys = Object.keys(OBSTACLE_TYPES)
        const weights = typeKeys.map(k => OBSTACLE_TYPES[k].spawnWeight)
        const total = weights.reduce((a: number, b: number) => a + b, 0)
        let roll = Math.random() * total
        let selType = typeKeys[0]
        for (let i = 0; i < typeKeys.length; i++) { roll -= weights[i]; if (roll <= 0) { selType = typeKeys[i]; break } }

        // Lane selection
        const laneWeights = Array.from({ length: playerCount }, (_, i) => i === leaderId ? OBSTACLE_SPAWN.leaderTargetWeight : 1)
        const laneTotal = laneWeights.reduce((a, b) => a + b, 0)
        let laneRoll = Math.random() * laneTotal
        let lane = 0
        for (let i = 0; i < playerCount; i++) { laneRoll -= laneWeights[i]; if (laneRoll <= 0) { lane = i; break } }

        // FIX: position relative to TARGET player, not leader
        const targetPos = positions[lane]
        const offset = OBSTACLE_SPAWN.positionAheadMin + Math.random() * (OBSTACLE_SPAWN.positionAheadMax - OBSTACLE_SPAWN.positionAheadMin)
        const pos = Math.min(95, Math.max(targetPos + 2, targetPos + offset))

        obstacles.push({ lane, position: pos, triggered: false, createdAtTick: tick, type: selType })
      }
    }

    // collisions
    for (let idx = 0; idx < playerCount; idx++) {
      for (const obs of obstacles) {
        if (obs.lane !== idx || obs.triggered) continue
        if (Math.abs(positions[idx] - obs.position) < OBSTACLE_SPAWN.collisionRadius) {
          obs.triggered = true
          const config = OBSTACLE_TYPES[obs.type]
          if (config.effect === 'stun') physics[idx].stunTicksRemaining = config.duration
          else if (config.effect === 'slow') { physics[idx].slowTicksRemaining = config.duration; physics[idx].slowMultiplier = config.multiplier }
          else if (config.effect === 'boost') { physics[idx].boostTicksRemaining = config.duration; physics[idx].boostMultiplier = config.multiplier }
        }
      }
    }

    // expire
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].triggered || tick - obstacles[i].createdAtTick >= OBSTACLE_SPAWN.lifetimeTicks) obstacles.splice(i, 1)
    }

    // check finish
    const finishers = order.filter(i => positions[i] >= RACE_CONFIG.FINISH_LINE)
    if (finishers.length > 0) {
      const winnerId = finishers[0]
      const loserId = positions.indexOf(Math.min(...positions))
      return { winnerId, loserId }
    }

    if (tick > 50000) {
      return { winnerId: 0, loserId: playerCount - 1 }
    }
  }
}

// Run simulation
const PLAYER_COUNT = 10
const RACE_COUNT = 100

const wins: number[] = new Array(PLAYER_COUNT).fill(0)
const losses: number[] = new Array(PLAYER_COUNT).fill(0)

for (let r = 0; r < RACE_COUNT; r++) {
  const { winnerId, loserId } = simulateRace(PLAYER_COUNT)
  wins[winnerId]++
  losses[loserId]++
}

console.log(`\n=== ${PLAYER_COUNT}명 ${RACE_COUNT}회 레이스 시뮬레이션 ===\n`)
console.log('트랙 | 승리 | 패배 | 승률')
console.log('-----|------|------|------')
for (let i = 0; i < PLAYER_COUNT; i++) {
  console.log(`  ${(i + 1).toString().padStart(2)}  |  ${wins[i].toString().padStart(3)} |  ${losses[i].toString().padStart(3)} | ${(wins[i] / RACE_COUNT * 100).toFixed(1)}%`)
}

const expectedWinRate = 100 / PLAYER_COUNT
const maxDeviation = Math.max(...wins.map(w => Math.abs(w / RACE_COUNT * 100 - expectedWinRate)))
console.log(`\n기대 승률: ${expectedWinRate}%`)
console.log(`최대 편차: ${maxDeviation.toFixed(1)}%`)

if (maxDeviation > 15) {
  console.log('⚠️  편향 감지! 최대 편차가 15%를 초과합니다.')
  process.exit(1)
} else {
  console.log('✅ 공정성 통과')
}
