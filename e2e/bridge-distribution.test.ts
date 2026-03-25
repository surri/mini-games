/**
 * 브릿지 균등 분포 테스트
 * 2~12명까지 각 100회 생성, 페어별 브릿지 수 평균/편차 확인
 */

const LADDER_CONFIG = {
  BRIDGE_DENSITY: 5,
  MIN_BRIDGE_Y_GAP: 0.045,
  BRIDGE_Y_START: 0.08,
  BRIDGE_Y_END: 0.92,
}

interface Bridge {
  fromLine: number
  toLine: number
  yPosition: number
}

function generateBridges(lineCount: number): Bridge[] {
  const bridges: Bridge[] = []
  const pairCount = lineCount - 1
  const bridgesPerPair = Math.floor(LADDER_CONFIG.BRIDGE_DENSITY)
  const yRange = LADDER_CONFIG.BRIDGE_Y_END - LADDER_CONFIG.BRIDGE_Y_START

  for (let pair = 0; pair < pairCount; pair++) {
    const pairBridgeCount = bridgesPerPair + (Math.random() > 0.5 ? 1 : 0)
    const pairUsedY: number[] = []

    for (let b = 0; b < pairBridgeCount; b++) {
      let attempts = 0
      let yPosition = 0

      do {
        yPosition = LADDER_CONFIG.BRIDGE_Y_START + Math.random() * yRange
        attempts++
      } while (
        attempts < 50 &&
        pairUsedY.some((y: number) => Math.abs(y - yPosition) < LADDER_CONFIG.MIN_BRIDGE_Y_GAP)
      )

      if (attempts < 50) {
        pairUsedY.push(yPosition)
        bridges.push({ fromLine: pair, toLine: pair + 1, yPosition })
      }
    }
  }

  return bridges
}

const TRIALS = 100

console.log('=== 브릿지 균등 분포 테스트 (100회 반복) ===\n')

for (let playerCount = 2; playerCount <= 12; playerCount++) {
  const pairCount = playerCount - 1
  const pairTotals = new Array(pairCount).fill(0)

  for (let t = 0; t < TRIALS; t++) {
    const bridges = generateBridges(playerCount)
    for (const b of bridges) {
      pairTotals[b.fromLine]++
    }
  }

  const pairAvgs = pairTotals.map((total: number) => total / TRIALS)
  const mean = pairAvgs.reduce((a: number, b: number) => a + b, 0) / pairAvgs.length
  const maxDev = Math.max(...pairAvgs.map((avg: number) => Math.abs(avg - mean)))
  const minAvg = Math.min(...pairAvgs)
  const maxAvg = Math.max(...pairAvgs)

  console.log(`${playerCount.toString().padStart(2)}명 (${pairCount}페어) | 평균 ${mean.toFixed(1)}개/페어 | 범위 ${minAvg.toFixed(1)}~${maxAvg.toFixed(1)} | 최대편차 ${maxDev.toFixed(2)}`)

  if (maxDev > 1.0) {
    console.log(`  ⚠️  편차 과대!`)
  }
}

console.log('\n--- 12명 상세 (페어별 평균) ---')
const pairCount = 11
const pairTotals = new Array(pairCount).fill(0)
for (let t = 0; t < TRIALS; t++) {
  const bridges = generateBridges(12)
  for (const b of bridges) {
    pairTotals[b.fromLine]++
  }
}
console.log('페어  | 평균 브릿지')
console.log('------|----------')
for (let p = 0; p < pairCount; p++) {
  const avg = pairTotals[p] / TRIALS
  const bar = '█'.repeat(Math.round(avg))
  console.log(`${p.toString().padStart(2)}-${(p + 1).toString().padStart(2)} |  ${avg.toFixed(1)}  ${bar}`)
}
