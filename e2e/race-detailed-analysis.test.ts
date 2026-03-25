/**
 * 레이스 상세 분석: 승률, 아이템 분포, 구간별 타이밍
 */

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
  spawnChance: { opening: 0.04, midrace: 0.10, finalStretch: 0.12 } as Record<string, number>,
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

interface RaceStats {
  winnerId: number
  loserId: number
  totalTicks: number
  baseSpeeds: number[]
  phaseTickCounts: Record<Phase, number>
  obstaclesByPhase: Record<Phase, number>
  obstaclesByType: Record<string, number>
  obstaclePositions: number[]
}

function simulateRace(playerCount: number): RaceStats {
  const positions = new Array(playerCount).fill(0)
  const baseSpeeds = Array.from({ length: playerCount }, () =>
    RACE_CONFIG.SPEED.midrace.base + Math.random() * 0.05
  )
  const physics: Physics[] = Array.from({ length: playerCount }, () => ({
    momentum: 1.0,
    momentumDirection: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
    stunTicksRemaining: 0, slowTicksRemaining: 0, slowMultiplier: 1,
    boostTicksRemaining: 0, boostMultiplier: 1,
  }))

  interface Obs { lane: number; position: number; triggered: boolean; createdAtTick: number; type: string }
  const obstacles: Obs[] = []
  let tick = 0
  let prevPhase: Phase = 'opening'

  const phaseTickCounts: Record<Phase, number> = { opening: 0, midrace: 0, finalStretch: 0 }
  const obstaclesByPhase: Record<Phase, number> = { opening: 0, midrace: 0, finalStretch: 0 }
  const obstaclesByType: Record<string, number> = {}
  const obstaclePositions: number[] = []

  while (true) {
    tick++
    const leaderPos = Math.max(...positions, 0)
    const leaderId = positions.indexOf(Math.max(...positions))
    const phase = getPhase(leaderPos)
    phaseTickCounts[phase]++

    const order = Array.from({ length: playerCount }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = order[i]; order[i] = order[j]; order[j] = tmp
    }

    for (const idx of order) {
      if (positions[idx] >= RACE_CONFIG.FINISH_LINE) continue
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

    if (tick % OBSTACLE_SPAWN.checkIntervalTicks === 0) {
      const active = obstacles.filter(o => !o.triggered).length
      if (active < OBSTACLE_SPAWN.maxActive && Math.random() < OBSTACLE_SPAWN.spawnChance[phase]) {
        const typeKeys = Object.keys(OBSTACLE_TYPES)
        const weights = typeKeys.map(k => OBSTACLE_TYPES[k].spawnWeight)
        const total = weights.reduce((a: number, b: number) => a + b, 0)
        let roll = Math.random() * total
        let selType = typeKeys[0]
        for (let i = 0; i < typeKeys.length; i++) { roll -= weights[i]; if (roll <= 0) { selType = typeKeys[i]; break } }

        const laneWeights = Array.from({ length: playerCount }, (_, i) => i === leaderId ? OBSTACLE_SPAWN.leaderTargetWeight : 1)
        const laneTotal = laneWeights.reduce((a, b) => a + b, 0)
        let laneRoll = Math.random() * laneTotal
        let lane = 0
        for (let i = 0; i < playerCount; i++) { laneRoll -= laneWeights[i]; if (laneRoll <= 0) { lane = i; break } }

        const targetPos = positions[lane]
        const offset = OBSTACLE_SPAWN.positionAheadMin + Math.random() * (OBSTACLE_SPAWN.positionAheadMax - OBSTACLE_SPAWN.positionAheadMin)
        const pos = Math.min(95, Math.max(targetPos + 2, targetPos + offset))

        obstacles.push({ lane, position: pos, triggered: false, createdAtTick: tick, type: selType })
        obstaclesByPhase[phase]++
        obstaclesByType[selType] = (obstaclesByType[selType] ?? 0) + 1
        obstaclePositions.push(pos)
      }
    }

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

    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].triggered || tick - obstacles[i].createdAtTick >= OBSTACLE_SPAWN.lifetimeTicks) obstacles.splice(i, 1)
    }

    const finishers = order.filter(i => positions[i] >= RACE_CONFIG.FINISH_LINE)
    if (finishers.length > 0) {
      return {
        winnerId: finishers[0],
        loserId: positions.indexOf(Math.min(...positions)),
        totalTicks: tick,
        baseSpeeds,
        phaseTickCounts,
        obstaclesByPhase,
        obstaclesByType,
        obstaclePositions,
      }
    }
    if (tick > 50000) {
      return { winnerId: 0, loserId: playerCount - 1, totalTicks: tick, baseSpeeds, phaseTickCounts, obstaclesByPhase, obstaclesByType, obstaclePositions }
    }
  }
}

// === 실행 ===
const PLAYER_COUNT = 10
const RACE_COUNT = 100

const wins = new Array(PLAYER_COUNT).fill(0)
const losses = new Array(PLAYER_COUNT).fill(0)
let winnerHadHighestBase = 0
let totalTicks = 0
const allPhaseTicks: Record<Phase, number> = { opening: 0, midrace: 0, finalStretch: 0 }
const allObsByPhase: Record<Phase, number> = { opening: 0, midrace: 0, finalStretch: 0 }
const allObsByType: Record<string, number> = {}
const allObsPositions: number[] = []

for (let r = 0; r < RACE_COUNT; r++) {
  const stats = simulateRace(PLAYER_COUNT)
  wins[stats.winnerId]++
  losses[stats.loserId]++
  totalTicks += stats.totalTicks

  const maxBase = Math.max(...stats.baseSpeeds)
  if (stats.baseSpeeds[stats.winnerId] === maxBase) winnerHadHighestBase++

  for (const phase of ['opening', 'midrace', 'finalStretch'] as Phase[]) {
    allPhaseTicks[phase] += stats.phaseTickCounts[phase]
    allObsByPhase[phase] += stats.obstaclesByPhase[phase]
  }
  for (const [type, count] of Object.entries(stats.obstaclesByType)) {
    allObsByType[type] = (allObsByType[type] ?? 0) + count
  }
  allObsPositions.push(...stats.obstaclePositions)
}

console.log(`\n${'='.repeat(60)}`)
console.log(`  10명 100회 레이스 상세 분석`)
console.log(`${'='.repeat(60)}\n`)

// 1. 승률
console.log('--- 1. 트랙별 승률 ---')
console.log('트랙 | 승리 | 패배 | 승률')
console.log('-----|------|------|------')
for (let i = 0; i < PLAYER_COUNT; i++) {
  console.log(`  ${(i + 1).toString().padStart(2)}  |  ${wins[i].toString().padStart(3)} |  ${losses[i].toString().padStart(3)} | ${(wins[i] / RACE_COUNT * 100).toFixed(1)}%`)
}
const expectedRate = 100 / PLAYER_COUNT
const maxDev = Math.max(...wins.map(w => Math.abs(w / RACE_COUNT * 100 - expectedRate)))
console.log(`기대 승률: ${expectedRate}% | 최대 편차: ${maxDev.toFixed(1)}%`)

// 2. baseSpeed 상관관계
console.log(`\n--- 2. baseSpeed와 승리 상관관계 ---`)
console.log(`가장 높은 baseSpeed를 가진 플레이어가 우승: ${winnerHadHighestBase}/${RACE_COUNT} (${winnerHadHighestBase}%)`)

// 3. 구간별 소요 시간
console.log(`\n--- 3. 구간별 소요 틱 (평균) ---`)
const avgTicks = totalTicks / RACE_COUNT
console.log(`평균 레이스 길이: ${avgTicks.toFixed(0)} 틱`)
for (const phase of ['opening', 'midrace', 'finalStretch'] as Phase[]) {
  const avg = allPhaseTicks[phase] / RACE_COUNT
  const pct = (avg / avgTicks * 100).toFixed(1)
  const bar = '█'.repeat(Math.round(avg / 10))
  console.log(`  ${phase.padEnd(14)} ${avg.toFixed(0).padStart(4)} 틱 (${pct}%) ${bar}`)
}

// 4. 구간별 아이템 스폰
console.log(`\n--- 4. 구간별 아이템 스폰 (평균/레이스) ---`)
for (const phase of ['opening', 'midrace', 'finalStretch'] as Phase[]) {
  const avg = allObsByPhase[phase] / RACE_COUNT
  const bar = '█'.repeat(Math.round(avg))
  console.log(`  ${phase.padEnd(14)} ${avg.toFixed(1).padStart(5)}개 ${bar}`)
}
const totalObs = Object.values(allObsByPhase).reduce((a, b) => a + b, 0) / RACE_COUNT
console.log(`  총 평균: ${totalObs.toFixed(1)}개/레이스`)

// 5. 아이템 타입 분포
console.log(`\n--- 5. 아이템 타입 분포 ---`)
const totalTypeObs = Object.values(allObsByType).reduce((a, b) => a + b, 0)
for (const [type, count] of Object.entries(allObsByType)) {
  console.log(`  ${type.padEnd(10)} ${count.toString().padStart(4)}개 (${(count / totalTypeObs * 100).toFixed(1)}%)`)
}

// 6. 아이템 위치 분포 (10% 구간)
console.log(`\n--- 6. 아이템 위치 분포 (구간별) ---`)
const positionBuckets = new Array(10).fill(0)
for (const pos of allObsPositions) {
  const bucket = Math.min(9, Math.floor(pos / 10))
  positionBuckets[bucket]++
}
for (let i = 0; i < 10; i++) {
  const range = `${i * 10}-${(i + 1) * 10}`
  const bar = '█'.repeat(Math.round(positionBuckets[i] / 5))
  console.log(`  ${range.padEnd(6)} ${positionBuckets[i].toString().padStart(4)}개 ${bar}`)
}

// 판정
console.log(`\n${'='.repeat(60)}`)
if (maxDev > 15) console.log('⚠️  승률 편향 감지!')
else console.log('✅ 승률 공정성 통과')

if (winnerHadHighestBase > 40) console.log('⚠️  baseSpeed가 승패를 지배!')
else console.log('✅ baseSpeed 영향력 적절')

if (allObsByPhase.opening === 0) console.log('⚠️  opening 구간 아이템 0개!')
else console.log('✅ 전 구간 아이템 분포')
