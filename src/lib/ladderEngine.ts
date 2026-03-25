import { LADDER_CONFIG } from './ladderConfig'
import type { Bridge, LadderPath, LadderPathSegment, LadderResult } from '../types'

function shuffleArray<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export function generateBridges(lineCount: number): Bridge[] {
  const bridges: Bridge[] = []
  const pairCount = lineCount - 1
  const bridgesPerPair = Math.floor(LADDER_CONFIG.BRIDGE_DENSITY)
  const yRange = LADDER_CONFIG.BRIDGE_Y_END - LADDER_CONFIG.BRIDGE_Y_START
  const globalUsedY: number[] = []

  for (let pair = 0; pair < pairCount; pair++) {
    const pairBridgeCount = bridgesPerPair + (Math.random() > 0.5 ? 1 : 0)

    for (let b = 0; b < pairBridgeCount; b++) {
      let attempts = 0
      let yPosition = 0

      do {
        yPosition = LADDER_CONFIG.BRIDGE_Y_START + Math.random() * yRange
        attempts++
      } while (
        attempts < 50 &&
        globalUsedY.some((y) => Math.abs(y - yPosition) < LADDER_CONFIG.MIN_BRIDGE_Y_GAP)
      )

      if (attempts < 50) {
        globalUsedY.push(yPosition)
        bridges.push({
          id: `bridge_${pair}_${b}`,
          fromLine: pair,
          toLine: pair + 1,
          yPosition,
        })
      }
    }
  }

  return bridges
}

export function assignPlayersToLines(playerIds: readonly string[]): Record<string, number> {
  const shuffled = shuffleArray(playerIds)
  const assignments: Record<string, number> = {}
  shuffled.forEach((id, index) => {
    assignments[id] = index
  })
  return assignments
}

export function generateResults(lineCount: number): Record<string, LadderResult> {
  const loserIndex = Math.floor(Math.random() * lineCount)
  const results: Record<string, LadderResult> = {}

  for (let i = 0; i < lineCount; i++) {
    const isLoser = i === loserIndex
    results[String(i)] = {
      lineIndex: i,
      label: isLoser ? '☕ 커피 당첨!' : '✅ 안전!',
      isLoser,
    }
  }

  return results
}

export function getLineX(lineIndex: number, lineCount: number): number {
  if (lineCount <= 1) return 0.5
  const padding = 0.1
  const usable = 1 - padding * 2
  return padding + (lineIndex / (lineCount - 1)) * usable
}

export function tracePath(
  startLine: number,
  bridges: readonly Bridge[],
  lineCount: number
): { endLine: number; segments: LadderPathSegment[] } {
  const sortedBridges = [...bridges].sort((a, b) => a.yPosition - b.yPosition)
  const segments: LadderPathSegment[] = []
  let currentLine = startLine
  let currentY = 0

  for (const bridge of sortedBridges) {
    const isOnLeft = bridge.fromLine === currentLine
    const isOnRight = bridge.toLine === currentLine

    if (!isOnLeft && !isOnRight) continue

    const fromX = getLineX(currentLine, lineCount)
    const toX = fromX
    const bridgeY = bridge.yPosition

    segments.push({
      type: 'vertical',
      fromX,
      fromY: currentY,
      toX,
      toY: bridgeY,
    })

    const nextLine = isOnLeft ? bridge.toLine : bridge.fromLine
    const nextX = getLineX(nextLine, lineCount)

    segments.push({
      type: 'horizontal',
      fromX,
      fromY: bridgeY,
      toX: nextX,
      toY: bridgeY,
    })

    currentLine = nextLine
    currentY = bridgeY
  }

  const finalX = getLineX(currentLine, lineCount)
  segments.push({
    type: 'vertical',
    fromX: finalX,
    fromY: currentY,
    toX: finalX,
    toY: 1,
  })

  return { endLine: currentLine, segments }
}

export function resolveAllPaths(
  playerAssignments: Record<string, number>,
  bridges: readonly Bridge[],
  lineCount: number
): Record<string, LadderPath> {
  const paths: Record<string, LadderPath> = {}

  for (const [playerId, startLine] of Object.entries(playerAssignments)) {
    const { endLine, segments } = tracePath(startLine, bridges, lineCount)
    paths[playerId] = {
      playerId,
      startLine,
      endLine,
      segments,
    }
  }

  return paths
}

export function generateAnimationOrder(playerIds: readonly string[]): string[] {
  return shuffleArray(playerIds)
}

export function segmentsToSVGPath(
  segments: readonly LadderPathSegment[],
  width: number,
  height: number,
  topMargin: number,
  bottomMargin: number
): string {
  if (segments.length === 0) return ''

  const drawableHeight = height - topMargin - bottomMargin

  function toSVGX(normalizedX: number): number {
    return normalizedX * width
  }

  function toSVGY(normalizedY: number): number {
    return topMargin + normalizedY * drawableHeight
  }

  const first = segments[0]
  let d = `M ${toSVGX(first.fromX)} ${toSVGY(first.fromY)}`

  for (const seg of segments) {
    d += ` L ${toSVGX(seg.toX)} ${toSVGY(seg.toY)}`
  }

  return d
}

export function findLoserFromPaths(
  paths: Record<string, LadderPath>,
  results: Record<string, LadderResult>
): string | null {
  for (const [playerId, path] of Object.entries(paths)) {
    const result = results[String(path.endLine)]
    if (result?.isLoser) return playerId
  }
  return null
}
