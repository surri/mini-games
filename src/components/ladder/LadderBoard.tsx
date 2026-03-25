import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  segmentsToSVGPath,
  getLineX as getLineXNormalized,
  getPositionAtProgress,
} from '../../lib/ladderEngine'
import { toStringArray } from '../../lib/room'
import { LADDER_CONFIG } from '../../lib/ladderConfig'
import { useLadderAnimation } from '../../hooks/useLadderAnimation'
import type { Player, LadderState } from '../../types'

interface Props {
  players: Record<string, Player>
  ladder: LadderState
  myPlayerId: string
  onTapCharacter?: (playerId: string) => void
  onPlayerFinished?: (playerId: string) => void
}

const SVG_WIDTH = 1000
const SVG_HEIGHT = 1200
const TOP_MARGIN = 100
const BOTTOM_MARGIN = 100

function getLineX(lineIndex: number, lineCount: number): number {
  return getLineXNormalized(lineIndex, lineCount) * SVG_WIDTH
}

export function LadderBoard({ players, ladder, myPlayerId, onTapCharacter, onPlayerFinished }: Props) {
  const {
    bridges,
    playerAssignments,
    results,
    paths,
    animationStatus,
    startedPlayers,
    finishedPlayers,
  } = ladder

  const started = toStringArray(startedPlayers)
  const finished = toStringArray(finishedPlayers)

  const { getProgress } = useLadderAnimation(started, onPlayerFinished)

  const lineCount = Object.keys(playerAssignments ?? {}).length
  const bridgeList = useMemo(() => Object.values(bridges ?? {}), [bridges])

  const playerColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    const ids = Object.keys(playerAssignments ?? {})
    ids.forEach((id, i) => {
      map[id] = LADDER_CONFIG.COLORS[i % LADDER_CONFIG.COLORS.length]
    })
    return map
  }, [playerAssignments])

  const sortedPlayerEntries = useMemo(() => {
    const assignments = playerAssignments ?? {}
    return Object.entries(assignments).sort(([, a], [, b]) => a - b)
  }, [playerAssignments])

  const handleTap = useCallback((playerId: string) => {
    if (playerId !== myPlayerId) return
    if (started.includes(playerId)) return
    onTapCharacter?.(playerId)
  }, [myPlayerId, started, onTapCharacter])

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      {animationStatus !== 'idle' && !started.includes(myPlayerId) && (
        <p style={{ textAlign: 'center', color: '#FFEAA7', fontSize: 14, marginBottom: 8 }}>
          내 캐릭터를 터치해서 출발!
        </p>
      )}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        style={{ width: '100%', height: 'auto', fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', emoji" }}
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
          const y = TOP_MARGIN + bridge.yPosition * (SVG_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN)
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

        {paths && sortedPlayerEntries.map(([playerId]) => {
          const path = paths[playerId]
          if (!path) return null

          const progress = getProgress(playerId)
          if (progress <= 0) return null

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
              transition={{ duration: 0.05, ease: 'linear' }}
            />
          )
        })}

        {sortedPlayerEntries.map(([playerId, lineIndex]) => {
          const player = players[playerId]
          if (!player) return null

          const isStarted = started.includes(playerId)
          const isFinished = finished.includes(playerId)
          const isMe = playerId === myPlayerId
          const canTap = isMe && !isStarted && animationStatus !== 'idle'
          const color = playerColorMap[playerId]

          const progress = getProgress(playerId)
          const path = paths?.[playerId]

          let charX = getLineX(lineIndex, lineCount)
          let charY = TOP_MARGIN - 20

          if (isStarted && path && progress > 0) {
            const pos = getPositionAtProgress(
              path.segments,
              progress,
              SVG_WIDTH,
              SVG_HEIGHT,
              TOP_MARGIN,
              BOTTOM_MARGIN
            )
            charX = pos.x
            charY = pos.y
          }

          return (
            <g
              key={`player-${playerId}`}
              onClick={() => canTap && handleTap(playerId)}
              style={{ cursor: canTap ? 'pointer' : 'default' }}
            >
              <text
                x={charX}
                y={charY}
                textAnchor="middle"
                fontSize={isStarted ? 36 : 40}
                dominantBaseline="central"
                style={{
                  filter: canTap
                    ? 'drop-shadow(0 0 12px rgba(16,185,129,0.8))'
                    : isStarted && !isFinished
                      ? `drop-shadow(0 0 6px ${color})`
                      : 'none',
                  transition: 'filter 0.2s',
                }}
              >
                {player.character}
              </text>

              {canTap && (
                <>
                  <circle
                    cx={charX}
                    cy={charY}
                    r={30}
                    fill="transparent"
                    stroke="rgba(16,185,129,0.6)"
                    strokeWidth={4}
                  >
                    <animate
                      attributeName="r"
                      values="28;36;28"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <rect
                    x={charX - 35}
                    y={charY - 35}
                    width={70}
                    height={70}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />
                </>
              )}
            </g>
          )
        })}

        {Array.from({ length: lineCount }, (_, i) => {
          const x = getLineX(i, lineCount)
          const result = (results ?? {})[String(i)]
          if (!result) return null

          const isRevealed = animationStatus === 'revealed' ||
            finished.some((pid) => {
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
