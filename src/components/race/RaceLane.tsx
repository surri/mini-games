import { motion } from 'framer-motion'
import type { Player, Obstacle, PlayerEffects } from '../../types'
import { ObstacleMarker } from './ObstacleMarker'

interface Props {
  player: Player
  position: number
  isWinner: boolean
  isLoser: boolean
  rank: number | null
  obstacles: Obstacle[]
  effects: PlayerEffects | null
}

const RANK_LABELS = ['🥇', '🥈', '🥉']

export function RaceLane({ player, position, isWinner, isLoser, rank, obstacles, effects }: Props) {
  const isStunned = effects?.stunned ?? false
  const isSlowed = effects?.slowed ?? false
  const isBoosted = effects?.boosted ?? false
  const flashColor = effects?.flashColor ?? null
  const isFinished = rank !== null

  const laneBackground = flashColor
    ? flashColor
    : isFinished
      ? isWinner
        ? 'rgba(255, 215, 0, 0.15)'
        : isLoser
          ? 'rgba(255, 68, 68, 0.1)'
          : 'rgba(255,255,255,0.05)'
      : 'rgba(255,255,255,0.05)'

  const characterAnimation = isStunned
    ? { left: `${position}%`, x: [0, -3, 3, -3, 3, 0] }
    : { left: `${position}%` }

  const characterTransition = isStunned
    ? { x: { duration: 0.4, repeat: Infinity } }
    : { type: 'spring' as const, stiffness: 120, damping: 20 }

  const rankLabel = rank !== null
    ? rank < 3
      ? RANK_LABELS[rank]
      : `${rank + 1}등`
    : null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: laneBackground,
        borderRadius: 12,
        border: isFinished && isWinner
          ? '2px solid #FFD700'
          : isFinished && isLoser
            ? '2px solid #FF4444'
            : '1px solid rgba(255,255,255,0.1)',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ width: 50, textAlign: 'right', flexShrink: 0 }}>
        {isFinished && rankLabel ? (
          <span style={{ fontSize: rank !== null && rank < 3 ? 20 : 12, fontWeight: 700 }}>
            {rankLabel}
          </span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600 }}>{player.name}</span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          position: 'relative',
          height: 40,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: '#FFD700',
          }}
        />

        {obstacles.map((obs) => (
          <ObstacleMarker
            key={obs.id}
            type={obs.type}
            position={obs.position}
            triggered={obs.triggered}
          />
        ))}

        <motion.div
          animate={characterAnimation}
          transition={characterTransition}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 28,
            opacity: isSlowed ? 0.5 : 1,
            filter: isBoosted ? 'drop-shadow(0 0 8px #FF4422)' : 'none',
            zIndex: 10,
          }}
        >
          {player.character}
          {isStunned && (
            <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 14 }}>
              💫
            </span>
          )}
        </motion.div>

        {isFinished && (
          <div style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: '#888',
            zIndex: 10,
          }}>
            {player.name}
          </div>
        )}
      </div>
    </div>
  )
}
