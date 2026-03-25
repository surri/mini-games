import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { segmentsToSVGPath, getLineX as getLineXNormalized } from '../../lib/ladderEngine'
import { LADDER_CONFIG } from '../../lib/ladderConfig'
import { useLadderAnimation } from '../../hooks/useLadderAnimation'
import type { Player, LadderState } from '../../types'

interface Props {
  players: Record<string, Player>
  ladder: LadderState
}

const SVG_WIDTH = 1000
const SVG_HEIGHT = 1200
const TOP_MARGIN = 100
const BOTTOM_MARGIN = 100

function getLineX(lineIndex: number, lineCount: number): number {
  return getLineXNormalized(lineIndex, lineCount) * SVG_WIDTH
}

function getDrawY(normalizedY: number): number {
  const drawableHeight = SVG_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
  return TOP_MARGIN + normalizedY * drawableHeight
}

export function LadderBoard({ players, ladder }: Props) {
  const {
    bridges,
    playerAssignments,
    results,
    paths,
    animationStatus,
    currentAnimatingPlayer,
    revealedPlayers,
    animationOrder,
  } = ladder

  const { animationProgress } = useLadderAnimation(
    currentAnimatingPlayer,
    revealedPlayers ?? []
  )

  const lineCount = Object.keys(playerAssignments ?? {}).length
  const bridgeList = useMemo(() => Object.values(bridges ?? {}), [bridges])

  const playerColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    const order = animationOrder ?? Object.keys(playerAssignments ?? {})
    order.forEach((id, i) => {
      map[id] = LADDER_CONFIG.COLORS[i % LADDER_CONFIG.COLORS.length]
    })
    return map
  }, [animationOrder, playerAssignments])

  const sortedPlayerEntries = useMemo(() => {
    const assignments = playerAssignments ?? {}
    return Object.entries(assignments).sort(([, a], [, b]) => a - b)
  }, [playerAssignments])

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        style={{ width: '100%', height: 'auto' }}
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const x = getLineX(i, lineCount)
          return (
            <line
              key={`vline-${i}`}
              x1={x}
              y1={TOP_MARGIN}
              x2={x}
              y2={SVG_HEIGHT - BOTTOM_MARGIN}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={3}
            />
          )
        })}

        {bridgeList.map((bridge) => {
          const x1 = getLineX(bridge.fromLine, lineCount)
          const x2 = getLineX(bridge.toLine, lineCount)
          const y = getDrawY(bridge.yPosition)
          return (
            <line
              key={bridge.id}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={3}
            />
          )
        })}

        {paths &&
          (animationOrder ?? []).map((playerId) => {
            const path = paths[playerId]
            if (!path) return null

            const progress = animationProgress[playerId]
            if (progress === undefined || progress <= 0) return null

            const d = segmentsToSVGPath(
              path.segments,
              SVG_WIDTH,
              SVG_HEIGHT,
              TOP_MARGIN,
              BOTTOM_MARGIN
            )
            const color = playerColorMap[playerId]

            return (
              <motion.path
                key={`path-${playerId}`}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            )
          })}

        {sortedPlayerEntries.map(([playerId, lineIndex]) => {
          const x = getLineX(lineIndex, lineCount)
          const player = players[playerId]
          if (!player) return null

          const isAnimating = currentAnimatingPlayer === playerId
          const isRevealed = (revealedPlayers ?? []).includes(playerId)
          const color = playerColorMap[playerId]

          return (
            <g key={`player-${playerId}`}>
              <text
                x={x}
                y={TOP_MARGIN - 40}
                textAnchor="middle"
                fontSize={40}
                style={{
                  filter: isAnimating ? `drop-shadow(0 0 8px ${color})` : 'none',
                }}
              >
                {player.character}
              </text>
              <text
                x={x}
                y={TOP_MARGIN - 10}
                textAnchor="middle"
                fontSize={20}
                fill={isAnimating || isRevealed ? color : 'rgba(255,255,255,0.7)'}
                fontWeight={isAnimating ? 'bold' : 'normal'}
              >
                {player.name}
              </text>
            </g>
          )
        })}

        {Array.from({ length: lineCount }, (_, i) => {
          const x = getLineX(i, lineCount)
          const result = (results ?? {})[String(i)]
          if (!result) return null

          const isRevealed = animationStatus === 'revealed' ||
            (revealedPlayers ?? []).some((pid) => {
              const path = paths?.[pid]
              return path?.endLine === i
            })

          if (!result.isLoser) {
            return (
              <g key={`result-${i}`}>
                <text
                  x={x}
                  y={SVG_HEIGHT - BOTTOM_MARGIN + 50}
                  textAnchor="middle"
                  fontSize={22}
                  fill="rgba(255,255,255,0.3)"
                >
                  ?
                </text>
              </g>
            )
          }

          return (
            <g key={`result-${i}`}>
              {isRevealed ? (
                <motion.text
                  x={x}
                  y={SVG_HEIGHT - BOTTOM_MARGIN + 50}
                  textAnchor="middle"
                  fontSize={28}
                  fill="#FF6B6B"
                  fontWeight="bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  {result.label}
                </motion.text>
              ) : (
                <text
                  x={x}
                  y={SVG_HEIGHT - BOTTOM_MARGIN + 50}
                  textAnchor="middle"
                  fontSize={22}
                  fill="rgba(255,255,255,0.3)"
                >
                  ?
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
